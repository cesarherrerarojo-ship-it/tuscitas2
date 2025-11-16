# Fix ReCAPTCHA Enterprise (backend)

Endpoint: `POST /api/verify-recaptcha`.

Comportamiento:
- Si no hay `RECAPTCHA_SECRET` y `RECAPTCHA_FAILOPEN_DEV=true`, responde éxito en desarrollo.
- Con `RECAPTCHA_SECRET` definido, valida contra `siteverify` con `score >= 0.5`.

Variables:
- `RECAPTCHA_SECRET`: secreto del servidor.
- `RECAPTCHA_FAILOPEN_DEV`: `true` para permitir desarrollo sin secreto.

