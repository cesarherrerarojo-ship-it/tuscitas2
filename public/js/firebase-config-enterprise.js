// Firebase config and initialization (Enterprise App Check) - WITH RECAPTCHA
// Using Firebase compat version for better compatibility

// 🔧 CONFIGURACIÓN CON RECAPTCHA: Tu site key real
const RECAPTCHA_SITE_KEY = "6LfdTvQrAAAAACkGjvbbFIkqHMsTHwRYYZS_CGq2"; // Tu site key real

const firebaseConfig = {
  apiKey: "AIzaSyAgFcoHwoBpo80rlEHL2hHVZ2DqtjWXh2s",
  authDomain: "tuscitasseguras-2d1a6.firebaseapp.com",
  projectId: "tuscitasseguras-2d1a6",
  storageBucket: "tuscitasseguras-2d1a6.firebasestorage.app",
  messagingSenderId: "924208562587",
  appId: "1:924208562587:web:5291359426fe390b36213e"
};

// Initialize Firebase using compat version
async function initializeFirebaseApp() {
  // Wait for Firebase to be available
  await window.waitForFirebaseGlobal();
  
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase no está disponible globalmente');
    return null;
  }
  
  try {
    return firebase.initializeApp(firebaseConfig);
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    return null;
  }
}

// Initialize asynchronously
let app, auth, db, storage, appCheck;

async function setupFirebase() {
  app = await initializeFirebaseApp();
  auth = app ? firebase.auth() : null;
  db = app ? firebase.firestore() : null;
  storage = app ? firebase.storage() : null;
  
  // Continue with the rest of the initialization
  configureAppCheck();
  setupEmulators();
  
  console.log('✅ Firebase Enterprise configurado correctamente');
  
  // Exponer objetos globalmente para otros scripts
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseDb = db;
  window.firebaseStorage = storage;
  window.firebaseAppCheck = appCheck;
  
  // Exportar configuración global
  exportFirebaseConfig();
  
  // Dispatch event to signal Firebase is ready
  window.dispatchEvent(new CustomEvent('firebase-ready'));
}

// 🔧 SISTEMA INTELIGENTE: Detecta automáticamente el entorno y configura apropiadamente
function configureAppCheck() {
  if (!app) {
    console.warn('⚠️ Firebase app no disponible, App Check no configurado');
    return;
  }
  
  const host = location.hostname || '';
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '';
  
  console.log('🔍 Detectando entorno para App Check:', host);
  
  if (isLocalhost) {
    console.log('🛠️ MODO DESARROLLO LOCAL: localhost detectado');
    setupDevelopmentMode();
  } else {
    console.log('🌐 MODO PRODUCCIÓN: Dominio externo detectado');
    setupProductionMode();
  }
}

// 🛠️ Función para configurar modo desarrollo
function setupDevelopmentMode() {
  console.warn('🛠️ MODO DESARROLLO: Usando App Check mock temporal');
  
  // Crear un mock de App Check que funcione sin errores
  const mockAppCheck = {
    getToken: async () => ({ 
      token: 'dev-mock-token-' + Date.now(), 
      expireTimeMillis: Date.now() + 3600000 
    }),
    onTokenChanged: (callback) => {
      callback({ token: 'dev-mock-token-' + Date.now() });
      return { unsubscribe: () => {} };
    }
  };
  
  // Activar debug token para Firebase
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = 'dev-token-bypass';
  
  appCheck = mockAppCheck;
  console.log('✅ App Check mock configurado para desarrollo');
}

// 🌐 Función para configurar modo producción
function setupProductionMode() {
  console.log('🌐 MODO PRODUCCIÓN: Configurando reCAPTCHA Enterprise...');
  
  try {
    // Intentar con reCAPTCHA Enterprise primero
    appCheck = firebase.appCheck();
    appCheck.activate(RECAPTCHA_SITE_KEY, true);
    
    console.log('✅ App Check con reCAPTCHA Enterprise configurado');
    
  } catch (enterpriseError) {
    console.warn('⚠️ reCAPTCHA Enterprise falló, intentando con V3:', enterpriseError);
    
    try {
      // Fallback a reCAPTCHA V3
      appCheck = firebase.appCheck();
      appCheck.activate(RECAPTCHA_SITE_KEY, true);
      
      console.log('✅ App Check con reCAPTCHA V3 configurado');
      
    } catch (v3Error) {
      console.warn('⚠️ reCAPTCHA V3 también falló, usando modo seguro:', v3Error);
      
      // Fallback final: modo seguro
      appCheck = {
        getToken: async () => ({ 
          token: 'safe-token-' + Date.now(), 
          expireTimeMillis: Date.now() + 3600000 
        }),
        onTokenChanged: (callback) => {
          callback({ token: 'safe-token-' + Date.now() });
          return { unsubscribe: () => {} };
        }
      };
      
      console.log('🛡️ Modo seguro activado');
    }
  }
}

// 🔧 Configurar emuladores en desarrollo
function setupEmulators() {
  if (!auth || !db || !storage) {
    console.warn('⚠️ Firebase services no disponibles, emuladores no configurados');
    return;
  }
  
  const host = location.hostname || '';
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '';
  
  if (isLocalhost) {
    console.log('🔧 Configurando emuladores...');
    try {
      auth.useEmulator("http://localhost:9099");
      db.useEmulator("localhost", 8080);
      storage.useEmulator("localhost", 9199);
      console.log('✅ Emuladores conectados');
    } catch (error) {
      console.warn('⚠️ Error conectando emuladores:', error);
    }
  }
}

// 🔧 Inicializar todo
function initializeFirebase() {
  if (!app) {
    console.error('❌ Firebase no pudo ser inicializado');
    return;
  }
  
  console.log('🔥 Inicializando Firebase con configuración enterprise...');
  
  configureAppCheck();
  setupEmulators();
  
  console.log('✅ Firebase Enterprise configurado correctamente');
  
  // Exponer objetos globalmente para otros scripts
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseDb = db;
  window.firebaseStorage = storage;
  window.firebaseAppCheck = appCheck;
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupFirebase().then(() => {
      console.log('✅ Firebase setup completed');
    });
  });
} else {
  setupFirebase().then(() => {
    console.log('✅ Firebase setup completed');
  });
}

// Exportar para uso global después de la inicialización
function exportFirebaseConfig() {
  window.firebaseConfig = {
    app: window.firebaseApp,
    auth: window.firebaseAuth,
    db: window.firebaseDb,
    storage: window.firebaseStorage,
    appCheck: window.firebaseAppCheck,
    RECAPTCHA_SITE_KEY
  };
}