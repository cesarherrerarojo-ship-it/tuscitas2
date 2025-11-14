// functions/index.js (Node 18)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY);

admin.initializeApp();

// ============================================================================
// HELPER FUNCTIONS: Payment management
// ============================================================================

/**
 * Actualizar estado de membresía del usuario
 */
async function updateUserMembership(userId, status, subscriptionData = {}) {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);

  const updateData = {
    hasActiveSubscription: status === 'active',
    subscriptionStatus: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (subscriptionData.subscriptionId) {
    updateData.subscriptionId = subscriptionData.subscriptionId;
  }
  if (subscriptionData.startDate) {
    updateData.subscriptionStartDate = subscriptionData.startDate;
  }
  if (subscriptionData.endDate) {
    updateData.subscriptionEndDate = subscriptionData.endDate;
  }

  await userRef.update(updateData);
  console.log(`[updateUserMembership] User ${userId} membership updated: ${status}`);

  return updateData;
}

/**
 * Actualizar estado de seguro anti-plantón del usuario
 */
async function updateUserInsurance(userId, paymentData) {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);

  const updateData = {
    hasAntiGhostingInsurance: true,
    insurancePaymentId: paymentData.paymentId,
    insurancePurchaseDate: paymentData.purchaseDate || admin.firestore.FieldValue.serverTimestamp(),
    insuranceAmount: paymentData.amount || 120,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await userRef.update(updateData);
  console.log(`[updateUserInsurance] User ${userId} insurance activated`);

  return updateData;
}

/**
 * Registrar pago en colección de subscriptions
 */
async function logSubscription(userId, subscriptionData) {
  const db = admin.firestore();
  await db.collection('subscriptions').doc(subscriptionData.subscriptionId).set({
    userId,
    ...subscriptionData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`[logSubscription] Subscription logged for user ${userId}`);
}

/**
 * Registrar pago de seguro en colección de insurances
 */
async function logInsurance(userId, insuranceData) {
  const db = admin.firestore();
  await db.collection('insurances').doc(insuranceData.paymentId).set({
    userId,
    ...insuranceData,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log(`[logInsurance] Insurance logged for user ${userId}`);
}

// ============================================================================
// 1) CUSTOM CLAIMS: Al crear el doc de usuario, fijamos displayName y claims
// ============================================================================
exports.onUserDocCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, ctx) => {
    const uid = ctx.params.userId;
    const data = snap.data() || {};
    const name = (data.name || data.alias || '').toString().slice(0, 100);
    const gender = ['masculino','femenino'].includes(data.gender) ? data.gender : null;
    const userRole = data.userRole || 'regular';

    console.log(`[onUserDocCreate] Setting claims for ${uid}: role=${userRole}, gender=${gender}`);

    // Display name en Auth
    try {
      await admin.auth().updateUser(uid, { displayName: name });
      console.log(`[onUserDocCreate] Updated displayName for ${uid}`);
    } catch (e) {
      console.error(`[onUserDocCreate] Error updating displayName:`, e);
    }

    // Claims iniciales (conservando otros si existieran)
    try {
      const user = await admin.auth().getUser(uid);
      const oldClaims = user.customClaims || {};
      await admin.auth().setCustomClaims(uid, {
        ...oldClaims,
        role: userRole,
        gender: gender
      });
      console.log(`[onUserDocCreate] Custom claims set for ${uid}`);
    } catch (e) {
      console.error(`[onUserDocCreate] Error setting custom claims:`, e);
    }
  });

// ============================================================================
// 2) CUSTOM CLAIMS UPDATE: Propagar cambios de role/gender a claims
// ============================================================================
exports.onUserDocUpdate = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, ctx) => {
    const uid = ctx.params.userId;
    const before = change.before.data();
    const after = change.after.data();

    // Solo actualizar claims si role o gender cambiaron
    const roleChanged = before.userRole !== after.userRole;
    const genderChanged = before.gender !== after.gender;

    if (!roleChanged && !genderChanged) {
      console.log(`[onUserDocUpdate] No role/gender changes for ${uid}, skipping`);
      return null;
    }

    const newRole = after.userRole || 'regular';
    const newGender = ['masculino','femenino'].includes(after.gender) ? after.gender : null;

    console.log(`[onUserDocUpdate] Updating claims for ${uid}: role=${newRole}, gender=${newGender}`);

    try {
      const user = await admin.auth().getUser(uid);
      const oldClaims = user.customClaims || {};
      await admin.auth().setCustomClaims(uid, {
        ...oldClaims,
        role: newRole,
        gender: newGender
      });
      console.log(`[onUserDocUpdate] Claims updated for ${uid}`);
    } catch (e) {
      console.error(`[onUserDocUpdate] Error updating claims:`, e);
    }

    return null;
  });

