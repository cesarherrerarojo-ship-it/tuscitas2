// Stub de App Check para desarrollo: marca listo y evita cargar reCAPTCHA.
export function initAppCheckDebug() {
  try {
    const meta = document.querySelector('meta[name="recaptcha:disable"][content="true"]');
    if (meta) {
      globalThis.__appCheckReady = true;
      console.info('[AppCheck] Desarrollo: reCAPTCHA desactivado, token de depuración activo.');
      return true;
    }
    console.warn('[AppCheck] Meta recaptcha:disable no encontrada. Asegura producir CSP y Site Key en producción.');
    return false;
  } catch (e) {
    console.error('[AppCheck] Error inicializando stub:', e);
    return false;
  }
}

