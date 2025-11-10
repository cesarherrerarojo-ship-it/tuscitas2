// Route guard para exigir sesión y perfil COMPLETADO y VALIDADO
import { auth, db } from "./firebase-config-enterprise.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Al cargar este módulo, verificamos estado de perfil
onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) {
      // Usuario no autenticado: redirige al inicio (evita bucle cuando ya estás en '/')
      if (location.pathname !== "/") {
        location.href = "/";
      }
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    const u = snap.exists() ? snap.data() : {};

    // Páginas exceptuadas
    const isLanding = location.pathname === "/";
    const isProfilePage = location.pathname === "/perfil.html";

    // Exigir perfil COMPLETO y VALIDADO para todo el sitio (excepto landing y perfil)
    const complete = !!u.profileComplete;
    const validated = !!u.profileValidated;
    if ((!complete || !validated) && !isProfilePage && !isLanding) {
      const reason = encodeURIComponent("validation-required");
      location.href = `/perfil.html?reason=${reason}`;
      return;
    }
  } catch (e) {
    console.error("Guard error", e);
    // Fail-safe: envía al perfil
    if (location.pathname !== "/perfil.html") {
      location.href = "/perfil.html";
    }
  }
});

console.log("✅ Guard de perfil completado y validado activo");
