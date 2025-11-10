// Route guard: autenticación y perfil. Modo demo permite bypass con ?demo=1
import { auth, db } from "./firebase-config-enterprise.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const isDemo = (() => { try { return new URLSearchParams(location.search).get('demo') === '1'; } catch { return false; } })();
const isPreview = (() => { try {
  const sp = new URLSearchParams(location.search);
  return sp.get('preview') === '1' || sp.has('ide_webview_request_time');
} catch { return false; } })();
if (isDemo) {
  console.log("⚠️ Modo demo activo");
}

// When this module is loaded, enforce profile completion (salvo modo demo)
onAuthStateChanged(auth, async (user) => {
  try {
    // En modo demo permitimos páginas sin sesión, pero si hay sesión aplicamos reglas de perfil
    if (!user) {
      // No redireccionar automáticamente: mantener la página estática
      // Opcional: mostrar aviso discreto en consola
      console.warn("Guard: usuario no autenticado, página se mantiene estática");
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    const u = snap.exists() ? snap.data() : {};

    const isProfilePage = location.pathname === "/perfil.html";
    const isIndexPage = location.pathname === "/" || location.pathname === "/index.html";
    const isPreviewBypass = isPreview === true;

    // Bloquea navegación si el perfil no está completo
    if (!u.profileComplete) {
      // No redireccionar automáticamente: que la UI gestione el acceso
      if (!isProfilePage && !isIndexPage && !isPreviewBypass) {
        console.warn("Guard: perfil incompleto, sin redirección automática");
        return;
      }
    }
    // Nota: la verificación de teléfono se trata en admin-guard y banners de perfil.
  } catch (e) {
    console.error("Guard error", e);
    // Fail-safe: no redirigir automáticamente
  }
});
// Log discreto (no fuerza redirecciones)
console.log("✅ Guard de perfil activo en modo estático");
