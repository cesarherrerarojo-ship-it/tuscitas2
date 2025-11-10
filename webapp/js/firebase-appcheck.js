// Firebase App Check Configuration
// Importar ANTES de firebase-config.js en todos los archivos HTML

import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js";
import app from './firebase-config.js';

// ============================================================================
// CONFIGURACIÓN DE APP CHECK CON RECAPTCHA ENTERPRISE
// ============================================================================

// IMPORTANTE: Esta es tu reCAPTCHA ENTERPRISE site key
// reCAPTCHA Enterprise != reCAPTCHA v3 (requiere provider diferente)
const RECAPTCHA_ENTERPRISE_SITE_KEY = '6LfdTvQrAAAAACkGjvbbFIkqHMsTHwRYYZS_CGq2';

// ============================================================================
// 1. MODO DEBUG PARA DESARROLLO LOCAL
// ============================================================================
const isDevelopment = location.hostname === "localhost" ||
                     location.hostname === "127.0.0.1" ||
                     location.hostname.includes("192.168.");

if (isDevelopment) {
  // Activar debug mode para obtener debug token
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

  console.log('🔧 App Check Debug Mode ACTIVADO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  IMPORTANTE: Copia el debug token que aparecerá abajo');
  console.log('📝 Pasos:');
  console.log('   1. Copia el token de la consola (aparece automáticamente)');
  console.log('   2. Ve a Firebase Console → App Check → Apps → Debug tokens');
  console.log('   3. Haz clic en "Add debug token"');
  console.log('   4. Pega el token y guarda');
  console.log('   5. Recarga esta página');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ============================================================================
// 2. INICIALIZAR APP CHECK CON RECAPTCHA ENTERPRISE
// ============================================================================
let appCheck = null;

try {
  // Validar site key
  if (!RECAPTCHA_ENTERPRISE_SITE_KEY || RECAPTCHA_ENTERPRISE_SITE_KEY === 'YOUR_RECAPTCHA_SITE_KEY') {
    throw new Error('reCAPTCHA Enterprise site key no configurada');
  }

  // Inicializar App Check con reCAPTCHA ENTERPRISE
  // NOTA: Usamos ReCaptchaEnterpriseProvider, NO ReCaptchaV3Provider
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_ENTERPRISE_SITE_KEY),
    isTokenAutoRefreshEnabled: true // Auto-refresh tokens antes de expirar
  });

  // Hacer appCheck disponible globalmente (útil para debugging)
  window._appCheckInstance = appCheck;

  console.log('✅ App Check inicializado correctamente');
  console.log(`📍 Modo: ${isDevelopment ? 'DESARROLLO (debug tokens)' : 'PRODUCCIÓN (reCAPTCHA Enterprise)'}`);
  console.log(`🔑 Provider: reCAPTCHA Enterprise`);

  // En desarrollo, mostrar cuando se obtiene el debug token
  if (isDevelopment) {
    console.log('⏳ Esperando debug token...');
  }

} catch (error) {
  console.error('❌ Error inicializando App Check:', error.message);

  if (error.message.includes('site key')) {
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn('📝 Para verificar reCAPTCHA Enterprise site key:');
    console.warn('   1. https://console.cloud.google.com/security/recaptcha');
    console.warn('   2. Selecciona proyecto: tuscitasseguras-2d1a6');
    console.warn('   3. Verifica que la key existe y es tipo "Enterprise"');
    console.warn('   4. Verifica que los dominios incluyen: localhost, 127.0.0.1');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  console.warn('🔧 La app continuará sin App Check');
  console.warn('⚠️  Esto puede causar errores 401 si Enforcement está activado');
  console.warn('💡 Desactiva Enforcement en Firebase Console → App Check');
}

// ============================================================================
// 3. FUNCIÓN HELPER PARA OBTENER TOKEN MANUALMENTE (DEBUGGING)
// ============================================================================
window.getAppCheckToken = async function() {
  if (!appCheck) {
    console.error('App Check no está inicializado');
    return null;
  }

  try {
    const { getToken } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js");
    const tokenResult = await getToken(appCheck, /* forceRefresh */ false);

    console.log('✅ App Check Token obtenido:');
    console.log('   Token:', tokenResult.token.substring(0, 50) + '...');
    console.log('   Expira en:', new Date(Date.now() + 3600000)); // ~1 hora

    return tokenResult;
  } catch (error) {
    console.error('❌ Error obteniendo token:', error);
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);

    if (error.message.includes('400')) {
      console.error('');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🚨 400 BAD REQUEST');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('');
      console.error('Causas comunes:');
      console.error('  1. Site key no registrada en Firebase Console App Check');
      console.error('  2. Dominio (localhost) no autorizado en reCAPTCHA');
      console.error('  3. Enforcement activado sin configuración correcta');
      console.error('');
      console.error('SOLUCIÓN RÁPIDA:');
      console.error('  1. Firebase Console → App Check → Overview');
      console.error('  2. Desactiva Enforcement en:');
      console.error('     - Authentication → Unenforced');
      console.error('     - Cloud Firestore → Unenforced');
      console.error('     - Cloud Storage → Unenforced');
      console.error('  3. Recarga la página (Ctrl + Shift + R)');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    return null;
  }
};

// ============================================================================
// 4. AUTO-VERIFICAR QUE APP CHECK FUNCIONA (DESARROLLO)
// ============================================================================
if (isDevelopment) {
  // Esperar un momento para que App Check se inicialice
  setTimeout(async () => {
    console.log('🧪 Verificando App Check...');
    const tokenResult = await window.getAppCheckToken();

    if (tokenResult) {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ App Check funcionando correctamente');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Todas las requests incluirán App Check tokens');
      console.log('✅ NO deberías ver errores 401 o 403');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  App Check no pudo obtener token');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('Posibles causas:');
      console.log('  ❌ Debug token no añadido en Firebase Console');
      console.log('  ❌ Site key no registrada en Firebase Console App Check');
      console.log('  ❌ Enforcement activado pero configuración incorrecta');
      console.log('');
      console.log('Pasos para solucionar:');
      console.log('  1. Busca "App Check debug token:" arriba y copia el token');
      console.log('  2. Registra el token en Firebase Console');
      console.log('  3. Verifica que Enforcement está desactivado (Unenforced)');
      console.log('  4. Recarga esta página');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }, 2000);
}

// Export para usar en otros módulos si es necesario
export { appCheck };