// ============================================================================
// 3) CHAT ACL: Sincroniza ACL de chats en Storage cuando cambian participantes
// ============================================================================
exports.syncChatACL = functions.firestore
  .document('conversations/{conversationId}')
  .onWrite(async (change, ctx) => {
    const conversationId = ctx.params.conversationId;
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;

    const afterSet = new Set((after?.participants || []).map(String));
    const beforeSet = new Set((before?.participants || []).map(String));

    const added = [...afterSet].filter(x => !beforeSet.has(x));
    const removed = [...beforeSet].filter(x => !afterSet.has(x));

    console.log(`[syncChatACL] Conversation ${conversationId}: +${added.length} -${removed.length} participants`);

    if (added.length === 0 && removed.length === 0) {
      console.log(`[syncChatACL] No changes, skipping`);
      return null;
    }

    const bucket = admin.storage().bucket();

    try {
      await Promise.all([
        ...added.map(uid => {
          console.log(`[syncChatACL] Adding ACL for ${uid} in ${conversationId}`);
          return bucket.file(`chat_attachments/${conversationId}/__acl__/${uid}`).save('');
        }),
        ...removed.map(uid => {
          console.log(`[syncChatACL] Removing ACL for ${uid} in ${conversationId}`);
          return bucket.file(`chat_attachments/${conversationId}/__acl__/${uid}`).delete({ ignoreNotFound: true });
        }),
      ]);
      console.log(`[syncChatACL] ACL sync complete for ${conversationId}`);
    } catch (e) {
      console.error(`[syncChatACL] Error syncing ACL:`, e);
    }

    return null;
  });

// ============================================================================
// 4) ADMIN: Función HTTP para actualizar claims manualmente (útil para testing)
// ============================================================================
exports.updateUserClaims = functions.https.onCall(async (data, context) => {
  // Solo admins pueden llamar esta función
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden actualizar custom claims'
    );
  }

  const { userId, role, gender } = data;

  if (!userId || !role || !gender) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros requeridos: userId, role, gender'
    );
  }

  if (!['regular', 'admin', 'concierge'].includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'role debe ser: regular, admin, o concierge'
    );
  }

  if (!['masculino', 'femenino'].includes(gender)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'gender debe ser: masculino o femenino'
    );
  }

  try {
    await admin.auth().setCustomClaims(userId, { role, gender });
    console.log(`[updateUserClaims] Claims updated for ${userId}: role=${role}, gender=${gender}`);
    return { success: true, message: `Claims actualizados para ${userId}` };
  } catch (error) {
    console.error(`[updateUserClaims] Error:`, error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// 5) UTILITY: Función HTTP para obtener claims de un usuario (debugging)
// ============================================================================
exports.getUserClaims = functions.https.onCall(async (data, context) => {
  // Solo usuarios autenticados pueden ver sus propios claims, admins pueden ver cualquiera
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Debes estar autenticado'
    );
  }

  const { userId } = data;
  const targetUserId = userId || context.auth.uid;

  // Si no eres admin y no es tu propio ID, denegar
  if (targetUserId !== context.auth.uid && context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo puedes ver tus propios claims'
    );
  }

  try {
    const user = await admin.auth().getUser(targetUserId);
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      customClaims: user.customClaims || {}
    };
  } catch (error) {
    console.error(`[getUserClaims] Error:`, error);
    throw new functions.https.HttpsError('not-found', 'Usuario no encontrado');
  }
});

