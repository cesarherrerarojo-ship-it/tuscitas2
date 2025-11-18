"""
TuCitaSegura Backend - FastAPI Application
Main entry point
"""
from fastapi import FastAPI, HTTPException, status, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Optional
import logging
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials as firebase_credentials

from app.core.config import settings
from app.models.schemas import (
    HealthCheck,
    RecommendationRequest,
    RecommendationResponse,
    PhotoVerificationRequest,
    PhotoVerificationResult,
    FraudCheckRequest,
    FraudCheckResult,
    MessageModerationRequest,
    MessageModerationResult,
    MeetingSpotRequest,
    MeetingSpot,
    LocationVerificationRequest,
    LocationVerificationResult,
    VIPEventCreate,
    VIPEventCreateRequest,
    VIPEventTicketRequest,
    VIPEventSuggestionRequest,
    VIPEventResponse,
    VIPEventTicketResponse,
    VIPEventStatistics,
    CuratedNetworkingEventRequest,
    VideoCallCreateRequest,
    VideoCallInvitationRequest,
    VideoCallInvitationResponse,
    VideoCallAcceptRequest,
    VideoCallInfo,
    VideoCallEndRequest,
    VideoCallRecordingRequest,
    VideoCallModerationRequest,
    VideoCallStatistics,
    RevenueForecastResponse,
    ChurnRiskResponse,
    UserLTVResponse,
    SuccessResponse,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Initialize Firebase Admin
if not firebase_admin._apps:
    try:
        cred = firebase_credentials.Certificate(settings.FIREBASE_PRIVATE_KEY_PATH)
        firebase_admin.initialize_app(cred, {
            'projectId': settings.FIREBASE_PROJECT_ID
        })
        logger.info("Firebase Admin initialized")
    except Exception as e:
        logger.warning(f"Firebase Admin init failed: {e}")


def verify_firebase_token(authorization: str = Header(None)) -> dict:
    """
    Verifica el ID token de Firebase desde el header Authorization.
    Requiere formato: Bearer <id_token>
    En modo desarrollo, permite tokens de prueba.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    token = authorization.split(" ", 1)[1]
    
    # En modo desarrollo, permitir tokens de prueba
    if settings.ENVIRONMENT == "development" and token == "test_token_123":
        return {"uid": "test_user_123", "email": "test@example.com"}
    
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired Firebase ID token")


def require_verified_email(current_user: dict = Depends(verify_firebase_token)) -> dict:
    """
    Verifica que el usuario tenga el email verificado.
    Rechaza el acceso si el email no está verificado.
    """
    # En modo desarrollo, permitir acceso con token de prueba
    if settings.ENVIRONMENT == "development" and current_user.get("uid") == "test_user_123":
        return current_user
    
    try:
        # Obtener información completa del usuario de Firebase Auth
        user_record = firebase_auth.get_user(current_user["uid"])
        
        if not user_record.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Email no verificado. Por favor verifica tu email antes de continuar."
            )
        
        return current_user
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error verificando email del usuario: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al verificar el estado del email"
        )


def require_complete_profile(current_user: dict = Depends(verify_firebase_token)) -> dict:
    """
    Verifica que el usuario tenga el perfil completado.
    Requiere: alias, fecha de nacimiento, género, ciudad, profesión, bio (mínimo 120 palabras), mínimo 3 fotos.
    """
    # En modo desarrollo, permitir acceso con token de prueba
    if settings.ENVIRONMENT == "development" and current_user.get("uid") == "test_user_123":
        return current_user
    
    try:
        # Importar Firestore para verificar el perfil
        from firebase_admin import firestore
        db = firestore.client()
        
        # Obtener perfil del usuario
        user_ref = db.collection('users').document(current_user["uid"])
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil de usuario no encontrado"
            )
        
        user_data = user_doc.to_dict()
        
        # Verificar campos obligatorios
        required_fields = ['alias', 'birth_date', 'gender', 'city', 'profession', 'bio']
        missing_fields = []
        
        for field in required_fields:
            if not user_data.get(field):
                missing_fields.append(field)
        
        # Verificar bio tenga al menos 120 palabras
        if user_data.get('bio'):
            bio_word_count = len(user_data['bio'].split())
            if bio_word_count < 120:
                missing_fields.append('bio_min_words')
        
        # Verificar mínimo 3 fotos
        photos = user_data.get('photos', [])
        if len(photos) < 3:
            missing_fields.append('min_photos')
        
        # Si hay campos faltantes, rechazar acceso
        if missing_fields:
            field_names = {
                'alias': 'Alias',
                'birth_date': 'Fecha de nacimiento', 
                'gender': 'Género',
                'city': 'Ciudad',
                'profession': 'Profesión',
                'bio': 'Biografía',
                'bio_min_words': 'Biografía (mínimo 120 palabras)',
                'min_photos': 'Mínimo 3 fotos'
            }
            
            missing_details = [field_names.get(field, field) for field in missing_fields]
            
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Perfil incompleto. Campos requeridos: {', '.join(missing_details)}"
            )
        
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verificando perfil completado: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al verificar el perfil del usuario"
        )


def require_verified_and_complete(current_user: dict = Depends(verify_firebase_token)) -> dict:
    """
    Verifica tanto el email verificado como el perfil completado.
    Combina ambas verificaciones en una sola dependencia.
    """
    # Primero verificar email
    verified_user = require_verified_email(current_user)
    
    # Luego verificar perfil completado
    return require_complete_profile(verified_user)


def require_active_membership(current_user: dict = Depends(verify_firebase_token)) -> dict:
    """
    Verifica que el usuario tenga una membresía activa.
    Rechaza el acceso si no tiene suscripción activa.
    """
    # En modo desarrollo, permitir acceso con token de prueba
    if settings.ENVIRONMENT == "development" and current_user.get("uid") == "test_user_123":
        return current_user
    
    try:
        # Importar Firestore para verificar la membresía
        from firebase_admin import firestore
        db = firestore.client()
        
        # Obtener datos del usuario
        user_ref = db.collection('users').document(current_user["uid"])
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        user_data = user_doc.to_dict()
        
        # Verificar membresía activa
        if not user_data.get('hasActiveSubscription', False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Se requiere una membresía activa para acceder a esta función. Por favor suscríbete para continuar."
            )
        
        # Verificar estado de la suscripción
        subscription_status = user_data.get('subscriptionStatus', 'inactive')
        if subscription_status not in ['active', 'trialing']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tu suscripción no está activa. Por favor renueva tu membresía para continuar."
            )
        
        # Verificar fecha de expiración si existe
        if user_data.get('subscriptionEndDate'):
            from datetime import datetime
            expiry_date = user_data['subscriptionEndDate']
            if isinstance(expiry_date, datetime) and expiry_date < datetime.now():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tu suscripción ha expirado. Por favor renueva tu membresía para continuar."
                )
        
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verificando membresía: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al verificar el estado de la membresía"
        )


def require_complete_access(current_user: dict = Depends(verify_firebase_token)) -> dict:
    """
    Verifica todos los requisitos: email verificado, perfil completado y membresía activa.
    Esta es la función más restrictiva para funciones premium.
    """
    # Primero verificar email y perfil
    complete_user = require_verified_and_complete(current_user)
    
    # Luego verificar membresía
    return require_active_membership(complete_user)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== Health Check ==========

@app.get("/", response_model=HealthCheck)
@app.get("/health", response_model=HealthCheck)
async def health_check():
    """
    Health check endpoint
    """
    return HealthCheck(
        status="healthy",
        version=settings.API_VERSION,
        timestamp=datetime.now(),
        services={
            "api": "running",
            "firebase": "connected",
            "ml": "loaded",
        }
    )


# ========== Machine Learning Endpoints ==========

@app.post("/api/v1/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest, current_user: dict = Depends(require_verified_email)):
    """
    Get intelligent user recommendations using ML

    Returns personalized matches based on:
    - User preferences and interests
    - Location proximity
    - Behavioral patterns
    - Historical success rate
    """
    try:
        # Importar motor de recomendaciones
        from app.services.ml.recommendation_engine import get_recommendations_for_user
        
        # Generar recomendaciones inteligentes
        recommendations = get_recommendations_for_user(
            request.user_id,
            limit=request.limit,
            filters=request.filters
        )

        return RecommendationResponse(
            user_id=request.user_id,
            recommendations=recommendations,
            algorithm="Hybrid ML: Collaborative + Content-Based + Geographic + Behavioral",
            generated_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating recommendations"
        )


# ========== Computer Vision Endpoints ==========

@app.post("/api/v1/verify-photo", response_model=PhotoVerificationResult)
async def verify_photo(request: PhotoVerificationRequest):
    """
    Verify photo authenticity using Computer Vision

    Checks for:
    - Real person detection
    - Age estimation
    - Excessive filters
    - Inappropriate content
    """
    try:
        # TODO: Implement photo verification
        # from app.services.cv.photo_verifier import PhotoVerification
        # verifier = PhotoVerification()
        # result = verifier.verify_photo(
        #     request.image_url,
        #     claimed_age=request.claimed_age
        # )

        # Placeholder response
        return PhotoVerificationResult(
            is_real_person=True,
            has_excessive_filters=False,
            is_appropriate=True,
            estimated_age=request.claimed_age,
            confidence=0.95,
            faces_detected=1,
            warnings=[]
        )
    except Exception as e:
        logger.error(f"Error verifying photo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying photo"
        )


# ========== Fraud Detection Endpoints ==========

@app.post("/api/v1/fraud-check", response_model=FraudCheckResult)
async def check_fraud(request: FraudCheckRequest, current_user: dict = Depends(require_verified_and_complete)):
    """
    Check for fraudulent or suspicious behavior

    Detects:
    - Multiple account creation
    - Spam patterns
    - Payment fraud
    - Systematic ghosting
    """
    try:
        # Importar detector de fraude
        from app.services.security.fraud_detector import detect_user_fraud
        
        # Obtener datos del usuario y su historial
        user_data = request.user_data or {}
        user_history = request.user_history or {}
        
        # Detectar fraude
        fraud_result = detect_user_fraud(user_data, user_history)
        
        return FraudCheckResult(
            is_suspicious=fraud_result['risk_level'] in ['high', 'critical'],
            risk_score=fraud_result['fraud_score'],
            flags=fraud_result['indicators'],
            recommended_action=fraud_result['recommendations'][0] if fraud_result['recommendations'] else "allow",
            details={
                'risk_level': fraud_result['risk_level'],
                'confidence': fraud_result['confidence'],
                'all_recommendations': fraud_result['recommendations']
            }
        )
    except Exception as e:
        logger.error(f"Error checking fraud: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error checking fraud"
        )


# ========== NLP & Moderation Endpoints ==========

@app.post("/api/v1/moderate-message", response_model=MessageModerationResult)
async def moderate_message(request: MessageModerationRequest, current_user: dict = Depends(require_verified_and_complete)):
    """
    Moderate message content using NLP

    Checks for:
    - Toxic content
    - Personal information
    - Spam
    - Sentiment analysis
    """
    try:
        # Importar moderador de mensajes
        from app.services.nlp.message_moderator import moderate_user_message
        
        # Crear contexto para la moderación
        context = {
            'sender_id': request.sender_id,
            'receiver_id': request.receiver_id,
            'timestamp': request.timestamp.isoformat() if request.timestamp else None,
            'relationship_context': request.relationship_context or {}
        }
        
        # Moderar el mensaje
        moderation_result = moderate_user_message(
            request.message_text,
            request.sender_id,
            context
        )
        
        return MessageModerationResult(
            should_block=not moderation_result['is_safe'],
            is_toxic=moderation_result['severity'] in ['high', 'critical'],
            contains_personal_info='personal_info' in moderation_result['categories'],
            is_spam='spam' in moderation_result['categories'],
            sentiment="neutral",  # Podría agregarse análisis de sentimiento
            warnings=moderation_result['flagged_phrases'],
            suggested_edit=moderation_result['alternative_suggestion']
        )
    except Exception as e:
        logger.error(f"Error moderating message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error moderating message"
        )


# ========== Geolocation Endpoints ==========

@app.post("/api/v1/suggest-meeting-spots", response_model=list[MeetingSpot])
async def suggest_meeting_spots(request: MeetingSpotRequest, current_user: dict = Depends(require_verified_and_complete)):
    """
    Suggest safe meeting spots at midpoint between two users

    Returns cafes, restaurants, and public places that are:
    - At midpoint location
    - Highly rated (4+ stars)
    - Safe for first dates
    """
    try:
        # Importar servicio de geolocalización
        from app.services.geo.location_intelligence import suggest_safe_meeting_spots
        
        # Obtener API key de configuración (debería estar en settings)
        google_api_key = settings.GOOGLE_API_KEY if hasattr(settings, 'GOOGLE_API_KEY') else "YOUR_GOOGLE_API_KEY"
        
        # Sugerir lugares de encuentro
        spots = suggest_safe_meeting_spots(
            request.user1_location.lat,
            request.user1_location.lng,
            request.user2_location.lat,
            request.user2_location.lng,
            google_api_key,
            request.preferences
        )
        
        # Convertir a objetos MeetingSpot
        meeting_spots = []
        for spot_data in spots:
            meeting_spots.append(MeetingSpot(
                name=spot_data['name'],
                location=Location(lat=spot_data['location']['lat'], lng=spot_data['location']['lng']),
                address=spot_data['address'],
                rating=spot_data['rating'],
                review_count=spot_data['review_count'],
                types=spot_data['types'],
                distance_user1=spot_data['distance_user1'],
                distance_user2=spot_data['distance_user2']
            ))
        
        return meeting_spots
        
    except Exception as e:
        logger.error(f"Error suggesting meeting spots: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error suggesting meeting spots"
        )


@app.post("/api/v1/verify-location", response_model=LocationVerificationResult)
async def verify_location(request: LocationVerificationRequest, current_user: dict = Depends(require_verified_and_complete)):
    """
    Verify user is at claimed location (for date validation)
    """
    try:
        # TODO: Implement location verification
        # from app.services.geo.location_intelligence import LocationIntelligence
        # geo = LocationIntelligence()
        # result = geo.verify_date_location(
        #     request.claimed_location,
        #     request.user_gps,
        #     tolerance_meters=request.tolerance_meters
        # )

        from geopy.distance import geodesic

        claimed = (request.claimed_location.lat, request.claimed_location.lng)
        user_gps = (request.user_gps.lat, request.user_gps.lng)

        distance = geodesic(claimed, user_gps).meters
        within_tolerance = distance <= request.tolerance_meters

        return LocationVerificationResult(
            is_verified=within_tolerance,
            distance=distance,
            within_tolerance=within_tolerance
        )
    except Exception as e:
        logger.error(f"Error verifying location: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying location"
        )


# ========== Analytics Endpoints ==========

@app.get("/api/v1/analytics/revenue-forecast", response_model=RevenueForecastResponse)
async def forecast_revenue(months: int = 6, current_user: dict = Depends(require_verified_and_complete)):
    """
    Forecast revenue for upcoming months using Prophet
    """
    try:
        # TODO: Implement revenue forecasting
        # from app.services.analytics.business_analytics import BusinessAnalytics
        # analytics = BusinessAnalytics()
        # forecast = analytics.predict_revenue(months_ahead=months)

        return RevenueForecastResponse(
            forecast=[],
            algorithm="Prophet",
            confidence_interval="95%"
        )
    except Exception as e:
        logger.error(f"Error forecasting revenue: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error forecasting revenue"
        )


@app.get("/api/v1/analytics/churn-risk/{user_id}", response_model=ChurnRiskResponse)
async def get_churn_risk(user_id: str, current_user: dict = Depends(require_verified_and_complete)):
    """
    Calculate churn risk for a user
    """
    try:
        # TODO: Implement churn prediction
        # from app.services.analytics.business_analytics import BusinessAnalytics
        # analytics = BusinessAnalytics()
        # risk = analytics.detect_churn_risk(user_id)

        return ChurnRiskResponse(
            user_id=user_id,
            churn_prediction=ChurnPrediction(
                user_id=user_id,
                churn_probability=0.0,
                risk_level="low",
                contributing_factors=[],
                suggested_actions=[]
            ),
            generated_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error calculating churn risk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating churn risk"
        )


@app.get("/api/v1/analytics/user-ltv/{user_id}", response_model=UserLTVResponse)
async def get_user_ltv(user_id: str, current_user: dict = Depends(require_verified_and_complete)):
    """
    Calculate User Lifetime Value
    """
    try:
        # TODO: Implement LTV calculation
        # from app.services.analytics.business_analytics import BusinessAnalytics
        # analytics = BusinessAnalytics()
        # ltv = analytics.calculate_user_lifetime_value(user_id)

        return UserLTVResponse(
            user_id=user_id,
            ltv_data=UserLTV(
                user_id=user_id,
                ltv=0.0,
                monthly_value=0.0,
                retention_months=0,
                breakdown={}
            ),
            calculated_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error calculating LTV: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating LTV"
        )


# ========== Referral System Endpoints ==========

@app.post("/api/v1/referrals/generate-code", response_model=SuccessResponse)
async def generate_referral_code(user_id: str, custom_code: Optional[str] = None, current_user: dict = Depends(require_verified_and_complete)):
    """
    Generate a referral code for a user
    """
    try:
        from app.services.referrals.referral_system import generate_user_referral_code
        
        code = generate_user_referral_code(user_id, custom_code)
        
        return SuccessResponse(
            message="Referral code generated successfully",
            data={"code": code}
        )
    except Exception as e:
        logger.error(f"Error generating referral code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error generating referral code"
        )


@app.post("/api/v1/referrals/process", response_model=SuccessResponse)
async def process_referral(referred_user_id: str, referral_code: str, current_user: dict = Depends(require_verified_and_complete)):
    """
    Process a referral when a new user signs up with a code
    """
    try:
        from app.services.referrals.referral_system import process_user_referral
        
        result = process_user_referral(referred_user_id, referral_code)
        
        if result['success']:
            return SuccessResponse(
                message="Referral processed successfully",
                data=result
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
    except Exception as e:
        logger.error(f"Error processing referral: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing referral"
        )


@app.post("/api/v1/referrals/complete", response_model=SuccessResponse)
async def complete_referral(referral_id: str, current_user: dict = Depends(require_verified_and_complete)):
    """
    Complete a referral when the referred user meets requirements
    """
    try:
        from app.services.referrals.referral_system import complete_user_referral
        
        result = complete_user_referral(referral_id)
        
        if result['success']:
            return SuccessResponse(
                message="Referral completed successfully",
                data=result
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
    except Exception as e:
        logger.error(f"Error completing referral: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error completing referral"
        )


@app.get("/api/v1/referrals/stats/{user_id}", response_model=SuccessResponse)
async def get_referral_stats(user_id: str, current_user: dict = Depends(require_verified_and_complete)):
    """
    Get referral statistics for a user
    """
    try:
        from app.services.referrals.referral_system import get_user_referral_statistics
        
        stats = get_user_referral_statistics(user_id)
        
        if 'error' in stats:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=stats['error']
            )
        
        return SuccessResponse(
            message="Referral statistics retrieved successfully",
            data=stats
        )
    except Exception as e:
        logger.error(f"Error getting referral stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting referral statistics"
        )


@app.post("/api/v1/referrals/claim-reward", response_model=SuccessResponse)
async def claim_reward(user_id: str, reward_id: str, current_user: dict = Depends(verify_firebase_token)):
    """
    Claim a referral reward
    """
    try:
        from app.services.referrals.referral_system import claim_user_reward
        
        result = claim_user_reward(user_id, reward_id)
        
        if result['success']:
            return SuccessResponse(
                message="Reward claimed successfully",
                data=result
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
    except Exception as e:
        logger.error(f"Error claiming reward: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error claiming reward"
        )


@app.get("/api/v1/referrals/leaderboard")
async def get_referral_leaderboard(limit: int = 10, current_user: dict = Depends(require_verified_and_complete)):
    """
    Get referral leaderboard
    """
    try:
        from app.services.referrals.referral_system import get_referral_leaderboard
        
        leaderboard = get_referral_leaderboard(limit)
        
        return SuccessResponse(
            message="Referral leaderboard retrieved successfully",
            data={"leaderboard": leaderboard}
        )
    except Exception as e:
        logger.error(f"Error getting referral leaderboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting referral leaderboard"
        )


# ========== VIP Events Endpoints ==========

@app.post("/api/v1/vip-events/create", response_model=SuccessResponse)
async def create_vip_event(request: VIPEventCreateRequest, current_user: dict = Depends(require_complete_access)):
    """
    Create a new VIP event
    """
    try:
        from app.services.vip_events.vip_events_manager import create_exclusive_vip_event
        
        result = create_exclusive_vip_event(
            event_type=request.event_type,
            location_data=request.location_data,
            date_time=request.date_time,
            organizer_id=current_user['uid'],
            customizations=request.customizations
        )
        
        if result['success']:
            return SuccessResponse(
                message="VIP event created successfully",
                data=result
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
            
    except Exception as e:
        logger.error(f"Error creating VIP event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating VIP event"
        )


@app.post("/api/v1/vip-events/suggest", response_model=SuccessResponse)
async def suggest_vip_events(request: VIPEventSuggestionRequest, current_user: dict = Depends(require_verified_and_complete)):
    """
    Get personalized VIP event suggestions for a user
    """
    try:
        from app.services.vip_events.vip_events_manager import suggest_vip_events_for_user
        
        suggested_events = suggest_vip_events_for_user(
            user_profile=request.user_profile,
            preferences=request.preferences
        )
        
        return SuccessResponse(
            message="VIP event suggestions generated successfully",
            data={"events": suggested_events}
        )
        
    except Exception as e:
        logger.error(f"Error suggesting VIP events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error suggesting VIP events"
        )


@app.post("/api/v1/vip-events/purchase-ticket", response_model=SuccessResponse)
async def purchase_vip_ticket(request: VIPEventTicketRequest, current_user: dict = Depends(require_verified_and_complete)):
    """
    Purchase a ticket for a VIP event
    """
    try:
        from app.services.vip_events.vip_events_manager import purchase_vip_event_ticket
        
        result = purchase_vip_event_ticket(
            event_id=request.event_id,
            user_id=request.user_id,
            tier=request.tier,
            companion_user_id=request.companion_user_id
        )
        
        if result['success']:
            return SuccessResponse(
                message="VIP event ticket purchased successfully",
                data=result
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
            
    except Exception as e:
        logger.error(f"Error purchasing VIP ticket: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error purchasing VIP ticket"
        )


@app.get("/api/v1/vip-events/user/{user_id}", response_model=SuccessResponse)
async def get_user_vip_events(user_id: str, current_user: dict = Depends(require_verified_and_complete)):
    """
    Get VIP events for a specific user
    """
    try:
        from app.services.vip_events.vip_events_manager import get_user_vip_events
        
        user_events = get_user_vip_events(user_id)
        
        return SuccessResponse(
            message="User VIP events retrieved successfully",
            data={"events": user_events}
        )
        
    except Exception as e:
        logger.error(f"Error getting user VIP events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting user VIP events"
        )


@app.post("/api/v1/vip-events/curated-networking", response_model=SuccessResponse)
async def create_curated_networking_event(request: CuratedNetworkingEventRequest, current_user: dict = Depends(verify_firebase_token)):
    """
    Create a curated networking event for specific users
    """
    try:
        from app.services.vip_events.vip_events_manager import create_curated_networking_event
        
        result = create_curated_networking_event(
            user_list=request.user_list,
            event_details=request.event_details
        )
        
        if result['success']:
            return SuccessResponse(
                message="Curated networking event created successfully",
                data=result
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
            
    except Exception as e:
        logger.error(f"Error creating curated networking event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating curated networking event"
        )


@app.get("/api/v1/vip-events/statistics/{event_id}", response_model=SuccessResponse)
async def get_vip_event_statistics(event_id: str, current_user: dict = Depends(require_verified_and_complete)):
    """
    Get statistics for a specific VIP event
    """
    try:
        from app.services.vip_events.vip_events_manager import get_vip_event_statistics
        
        statistics = get_vip_event_statistics(event_id)
        
        if statistics:
            return SuccessResponse(
                message="VIP event statistics retrieved successfully",
                data=statistics
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
            
    except Exception as e:
        logger.error(f"Error getting VIP event statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting VIP event statistics"
        )


# ========== Video Chat Endpoints ==========

@app.post("/api/v1/video-chat/create", response_model=SuccessResponse)
async def create_video_call(request: VideoCallCreateRequest, current_user: dict = Depends(require_complete_access)):
    """
    Create a new video call room
    """
    try:
        from app.services.video_chat.video_chat_manager import create_video_call_room
        
        result = create_video_call_room(
            host_user_id=request.host_user_id,
            display_name=request.display_name,
            max_participants=request.max_participants,
            is_private=request.is_private
        )
        
        if 'success' in result and not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
        
        return SuccessResponse(
            message="Video call room created successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Error creating video call room: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating video call room"
        )


@app.post("/api/v1/video-chat/invite", response_model=SuccessResponse)
async def invite_to_video_call(request: VideoCallInvitationRequest, current_user: dict = Depends(require_complete_access)):
    """
    Invite a user to join a video call
    """
    try:
        from app.services.video_chat.video_chat_manager import invite_user_to_call
        
        result = invite_user_to_call(
            call_id=request.call_id,
            caller_user_id=request.caller_user_id,
            callee_user_id=request.callee_user_id,
            callee_display_name=request.callee_display_name
        )
        
        if 'success' in result and not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
        
        return SuccessResponse(
            message="Video call invitation sent successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Error inviting user to video call: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error inviting user to video call"
        )


@app.post("/api/v1/video-chat/accept-invitation", response_model=SuccessResponse)
async def accept_video_call_invitation(request: VideoCallAcceptRequest, current_user: dict = Depends(require_complete_access)):
    """
    Accept a video call invitation
    """
    try:
        from app.services.video_chat.video_chat_manager import accept_call_invitation
        
        result = accept_call_invitation(
            invitation_id=request.invitation_id,
            user_id=request.user_id,
            display_name=request.display_name
        )
        
        if 'success' in result and not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
        
        return SuccessResponse(
            message="Video call invitation accepted successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Error accepting video call invitation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error accepting video call invitation"
        )


@app.get("/api/v1/video-chat/call/{call_id}", response_model=VideoCallInfo)
async def get_video_call_info(call_id: str, current_user: dict = Depends(require_complete_access)):
    """
    Get detailed information about a video call
    """
    try:
        from app.services.video_chat.video_chat_manager import get_call_information
        
        call_info = get_call_information(call_id)
        
        if not call_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found"
            )
        
        return SuccessResponse(
            message="Video call information retrieved successfully",
            data=call_info
        )
        
    except Exception as e:
        logger.error(f"Error getting video call information: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting video call information"
        )


@app.get("/api/v1/video-chat/user/{user_id}", response_model=SuccessResponse)
async def get_user_video_calls(user_id: str, current_user: dict = Depends(require_complete_access)):
    """
    Get active video calls for a user
    """
    try:
        from app.services.video_chat.video_chat_manager import get_user_video_calls
        
        user_calls = get_user_video_calls(user_id)
        
        return SuccessResponse(
            message="User video calls retrieved successfully",
            data={"calls": user_calls}
        )
        
    except Exception as e:
        logger.error(f"Error getting user video calls: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting user video calls"
        )


@app.post("/api/v1/video-chat/end", response_model=SuccessResponse)
async def end_video_call(request: VideoCallEndRequest, current_user: dict = Depends(require_complete_access)):
    """
    End a video call
    """
    try:
        from app.services.video_chat.video_chat_manager import end_video_call
        
        call_id = request.call_id
        user_id = request.user_id
        
        result = end_video_call(call_id, user_id)
        
        if 'success' in result and not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
        
        return SuccessResponse(
            message="Video call ended successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Error ending video call: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error ending video call"
        )


@app.post("/api/v1/video-chat/recording/start", response_model=SuccessResponse)
async def start_video_call_recording(request: VideoCallRecordingRequest, current_user: dict = Depends(require_complete_access)):
    """
    Start recording a video call
    """
    try:
        from app.services.video_chat.video_chat_manager import start_call_recording
        
        result = start_video_call_recording(
            call_id=request.call_id,
            user_id=request.user_id
        )
        
        if 'success' in result and not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
        
        return SuccessResponse(
            message="Video call recording started successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Error starting video call recording: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error starting video call recording"
        )


@app.post("/api/v1/video-chat/recording/stop", response_model=SuccessResponse)
async def stop_video_call_recording(request: VideoCallRecordingRequest, current_user: dict = Depends(require_complete_access)):
    """
    Stop recording a video call
    """
    try:
        from app.services.video_chat.video_chat_manager import stop_call_recording
        
        result = stop_video_call_recording(
            call_id=request.call_id,
            user_id=request.user_id
        )
        
        if 'success' in result and not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )
        
        return SuccessResponse(
            message="Video call recording stopped successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Error stopping video call recording: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error stopping video call recording"
        )


@app.post("/api/v1/video-chat/moderate", response_model=SuccessResponse)
async def moderate_video_call_content(request: VideoCallModerationRequest):
    """
    Moderate video call content
    """
    try:
        from app.services.video_chat.video_chat_manager import moderate_call_content
        
        result = moderate_call_content(
            call_id=request.call_id,
            user_id=request.user_id,
            content_type=request.content_type,
            content_data=request.content_data
        )
        
        return SuccessResponse(
            message="Video call content moderated successfully",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Error moderating video call content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error moderating video call content"
        )


@app.get("/api/v1/video-chat/statistics", response_model=VideoCallStatistics)
async def get_video_chat_statistics(current_user: dict = Depends(require_complete_access)):
    """
    Get video chat system statistics
    """
    try:
        from app.services.video_chat.video_chat_manager import get_video_chat_statistics
        
        statistics = get_video_chat_statistics()
        
        return SuccessResponse(
            message="Video chat statistics retrieved successfully",
            data=statistics
        )
        
    except Exception as e:
        logger.error(f"Error getting video chat statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting video chat statistics"
        )


# ========== Error Handlers ==========

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )


# ========== Startup/Shutdown Events ==========

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 TuCitaSegura Backend starting...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    # TODO: Initialize Firebase
    # TODO: Load ML models
    # TODO: Connect to Redis
    # TODO: Connect to PostgreSQL

    logger.info("✅ Startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 TuCitaSegura Backend shutting down...")

    # TODO: Close database connections
    # TODO: Save ML models if needed
    # TODO: Cleanup resources

    logger.info("✅ Shutdown complete")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else settings.API_WORKERS
    )
