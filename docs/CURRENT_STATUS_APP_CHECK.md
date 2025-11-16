# Estado actual de App Check

- Desarrollo: reCAPTCHA desactivado, App Check en modo depuración, token emitiéndose y banner oculto.
- Producción: requiere habilitar Site Key, CSP y modo “Enforced”.
- Backend: endpoint `POST /api/verify-recaptcha` con `RECAPTCHA_FAILOPEN_DEV=true` para desarrollo.

