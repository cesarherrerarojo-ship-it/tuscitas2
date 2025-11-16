# Guía de desarrollo

## Requisitos
- Node.js 18
- `npm install`

## Ejecutar servidor
- `npm start`
- Abre `http://localhost:3000/index.html?useEmu=1` para forzar emulador en frontend.

## Emulador de Auth
- En otra terminal: `firebase emulators:start --only auth --project demo-tucs`
- El servidor expone un proxy hacia `localhost:9099` para evitar CORS.

## App Check en desarrollo
- Se usa token de depuración y se desactiva reCAPTCHA mediante `<meta name="recaptcha:disable" content="true">`.
- Verificación rápida en consola del navegador:
  - `await _appCheckInstance.getToken(true)`
  - `globalThis.__appCheckReady === true`

## reCAPTCHA en backend (fail-open)
- `.env`: `RECAPTCHA_FAILOPEN_DEV=true`
- Endpoint: `POST /api/verify-recaptcha`
- Con `fail-open` y sin `RECAPTCHA_SECRET` responde `success: true` en desarrollo.

## Script de actualización de usuarios
- `npm run update:users` (ver `docs/USER_PROFILE_SCHEMA.md`)
- Variables recomendadas:
  - `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` (opcional)
  - `FIRESTORE_EMULATOR_HOST=localhost:8080` (opcional)
  - `GOOGLE_APPLICATION_CREDENTIALS=path\al\service-account.json` (prod)

