# Fix error 400 de App Check

Problema: En desarrollo, la carga de reCAPTCHA puede abortarse (`ERR_ABORTED`) provocando errores 400.

Solución:
- Añadir meta `recaptcha:disable` en desarrollo.
- Usar token de depuración de App Check.
- Verificar desde consola la emisión correcta del token.

