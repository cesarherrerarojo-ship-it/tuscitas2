# TuCitaSegura — Server Express y Firebase

Proyecto web de TuCitaSegura con servidor de desarrollo Express y despliegue en Firebase Hosting y Cloud Functions (2nd Gen) en `europe-west1`.

• Guía rápida: ver `QUICKSTART.md` para pasos de instalación y arranque.

## Estructura
- `public/`: frontend estático (también servido en desarrollo por `server.js`).
- `server.js`: servidor Express para desarrollo local y endpoints auxiliares.
- `functions/`: backend con Functions v2 (p. ej., `verifyRecaptcha` y `api`).
- `.github/workflows/firebase-deploy.yml`: CI/CD para desplegar a Firebase en cada push a `main`.
- `firebase.json`: configuración de Hosting, rewrites y funciones.

## Despliegue (CI/CD)
El workflow usa Node 20, instala `firebase-tools` y despliega `hosting`, `firestore:rules` y `functions` al proyecto `tuscitasseguras-2d1a6`.

1. En GitHub → Settings → Secrets and variables → Actions → New repository secret:
   - Crear `FIREBASE_TOKEN` (obtenido con `firebase login:ci`).
2. Hacer push a `main`.
3. Verificar en GitHub Actions el job "Deploy to Firebase".

## Variables de entorno
- `RECAPTCHA_SECRET` (o `functions.config().recaptcha.secret` como fallback) para reCAPTCHA del servidor.
- `GMAPS_API_KEY` para Google Maps.
- `REQUIRE_MEMBERSHIP_MALE` y `REQUIRE_MEMBERSHIP_FEMALE` para políticas de membresía.
- `INSURANCE_DEPOSIT_MIN` para depósito de seguro.

## Endpoints (server.js)
- `POST /api/verify-recaptcha` → verifica token (usa `RECAPTCHA_SECRET`, con modo fail-open en dev si está `RECAPTCHA_FAILOPEN_DEV=true`).
- `GET /api/maps-key` → devuelve API key de Maps.
- `GET /api/membership-policy` → requisitos de membresía (male/female).
- `GET /api/deposit-policy` → depósito de seguro.

## Desarrollo local
- Servidor dev: `npm run dev` (Express) y abrir `http://localhost:3000/index.html` o `http://localhost:3000/perfil.html`.
- Cambiar puerto (Windows PowerShell): `$env:PORT=3001; npm run dev`.
  - En CMD: `set PORT=3001 && npm run dev`.
- App Check en desarrollo: las páginas incluyen `<meta name="recaptcha:disable" content="true">` y se ha persistido un token de depuración via meta (`app_check_debug_token`). Quitar estas metas en producción.
- Emulador Auth (opcional): `firebase emulators:start --only auth --project demo-tucs`. El servidor Express proxya el emulador al mismo origen.
- Functions: editar `functions/index.js` y desplegar con `firebase deploy --only functions`.
  - Puedes crear `functions/.env` basado en `functions/.env.sample` para pruebas.

## Notas
- No subir `.env` ni `node_modules` (`.gitignore` ya lo evita).
- Functions están en `europe-west1`; los rewrites de Hosting apuntan explícitamente a esa región.
- Consulta `QUICKSTART.md` para más detalles de arranque y troubleshooting.
