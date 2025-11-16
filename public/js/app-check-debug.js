// Verificación de App Check - Utilidad de diagnóstico
(function() {
  'use strict';
  
  // Esperar a que Firebase se inicialice
  function checkAppCheckStatus() {
    if (typeof globalThis.__appCheckReady === 'undefined') {
      console.warn('⚠️ App Check no está inicializado');
      return;
    }
    
    globalThis.__appCheckReady.then(token => {
      if (token) {
        console.log('✅ App Check funcionando correctamente');
        console.log('🔑 Token:', token.substring(0, 20) + '...');
      } else {
        console.warn('⚠️ App Check inicializado pero sin token');
      }
    }).catch(error => {
      console.error('❌ Error en App Check:', error);
    });
  }
  
  // Verificar cada 30 segundos
  setInterval(checkAppCheckStatus, 30000);
  
  // Verificar inmediatamente después de 2 segundos
  setTimeout(checkAppCheckStatus, 2000);
  
  // Exponer función para debugging manual
  globalThis.debugAppCheck = function() {
    console.group('🔍 App Check Debug Info');
    console.log('Hostname:', location.hostname);
    console.log('Is Localhost:', location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    console.log('Disable reCAPTCHA:', document.querySelector('meta[name="recaptcha:disable"]')?.content === 'true');
    console.log('Site Key:', document.querySelector('meta[name="app_check_site_key"]')?.content);
    console.log('App Check Instance:', globalThis._appCheckInstance || 'No disponible');
    console.log('App Check Ready:', globalThis.__appCheckReady || 'No disponible');
    console.groupEnd();
    
    checkAppCheckStatus();
  };
  
  console.log('🔍 App Check debugger cargado. Usa debugAppCheck() para verificar estado.');
})();