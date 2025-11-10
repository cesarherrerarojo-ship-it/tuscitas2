// Firebase App Check Configuration
// Importar ANTES de firebase-config.js en todos los archivos HTML

import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";
import app from './firebase-config.js';

// ============================================================================
// CONFIGURACIÓN DE APP CHECK
// ============================================================================

// 1. Para DESARROLLO: Activar debug tokens
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  console.log('🔧 App Check Debug Mode ACTIVADO');
  console.log('⚠️ Copia el debug token de la consola y añádelo en Firebase Console → App Check → Debug tokens');
}

// 2. Inicializar App Check con reCAPTCHA v3
// IMPORTANTE: Reemplaza 'YOUR_RECAPTCHA_V3_SITE_KEY' con tu site key real
let appCheck = null;

try {
  const RECAPTCHA_SITE_KEY = 'YOUR_RECAPTCHA_V3_SITE_KEY'; // TODO: Reemplazar con site key real

  if (RECAPTCHA_SITE_KEY === 'YOUR_RECAPTCHA_V3_SITE_KEY') {
    console.warn('⚠️ App Check: reCAPTCHA site key no configurada');
    console.warn('📝 Pasos para obtener site key:');
    console.warn('   1. https://console.cloud.google.com/security/recaptcha');
    console.warn('   2. Crear site key reCAPTCHA v3');
    console.warn('   3. Añadir dominio: localhost, 127.0.0.1, tu-dominio.com');
    console.warn('   4. Copiar site key en este archivo');
  } else {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    console.log('✅ App Check inicializado correctamente');
  }
} catch (error) {
  console.error('❌ Error inicializando App Check:', error);
  console.warn('🔧 La app continuará sin App Check - puede haber errores 401');
}

export { appCheck };
