// Firebase config and initialization (Enterprise App Check)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-check.js";

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
// Exponer instancia para diagnóstico desde consola
export let appCheck;

// Initialize Firebase App Check (reCAPTCHA Enterprise/V3)
try {
  const siteKeyEl = document.querySelector('meta[name="app_check_site_key"]');
  const siteKey = siteKeyEl ? siteKeyEl.getAttribute('content') : null;
  const host = location.hostname || '';
  // Incluir dominios actuales del proyecto y defaults de Firebase hosting
  const isProdHost = 
    /\.web\.app$/.test(host) ||
    /\.firebaseapp\.com$/.test(host) ||
    host === 'tucitasegura.com' ||
    host === 'www.tucitasegura.com' ||
    host === 'tuscitasseguras.com' ||
    host === 'www.tuscitasseguras.com';
  const sp = new URLSearchParams(location.search);

  // Provider selection (producción únicamente; override explícito permite v3)
  const metaProviderEl = document.querySelector('meta[name="app_check_provider"]');
  const providerOverride = (sp.get('provider') || (metaProviderEl ? metaProviderEl.getAttribute('content') : '') || '').toLowerCase();
  // Detect if the provided site key looks like a reCAPTCHA v3 key (e.g., begins with "6L")
  const looksLikeV3Key = !!(siteKey && siteKey.trim().startsWith('6L'));
  // Selección final en producción:
  // - Override explícito a v3 gana
  // - Si la site key parece v3, usa v3
  // - Caso contrario, Enterprise
  const providerType = (providerOverride === 'v3')
    ? 'v3'
    : (looksLikeV3Key)
      ? 'v3'
      : 'enterprise';

  if (isProdHost && siteKey && typeof initializeAppCheck === 'function') {
    const provider = providerType === 'v3' ? new ReCaptchaV3Provider(siteKey) : new ReCaptchaEnterpriseProvider(siteKey);
    appCheck = initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
    // Hacer accesible en global para diagnósticos manuales
    globalThis._appCheckInstance = appCheck;
    // Promesa de readiness: resuelve cuando hay token disponible
    globalThis.__appCheckReady = appCheck.getToken(true).then(r => {
      console.debug('🔐 App Check token listo (prod):', { len: r?.token?.length || 0, exp: new Date(r?.expireTimeMillis || Date.now()).toISOString() });
      return r.token;
    }).catch(e => {
      console.warn('⚠️ App Check getToken error (prod)', e);
      return null;
    });
    const fallbackNote = looksLikeV3Key && providerType === 'enterprise' ? ' • aviso: clave v3 detectada, usa Enterprise' : '';
    const autoNote = looksLikeV3Key && providerType === 'v3' ? ' • v3 por site key v3' : '';
    console.debug(`✅ App Check inicializado (producción, reCAPTCHA ${providerType}${autoNote}${fallbackNote})`);
  } else {
    try {
      // Local/dev: habilita token de depuración y inicializa App Check para evitar 401 en servicios protegidos
      // El token se mostrará en la consola; añádelo en Firebase Console → App Check → Debug tokens.
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      if (typeof initializeAppCheck === 'function') {
        const devProvider = new ReCaptchaV3Provider(siteKey || 'local-dev');
        appCheck = initializeAppCheck(app, { provider: devProvider, isTokenAutoRefreshEnabled: true });
        // Exponer para diagnósticos
        globalThis._appCheckInstance = appCheck;
        globalThis.__appCheckReady = appCheck.getToken(true).then(r => {
          console.debug('🔐 App Check token listo (dev/debug):', { len: r?.token?.length || 0, exp: new Date(r?.expireTimeMillis || Date.now()).toISOString() });
          return r.token;
        }).catch(e => {
          console.warn('⚠️ App Check getToken error (dev)', e);
          return null;
        });
        console.debug('✅ App Check (debug) inicializado para desarrollo/local');
      } else {
        console.debug('ℹ️ SDK App Check no disponible para inicialización en modo debug');
      }
    } catch (e2) {
      console.debug('App Check debug init error', e2);
    }
  }
} catch (e) {
  try { console.debug('App Check init error', e); } catch {}
}

console.log("✅ Firebase config (Enterprise) listo");
