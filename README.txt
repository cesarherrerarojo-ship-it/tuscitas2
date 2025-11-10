# Functions v2 con Secrets/Params — tuscitasseguras-2d1a6

## Secretos (una vez)
firebase use tuscitasseguras-2d1a6
firebase functions:secrets:set RECAPTCHA_SECRET --data "<TU_RECAPTCHA_SECRET>"
firebase functions:secrets:set GMAPS_API_KEY --data "<TU_MAPS_API_KEY>"

## Parámetros (.env.tuscitasseguras-2d1a6)
Edita functions/.env.tuscitasseguras-2d1a6 para:
REQUIRE_MEMBERSHIP_MALE=true
REQUIRE_MEMBERSHIP_FEMALE=false
INSURANCE_DEPOSIT_MIN=120

## Deploy
cd functions && npm install && cd ..
firebase deploy --only functions,hosting

## Probar
GET  /api/health
POST /api/verify-recaptcha  body: {"token":"<recaptcha_token>"}
GET  /api/maps-key
GET  /api/membership-policy
GET  /api/deposit-policy
