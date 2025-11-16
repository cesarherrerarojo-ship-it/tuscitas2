// Firebase config and initialization (Enterprise App Check) - BACKUP
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider, getToken } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgFcoHwoBpo80rlEHL2hHVZ2DqtjWXh2s",
  authDomain: "tuscitasseguras-2d1a6.firebaseapp.com",
  projectId: "tuscitasseguras-2d1a6",
  storageBucket: "tuscitasseguras-2d1a6.firebasestorage.app",
  messagingSenderId: "924208562587",
  appId: "1:924208562587:web:5291359426fe390b36213e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export let appCheck;

// Configuración de App Check según entorno
function configureAppCheck() {
  const siteKeyEl = document.querySelector('meta[name="app_check_site_key"]');
  const siteKey = siteKeyEl ? siteKeyEl.getAttribute('content') : null;
  const disableRecaptchaEl = document.querySelector('meta[name="recaptcha:disable"]');
  const disableRecaptcha = (disableRecaptchaEl ? (disableRecaptchaEl.getAttribute('content') || '').toLowerCase() : '') === 'true';
  
  const host = location.hostname || '';
  const isProdHost = 
    /\.web\.app$/.test(host) ||
    /\.firebaseapp\.com$/.test(host) ||
    host === 'tucitasegura.com' ||
    host === 'www.tucitasegura.com' ||
    host === 'tuscitasseguras.com' ||
    host === 'www.tuscitasseguras.com';
  
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '';
  
  // MODO DESARROLLO: Evitar errores de reCAPTCHA
  if (isLocalhost || disableRecaptcha) {
    console.debug('🛠️ Modo desarrollo detectado - Usando debug token');
    
    // Usar el sistema de debug token de Firebase
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    
    try { 
      localStorage.setItem('firebaseAppCheckDebugToken', 'true'); 
    } catch {}
    
    // Crear un provider dummy válido usando ReCaptchaV3Provider con un site key dummy
    const dummySiteKey = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Site key de prueba de Google
    const provider = new ReCaptchaV3Provider(dummySiteKey);
    
    appCheck = initializeAppCheck(app, { 
      provider: provider, 
      isTokenAutoRefreshEnabled: false
    });
    
    globalThis._appCheckInstance = appCheck;
    
    // Crear promesa de readiness que maneje el token de debug
    globalThis.__appCheckReady = getToken(appCheck, true).then(result => {
      console.debug('✅ App Check debug token obtenido');
      return result.token;
    }).catch(error => {
      console.warn('⚠️ Error obteniendo debug token:', error);
      // Fallback: retornar un token dummy válido
      return 'dev-fallback-token-' + Date.now();
    });
    
    console.debug('✅ App Check desarrollo inicializado con debug token');
    return;
  }
  
  // MODO PRODUCCIÓN: Usar reCAPTCHA real
  if (isProdHost && siteKey && typeof initializeAppCheck === 'function') {
    try {
      const sp = new URLSearchParams(location.search);
      const metaProviderEl = document.querySelector('meta[name="app_check_provider"]');
      const providerOverride = (sp.get('provider') || (metaProviderEl ? metaProviderEl.getAttribute('content') : '') || '').toLowerCase();
      const looksLikeV3Key = !!(siteKey && siteKey.trim().startsWith('6L'));
      
      const providerType = (providerOverride === 'v3') ? 'v3' : (looksLikeV3Key) ? 'v3' : 'enterprise';
      
      const provider = providerType === 'v3' ? new ReCaptchaV3Provider(siteKey) : new ReCaptchaEnterpriseProvider(siteKey);
      appCheck = initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
      
      globalThis._appCheckInstance = appCheck;
      globalThis.__appCheckReady = getToken(appCheck, true).then(r => {
        console.debug('🔐 App Check token listo:', { len: r?.token?.length || 0 });
        return r.token;
      }).catch(e => {
        console.warn('⚠️ App Check error:', e);
        return null;
      });
      
      console.debug(`✅ App Check producción inicializado (${providerType})`);
      
    } catch (prodError) {
      console.error('❌ Error App Check producción:', prodError);
      globalThis.__appCheckReady = Promise.resolve(null);
    }
    
    return;
  }
  
  // Fallback
  console.debug('ℹ️ App Check deshabilitado');
  globalThis.__appCheckReady = Promise.resolve(null);
}

// Configurar Auth Emulator en desarrollo
try {
  const host = location.hostname || '';
  const sp = new URLSearchParams(location.search);
  const useEmu = sp.get('useEmu') === '1';
  if ((host === 'localhost' || host === '127.0.0.1') && useEmu) {
    const sameOrigin = `${location.protocol}//${location.host}`;
    connectAuthEmulator(auth, sameOrigin, { disableWarnings: true });
    console.debug('🔧 Auth Emulator conectado:', sameOrigin);
  }
} catch {}

// Inicializar App Check
try {
  configureAppCheck();
} catch (e) {
  console.error('❌ Error crítico App Check:', e);
  globalThis.__appCheckReady = Promise.resolve(null);
}

console.log("✅ Firebase config listo");