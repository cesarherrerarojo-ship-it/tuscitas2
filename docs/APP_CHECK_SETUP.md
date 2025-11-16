# Setup App Check

## Desarrollo
- Añadir `<meta name="recaptcha:disable" content="true">` en páginas relevantes (ej. `index.html`, `perfil.html`).
- Inicializar App Check en modo depuración y evitar carga de scripts de Google.
- Verificar con `globalThis.__appCheckReady` y emisión de token.

## Producción
- Eliminar `recaptcha:disable`.
- Configurar Site Key de reCAPTCHA Enterprise y CSP que permita cargar sus scripts.
- Activar modo “Enforced” en App Check.