// ============================================================================
// 6) STRIPE WEBHOOK: Manejar eventos de Stripe (subscriptions y payments)
// ============================================================================
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`[stripeWebhook] Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[stripeWebhook] Event received: ${event.type}`);

  try {
    switch (event.type) {
      // ========== SUBSCRIPTION EVENTS ==========
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;

      // ========== PAYMENT EVENTS (Insurance - one-time) ==========
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      // ========== INVOICE EVENTS ==========
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      default:
        console.log(`[stripeWebhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`[stripeWebhook] Error processing event:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manejar actualización de suscripción (created/updated)
 */
async function handleSubscriptionUpdate(subscription) {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('[handleSubscriptionUpdate] No userId in subscription metadata');
    return;
  }

  const status = subscription.status; // active, past_due, canceled, etc.
  const subscriptionData = {
    subscriptionId: subscription.id,
    plan: subscription.metadata.plan || 'monthly',
    amount: subscription.items.data[0].price.unit_amount / 100,
    currency: subscription.currency.toUpperCase(),
    status: status,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  };

  await updateUserMembership(userId, status, {
    subscriptionId: subscription.id,
    startDate: subscriptionData.currentPeriodStart,
    endDate: subscriptionData.currentPeriodEnd
  });

  await logSubscription(userId, subscriptionData);

  console.log(`[handleSubscriptionUpdate] Subscription ${subscription.id} updated for user ${userId}: ${status}`);
}

/**
 * Manejar cancelación de suscripción
 */
async function handleSubscriptionCanceled(subscription) {
  const userId = subscription.metadata.userId;

  if (!userId) {
    console.error('[handleSubscriptionCanceled] No userId in subscription metadata');
    return;
  }

  await updateUserMembership(userId, 'canceled');

  // Actualizar log de subscription
  const db = admin.firestore();
  await db.collection('subscriptions').doc(subscription.id).update({
    status: 'canceled',
    canceledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`[handleSubscriptionCanceled] Subscription ${subscription.id} canceled for user ${userId}`);
}

/**
 * Manejar pago exitoso (Insurance - one-time payment)
 */
async function handlePaymentSucceeded(paymentIntent) {
  const userId = paymentIntent.metadata.userId;
  const paymentType = paymentIntent.metadata.paymentType; // 'insurance' or 'membership'

  if (!userId) {
    console.error('[handlePaymentSucceeded] No userId in payment metadata');
    return;
  }

  if (paymentType === 'insurance') {
    const insuranceData = {
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      status: 'succeeded',
      paymentMethod: paymentIntent.payment_method_types[0] || 'card',
      purchaseDate: admin.firestore.Timestamp.now()
    };

    await updateUserInsurance(userId, insuranceData);
    await logInsurance(userId, insuranceData);

    console.log(`[handlePaymentSucceeded] Insurance payment ${paymentIntent.id} succeeded for user ${userId}`);
  }
}

/**
 * Manejar fallo de pago
 */
async function handlePaymentFailed(paymentIntent) {
  const userId = paymentIntent.metadata.userId;

  if (!userId) {
    console.error('[handlePaymentFailed] No userId in payment metadata');
    return;
  }

  console.error(`[handlePaymentFailed] Payment ${paymentIntent.id} failed for user ${userId}`);

  // TODO: Enviar notificación al usuario
  // TODO: Registrar en colección de failed_payments
}

/**
 * Manejar fallo de pago de invoice (subscription renewal)
 */
async function handleInvoicePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.userId;

  if (!userId) return;

  await updateUserMembership(userId, 'past_due');

  console.error(`[handleInvoicePaymentFailed] Invoice payment failed for user ${userId}`);

  // TODO: Enviar email de recordatorio de pago
}

/**
 * Manejar pago exitoso de invoice
 */
async function handleInvoicePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.userId;

  if (!userId) return;

  console.log(`[handleInvoicePaymentSucceeded] Invoice payment succeeded for user ${userId}`);

  // La suscripción ya se actualizará con customer.subscription.updated
}

// ============================================================================
// PAYPAL HELPERS: Webhook signature verification
// ============================================================================

/**
 * Verificar firma de webhook de PayPal
 * @param {Object} req - Express request object
 * @returns {Promise<boolean>} - true si la firma es válida
 */
async function verifyPayPalWebhookSignature(req) {
  try {
    // PayPal webhook headers
    const transmissionId = req.headers['paypal-transmission-id'];
    const transmissionTime = req.headers['paypal-transmission-time'];
    const transmissionSig = req.headers['paypal-transmission-sig'];
    const certUrl = req.headers['paypal-cert-url'];
    const authAlgo = req.headers['paypal-auth-algo'];

    // PayPal webhook ID (debe configurarse en Firebase config)
    const webhookId = functions.config().paypal?.webhook_id || process.env.PAYPAL_WEBHOOK_ID;

    if (!webhookId) {
      console.error('[verifyPayPalWebhookSignature] PayPal webhook ID not configured');
      console.error('Run: firebase functions:config:set paypal.webhook_id="YOUR_WEBHOOK_ID"');
      return false;
    }

    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      console.error('[verifyPayPalWebhookSignature] Missing required headers');
      return false;
    }

    // Construir request de verificación según documentación PayPal
    // https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
    const verifyRequest = {
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      transmission_sig: transmissionSig,
      cert_url: certUrl,
      auth_algo: authAlgo,
      webhook_id: webhookId,
      webhook_event: req.body
    };

    // PayPal API credentials
    const paypalMode = functions.config().paypal?.mode || process.env.PAYPAL_MODE || 'sandbox';
    const paypalClientId = functions.config().paypal?.client_id || process.env.PAYPAL_CLIENT_ID;
    const paypalSecret = functions.config().paypal?.secret || process.env.PAYPAL_SECRET;

    if (!paypalClientId || !paypalSecret) {
      console.error('[verifyPayPalWebhookSignature] PayPal credentials not configured');
      return false;
    }

    // Obtener access token de PayPal
    const authUrl = paypalMode === 'live'
      ? 'https://api-m.paypal.com/v1/oauth2/token'
      : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';

    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${paypalClientId}:${paypalSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!authResponse.ok) {
      console.error('[verifyPayPalWebhookSignature] Failed to get PayPal access token:', authResponse.status);
      return false;
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Verificar firma del webhook
    const verifyUrl = paypalMode === 'live'
      ? 'https://api-m.paypal.com/v1/notifications/verify-webhook-signature'
      : 'https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature';

    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(verifyRequest)
    });

    if (!verifyResponse.ok) {
      console.error('[verifyPayPalWebhookSignature] Verification request failed:', verifyResponse.status);
      return false;
    }

    const verifyData = await verifyResponse.json();

    // Resultado de verificación
    if (verifyData.verification_status === 'SUCCESS') {
      console.log('[verifyPayPalWebhookSignature] Signature verified successfully');
      return true;
    } else {
      console.error('[verifyPayPalWebhookSignature] Signature verification failed:', verifyData.verification_status);
      return false;
    }
  } catch (error) {
    console.error('[verifyPayPalWebhookSignature] Error verifying signature:', error);
    return false;
  }
}

