// Firebase config and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-check.js";

// Keep this config in sync with index.html (moved here)
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

// Optional: export functions instance if preferred by consumers
// import { getFunctions } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-functions.js";
// export const functions = getFunctions(app, "us-central1");

// Initialize Firebase App Check (reCAPTCHA v3) if site key is present
try {
  const siteKeyEl = document.querySelector('meta[name="app_check_site_key"]');
  const siteKey = siteKeyEl ? siteKeyEl.getAttribute('content') : null;
  const host = location.hostname || '';
  const isProdHost = /\.web\.app$/.test(host) || /\.firebaseapp\.com$/.test(host) || host === 'tucitasegura.com' || host === 'www.tucitasegura.com';
  const isPreview = (() => { try { const sp = new URLSearchParams(location.search); return sp.get('preview') === '1' || sp.has('ide_webview_request_time'); } catch { return false; } })();
  // En desarrollo/preview, usar debug token para evitar llamadas de reCAPTCHA
  if (!isProdHost || isPreview) {
    // true genera y muestra un token temporal en consola; puedes registrar uno fijo si lo prefieres
    // eslint-disable-next-line no-undef
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.debug('ℹ️ App Check en modo debug (preview/desarrollo)');
  }
  if (siteKey && typeof initializeAppCheck === 'function' && isProdHost) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.debug('✅ App Check inicializado (reCAPTCHA v3)');
  } else {
    console.debug('ℹ️ App Check no inicializado en este host');
  }
} catch (e) {
  // No bloquear la app si App Check falla; solo log discreto
  try { console.debug('App Check init error', e); } catch {}
}

console.log("✅ Firebase config module listo");
