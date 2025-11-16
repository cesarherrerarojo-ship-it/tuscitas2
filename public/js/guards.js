// Route guard: autenticación y perfil. Modo demo permite bypass con ?demo=1
// Using global Firebase objects instead of ES6 modules

const isDemo = (() => { try { return new URLSearchParams(location.search).get('demo') === '1'; } catch { return false; } })();
const isPreview = (() => { try {
  const sp = new URLSearchParams(location.search);
  return sp.get('preview') === '1' || sp.has('ide_webview_request_time');
} catch { return false; } })();
if (isDemo) {
  console.log("⚠️ Modo demo activo");
}

// Function to get Firebase auth and db
function getFirebaseAuth() {
  return window.firebaseAuth;
}

function getFirebaseDb() {
  return window.firebaseDb;
}

// When this module is loaded, enforce profile completion (salvo modo demo)
function setupAuthGuard() {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  
  if (!auth || !db) {
    console.warn("Guard: Firebase no disponible, guardia desactivada");
    return;
  }

  firebase.auth().onAuthStateChanged(async (user) => {
    try {
      // En modo demo permitimos páginas sin sesión, pero si hay sesión aplicamos reglas de perfil
      if (!user) {
        // No redireccionar automáticamente: mantener la página estática
        // Opcional: mostrar aviso discreto en consola
        console.warn("Guard: usuario no autenticado, página se mantiene estática");
        return;
      }

      const snap = await firebase.firestore.getDoc(firebase.firestore.doc(db, "users", user.uid));
      const u = snap.exists() ? snap.data() : {};

      const isProfilePage = location.pathname === "/perfil.html";
      const isIndexPage = location.pathname === "/" || location.pathname === "/index.html";

      if (isDemo) {
        console.log("⚠️ Modo demo: bypass de restricciones");
        return;
      }

      if (!u.profileComplete && !isProfilePage) {
        console.warn("Guard: perfil incompleto, redirigiendo a perfil.html");
        location.href = "/perfil.html";
        return;
      }

      if (u.profileComplete && isIndexPage) {
        // Si el perfil está completo y estamos en index, no redirigir automáticamente
        console.log("Guard: perfil completo, permaneciendo en index");
        return;
      }

      // Verificar verificación de teléfono
      if (u.profileComplete && !isProfilePage) {
        const privateSnap = await firebase.firestore.getDoc(firebase.firestore.doc(db, "users_private", user.uid));
        const privateData = privateSnap.exists() ? privateSnap.data() : {};
        if (privateData.phoneVerified === false) {
          console.warn("Guard: teléfono no verificado, redirigiendo a perfil.html");
          location.href = "/perfil.html";
          return;
        }
      }

      console.log("Guard: acceso permitido");
    } catch (error) {
      console.error("Guard: error verificando usuario", error);
    }
  });
}

// Setup guard when Firebase is ready
function waitForFirebaseGuards() {
  return new Promise((resolve) => {
    // Wait for both Firebase global and the specific config
    if (typeof firebase !== 'undefined' && window.firebaseConfig) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (typeof firebase !== 'undefined' && window.firebaseConfig) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 15 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('⚠️ Firebase no se cargó en el tiempo esperado para guards - continuando sin guardia');
        resolve();
      }, 15000);
    }
  });
}

// Initialize guard after a delay to ensure Firebase is properly set up
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      waitForFirebaseGuards().then(() => {
        setupAuthGuard();
      });
    }, 1000); // Delay to ensure Firebase config is loaded
  });
} else {
  setTimeout(() => {
    waitForFirebaseGuards().then(() => {
      setupAuthGuard();
    });
  }, 1000);
}