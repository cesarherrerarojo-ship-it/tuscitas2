// functions/index.js (Node 18)
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// ============================================================================
// 1) CUSTOM CLAIMS: Al crear el doc de usuario, fijamos displayName y claims
// ============================================================================
exports.onUserDocCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, ctx) => {
    const uid = ctx.params.userId;
    const data = snap.data() || {};
    const name = (data.name || data.alias || '').toString().slice(0, 100);
    const gender = ['masculino','femenino'].includes(data.gender) ? data.gender : null;
    const userRole = data.userRole || 'regular';

    console.log(`[onUserDocCreate] Setting claims for ${uid}: role=${userRole}, gender=${gender}`);

    // Display name en Auth
    try {
      await admin.auth().updateUser(uid, { displayName: name });
      console.log(`[onUserDocCreate] Updated displayName for ${uid}`);
    } catch (e) {
      console.error(`[onUserDocCreate] Error updating displayName:`, e);
    }

    // Claims iniciales (conservando otros si existieran)
    try {
      const user = await admin.auth().getUser(uid);
      const oldClaims = user.customClaims || {};
      await admin.auth().setCustomClaims(uid, {
        ...oldClaims,
        role: userRole,
        gender: gender
      });
      console.log(`[onUserDocCreate] Custom claims set for ${uid}`);
    } catch (e) {
      console.error(`[onUserDocCreate] Error setting custom claims:`, e);
    }
  });

// ============================================================================
// 2) CUSTOM CLAIMS UPDATE: Propagar cambios de role/gender a claims
// ============================================================================
exports.onUserDocUpdate = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, ctx) => {
    const uid = ctx.params.userId;
    const before = change.before.data();
    const after = change.after.data();

    // Solo actualizar claims si role o gender cambiaron
    const roleChanged = before.userRole !== after.userRole;
    const genderChanged = before.gender !== after.gender;

    if (!roleChanged && !genderChanged) {
      console.log(`[onUserDocUpdate] No role/gender changes for ${uid}, skipping`);
      return null;
    }

    const newRole = after.userRole || 'regular';
    const newGender = ['masculino','femenino'].includes(after.gender) ? after.gender : null;

    console.log(`[onUserDocUpdate] Updating claims for ${uid}: role=${newRole}, gender=${newGender}`);

    try {
      const user = await admin.auth().getUser(uid);
      const oldClaims = user.customClaims || {};
      await admin.auth().setCustomClaims(uid, {
        ...oldClaims,
        role: newRole,
        gender: newGender
      });
      console.log(`[onUserDocUpdate] Claims updated for ${uid}`);
    } catch (e) {
      console.error(`[onUserDocUpdate] Error updating claims:`, e);
    }

    return null;
  });

// ============================================================================
// 3) CHAT ACL: Sincroniza ACL de chats en Storage cuando cambian participantes
// ============================================================================
exports.syncChatACL = functions.firestore
  .document('conversations/{conversationId}')
  .onWrite(async (change, ctx) => {
    const conversationId = ctx.params.conversationId;
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;

    const afterSet = new Set((after?.participants || []).map(String));
    const beforeSet = new Set((before?.participants || []).map(String));

    const added = [...afterSet].filter(x => !beforeSet.has(x));
    const removed = [...beforeSet].filter(x => !afterSet.has(x));

    console.log(`[syncChatACL] Conversation ${conversationId}: +${added.length} -${removed.length} participants`);

    if (added.length === 0 && removed.length === 0) {
      console.log(`[syncChatACL] No changes, skipping`);
      return null;
    }

    const bucket = admin.storage().bucket();

    try {
      await Promise.all([
        ...added.map(uid => {
          console.log(`[syncChatACL] Adding ACL for ${uid} in ${conversationId}`);
          return bucket.file(`chat_attachments/${conversationId}/__acl__/${uid}`).save('');
        }),
        ...removed.map(uid => {
          console.log(`[syncChatACL] Removing ACL for ${uid} in ${conversationId}`);
          return bucket.file(`chat_attachments/${conversationId}/__acl__/${uid}`).delete({ ignoreNotFound: true });
        }),
      ]);
      console.log(`[syncChatACL] ACL sync complete for ${conversationId}`);
    } catch (e) {
      console.error(`[syncChatACL] Error syncing ACL:`, e);
    }

    return null;
  });

// ============================================================================
// 4) ADMIN: Función HTTP para actualizar claims manualmente (útil para testing)
// ============================================================================
exports.updateUserClaims = functions.https.onCall(async (data, context) => {
  // Solo admins pueden llamar esta función
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden actualizar custom claims'
    );
  }

  const { userId, role, gender } = data;

  if (!userId || !role || !gender) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan parámetros requeridos: userId, role, gender'
    );
  }

  if (!['regular', 'admin', 'concierge'].includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'role debe ser: regular, admin, o concierge'
    );
  }

  if (!['masculino', 'femenino'].includes(gender)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'gender debe ser: masculino o femenino'
    );
  }

  try {
    await admin.auth().setCustomClaims(userId, { role, gender });
    console.log(`[updateUserClaims] Claims updated for ${userId}: role=${role}, gender=${gender}`);
    return { success: true, message: `Claims actualizados para ${userId}` };
  } catch (error) {
    console.error(`[updateUserClaims] Error:`, error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================================
// 5) UTILITY: Función HTTP para obtener claims de un usuario (debugging)
// ============================================================================
exports.getUserClaims = functions.https.onCall(async (data, context) => {
  // Solo usuarios autenticados pueden ver sus propios claims, admins pueden ver cualquiera
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Debes estar autenticado'
    );
  }

  const { userId } = data;
  const targetUserId = userId || context.auth.uid;

  // Si no eres admin y no es tu propio ID, denegar
  if (targetUserId !== context.auth.uid && context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo puedes ver tus propios claims'
    );
  }

  try {
    const user = await admin.auth().getUser(targetUserId);
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      customClaims: user.customClaims || {}
    };
  } catch (error) {
    console.error(`[getUserClaims] Error:`, error);
    throw new functions.https.HttpsError('not-found', 'Usuario no encontrado');
  }
});
