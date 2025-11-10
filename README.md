# tuscitas2

Proyecto web de TuCitaSegura con Firebase Hosting y Cloud Functions (2nd Gen) en `europe-west1`.

## Estructura
- `public/`: frontend estático servido por Hosting.
- `functions/`: backend con Functions v2 (`verifyRecaptcha` y `api` con Express).
- `.github/workflows/firebase-deploy.yml`: CI/CD para desplegar a Firebase en cada push a `main`.
- `firebase.json`: configuración de Hosting, rewrites y funciones.

## Despliegue (CI/CD)
El workflow usa Node 20, instala `firebase-tools` y despliega `hosting`, `firestore:rules` y `functions` al proyecto `tuscitasseguras-2d1a6`.

1. En GitHub → Settings → Secrets and variables → Actions → New repository secret:
   - Crear `FIREBASE_TOKEN` (obtenido con `firebase login:ci`).
2. Hacer push a `main`.
3. Verificar en GitHub Actions el job "Deploy to Firebase".

## Variables de entorno
- `process.env.RECAPTCHA_SECRET` (o `functions.config().recaptcha.secret` como fallback) para reCAPTCHA.
- `process.env.GMAPS_API_KEY` para Google Maps.
- `process.env.REQUIRE_MEMBERSHIP_MALE` y `process.env.REQUIRE_MEMBERSHIP_FEMALE` para políticas de membresía.
- `process.env.INSURANCE_DEPOSIT_MIN` para depósito de seguro.

## Endpoints
- `POST /api/verify-recaptcha` → verifica token.
- `GET /api/maps-key` → devuelve API key de Maps.
- `GET /api/membership-policy` → requisitos de membresía.
- `GET /api/deposit-policy` → depósito de seguro.
- `GET /api/health` → estado del backend.

## Desarrollo local
- Hosting: abrir `public/index.html` con un servidor local.
- Functions: editar `functions/index.js` y desplegar con `firebase deploy --only functions`.
  - También puedes crear `functions/.env` basado en `functions/.env.sample` para pruebas locales.

## Notas
- No subir `.env` ni `node_modules` (`.gitignore` ya lo evita).
- Functions están en `europe-west1`; los rewrites de Hosting apuntan explícitamente a esa región.
