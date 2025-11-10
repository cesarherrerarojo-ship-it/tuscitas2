// Helper para obtener el género del propietario con fallback a Firestore
// Retorna 'masculino' | 'femenino' y lanza error si no se puede determinar
// Requiere que en la página esté disponible firebase auth y firestore config

/* global firebase */

export async function getOwnerGender(auth, db) {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay usuario autenticado');

  // Fuerza refresh de token para claims frescas
  const token = await user.getIdToken(true);
  const idTokenResult = await user.getIdTokenResult();
  let g = (idTokenResult.claims.gender ?? '').toString().toLowerCase();

  if (g !== 'masculino' && g !== 'femenino') {
    const snap = await firebase.firestore().doc(`users/${user.uid}`).get();
    g = ((snap.data()?.gender ?? '')).toString().toLowerCase();
  }

  if (g !== 'masculino' && g !== 'femenino') {
    throw new Error('Género no establecido en claims ni en users/{uid}');
  }
  return g;
}

export function assertValidImage(file, maxBytes = 5 * 1024 * 1024) {
  if (!file) throw new Error('No se proporcionó archivo');
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen');
  }
  if (file.size > maxBytes) {
    throw new Error('La imagen no puede superar 5MB');
  }
}