// ============================================================================
// 7) PAYPAL WEBHOOK: Manejar eventos de PayPal (subscriptions y payments)
// ============================================================================
exports.paypalWebhook = functions.https.onRequest(async (req, res) => {
  const event = req.body;

  console.log(`[paypalWebhook] Event received: ${event.event_type}`);

  try {
    // ⚠️ CRITICAL SECURITY: Verificar firma de PayPal webhook
    // https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/#verify-webhook-signature
    const isValidSignature = await verifyPayPalWebhookSignature(req);

    if (!isValidSignature) {
      console.error('[paypalWebhook] Invalid webhook signature - potential fraud attempt');
      // Rechazar request no autenticado
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook signature'
      });
    }

    console.log('[paypalWebhook] Webhook signature verified - processing event');

    switch (event.event_type) {
      // ========== SUBSCRIPTION EVENTS ==========
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handlePayPalSubscriptionActivated(event.resource);
        break;

      case 'BILLING.SUBSCRIPTION.UPDATED':
        await handlePayPalSubscriptionUpdated(event.resource);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handlePayPalSubscriptionCanceled(event.resource);
        break;

      // ========== PAYMENT EVENTS ==========
      case 'PAYMENT.SALE.COMPLETED':
        await handlePayPalPaymentCompleted(event.resource);
        break;

      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.REFUNDED':
        await handlePayPalPaymentFailed(event.resource);
        break;

      default:
        console.log(`[paypalWebhook] Unhandled event type: ${event.event_type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`[paypalWebhook] Error processing event:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manejar activación de suscripción PayPal
 */
async function handlePayPalSubscriptionActivated(subscription) {
  const userId = subscription.custom_id; // Debe incluirse al crear la suscripción

  if (!userId) {
    console.error('[handlePayPalSubscriptionActivated] No userId in custom_id');
    return;
  }

  const subscriptionData = {
    subscriptionId: subscription.id,
    plan: 'monthly',
    amount: parseFloat(subscription.billing_info?.last_payment?.amount?.value || 29.99),
    currency: subscription.billing_info?.last_payment?.amount?.currency_code || 'EUR',
    status: 'active',
    currentPeriodStart: admin.firestore.Timestamp.now(),
    currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(subscription.billing_info.next_billing_time))
  };

  await updateUserMembership(userId, 'active', {
    subscriptionId: subscription.id,
    startDate: subscriptionData.currentPeriodStart,
    endDate: subscriptionData.currentPeriodEnd
  });

  await logSubscription(userId, subscriptionData);

  console.log(`[handlePayPalSubscriptionActivated] Subscription ${subscription.id} activated for user ${userId}`);
}

/**
 * Manejar actualización de suscripción PayPal
 */
async function handlePayPalSubscriptionUpdated(subscription) {
  // Similar a activated
  await handlePayPalSubscriptionActivated(subscription);
}

/**
 * Manejar cancelación/suspensión de suscripción PayPal
 */
async function handlePayPalSubscriptionCanceled(subscription) {
  const userId = subscription.custom_id;

  if (!userId) {
    console.error('[handlePayPalSubscriptionCanceled] No userId in custom_id');
    return;
  }

  await updateUserMembership(userId, 'canceled');

  const db = admin.firestore();
  await db.collection('subscriptions').doc(subscription.id).update({
    status: 'canceled',
    canceledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`[handlePayPalSubscriptionCanceled] Subscription ${subscription.id} canceled for user ${userId}`);
}

/**
 * Manejar pago completado PayPal (Insurance - one-time)
 */
async function handlePayPalPaymentCompleted(sale) {
  const userId = sale.custom; // Debe incluirse al crear el pago
  const paymentType = sale.description; // 'insurance' or 'membership'

  if (!userId) {
    console.error('[handlePayPalPaymentCompleted] No userId in custom field');
    return;
  }

  if (paymentType === 'insurance') {
    const insuranceData = {
      paymentId: sale.id,
      amount: parseFloat(sale.amount.total),
      currency: sale.amount.currency,
      status: 'completed',
      paymentMethod: 'paypal',
      purchaseDate: admin.firestore.Timestamp.now()
    };

    await updateUserInsurance(userId, insuranceData);
    await logInsurance(userId, insuranceData);

    console.log(`[handlePayPalPaymentCompleted] Insurance payment ${sale.id} completed for user ${userId}`);
  }
}

/**
 * Manejar fallo/reembolso de pago PayPal
 */
async function handlePayPalPaymentFailed(sale) {
  const userId = sale.custom;

  if (!userId) {
    console.error('[handlePayPalPaymentFailed] No userId in custom field');
    return;
  }

  console.error(`[handlePayPalPaymentFailed] Payment ${sale.id} failed for user ${userId}`);

  // TODO: Enviar notificación al usuario
}
// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================
// Import notification functions from notifications.js

const notifications = require('./notifications');

// Export notification functions
exports.onMatchCreated = notifications.onMatchCreated;
exports.onMatchAccepted = notifications.onMatchAccepted;
exports.onMessageCreated = notifications.onMessageCreated;
exports.onAppointmentConfirmed = notifications.onAppointmentConfirmed;
exports.sendAppointmentReminders = notifications.sendAppointmentReminders;
exports.onVIPEventPublished = notifications.onVIPEventPublished;
exports.onSOSAlert = notifications.onSOSAlert;
exports.sendTestNotification = notifications.sendTestNotification;
