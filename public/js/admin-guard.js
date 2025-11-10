// Admin route guard utility
import { auth, db } from "/js/firebase-config-enterprise.js";
import { onAuthStateChanged, getIdTokenResult } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/**
 * Ensures current user is authenticated and has role === 'admin'.
 * If not, redirects to '/'. Returns the user profile if admin.
 */
export function ensureAdmin() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = '/'; return; }
      const isPreview = (() => { try { return new URLSearchParams(location.search).get('preview') === '1'; } catch { return false; } })();
      try {
        // Primero, verificar el custom claim de Auth requerido por las reglas de Firestore
        const tokenResult = await getIdTokenResult(user).catch(() => null);
        const hasAdminClaim = !!tokenResult?.claims?.role && tokenResult.claims.role === 'admin';

        const snap = await getDoc(doc(db, 'users', user.uid));
        const profile = snap.exists() ? snap.data() : {};
        const privSnap = await getDoc(doc(db, 'users_private', user.uid));
        const priv = privSnap.exists() ? privSnap.data() : {};
        // Bloquea acceso si el perfil no está completo
        if (!profile.profileComplete && !isPreview) {
          location.href = '/perfil.html?reason=validation-required';
          return;
        }
        // Enforce phone verification for admin pages as well
        if (!priv.phoneVerified && !isPreview) {
          location.href = '/perfil.html?reason=phone-required';
          return;
        }
        // Requiere tanto el claim en el token como (opcionalmente) el rol en perfil
        if (hasAdminClaim || profile.role === 'admin') {
          // Si el perfil tiene rol pero falta el claim, forzar refresh de token para evitar fallas en reglas
          if (profile.role === 'admin' && !hasAdminClaim) {
            try { await auth.currentUser?.getIdToken(true); } catch {}
          }
          resolve({ uid: user.uid, email: user.email, profile });
        } else {
          alert('Acceso restringido a administradores');
          location.href = '/';
        }
      } catch (e) {
        console.error('Admin guard error', e);
        location.href = '/';
      }
    });
  });
}

console.log('✅ Guardia de administrador lista');
