const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentUpdated, onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { defineString } = require('firebase-functions/params');
const { beforeUserCreated, HttpsError } = require('firebase-functions/v2/identity');
const admin = require('firebase-admin');
try { admin.app(); } catch { admin.initializeApp(); }

const REQUIRE_MEMBERSHIP_MALE = defineString('REQUIRE_MEMBERSHIP_MALE');
const REQUIRE_MEMBERSHIP_FEMALE = defineString('REQUIRE_MEMBERSHIP_FEMALE');
const INSURANCE_DEPOSIT_MIN = defineString('INSURANCE_DEPOSIT_MIN');

exports.health = onRequest({ region: 'europe-west1' }, (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).json({ ok: true, service: 'api', region: 'europe-west1' });
});

exports.verifyRecaptcha = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  try {
    const token = req.body && (req.body.token || req.body.recaptchaToken);
    if (!token) return res.status(400).json({ ok: false, error: 'missing-token' });
    const secret = process.env.RECAPTCHA_SECRET;
    if (!secret) return res.status(500).json({ ok: false, error: 'missing-secret' });
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const data = await resp.json();
    if (!data.success) return res.status(200).json({ ok: false, success: false, errorCodes: data['error-codes'] || [] });
    return res.status(200).json({ ok: true, success: true, score: data.score, action: data.action });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'internal', detail: String(e) });
  }
});

exports.mapsKey = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).json({ ok: true, key: process.env.GMAPS_API_KEY ? 'present' : 'missing' });
});

exports.membershipPolicy = onRequest({ region: 'europe-west1' }, (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    ok: true,
    requireMembershipMale: process.env.REQUIRE_MEMBERSHIP_MALE ?? REQUIRE_MEMBERSHIP_MALE.value(),
    requireMembershipFemale: process.env.REQUIRE_MEMBERSHIP_FEMALE ?? REQUIRE_MEMBERSHIP_FEMALE.value(),
  });
});

exports.depositPolicy = onRequest({ region: 'europe-west1' }, (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    ok: true,
    minDeposit: process.env.INSURANCE_DEPOSIT_MIN ?? INSURANCE_DEPOSIT_MIN.value(),
  });
});

// Auth blocking function: prevent creating accounts via phone provider
exports.blockPhoneSignup = beforeUserCreated({ region: 'europe-west1' }, (event) => {
  try {
    const providerId = event?.credential?.providerId;
    const isPhoneEvent = typeof event?.eventType === 'string' && event.eventType.endsWith(':phone');
    if (providerId === 'phone' || isPhoneEvent) {
      throw new HttpsError('permission-denied', 'Registro con teléfono deshabilitado. Usa email.');
    }
    return;
  } catch (e) {
    // If something unexpected happens, be conservative and allow creation
    // to avoid locking out legitimate registrations.
    console.error('blockPhoneSignup error:', e);
    return;
  }
});

// Admin-only: get user's private phone info
exports.getPrivateUserPhone = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  try {
    const uid = req.query.uid;
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ ok: false, error: 'missing-uid' });
    }
    const authHeader = req.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ ok: false, error: 'missing-auth' });
    }
    const decoded = await admin.auth().verifyIdToken(token).catch(() => null);
    const isAdminClaim = !!decoded && (decoded.role === 'admin' || decoded.admin === true);
    if (!isAdminClaim) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    const snap = await admin.firestore().doc(`users_private/${uid}`).get();
    if (!snap.exists) {
      return res.status(404).json({ ok: false, error: 'not-found' });
    }
    const data = snap.data() || {};
    return res.status(200).json({ ok: true, uid, phone: data.phone || null, phoneVerified: !!data.phoneVerified });
  } catch (e) {
    console.error('getPrivateUserPhone error', e);
    return res.status(500).json({ ok: false, error: 'internal', detail: String(e) });
  }
});

// Admin-only: get uid by email (Auth lookup)
exports.getUidByEmail = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  try {
    const email = req.query.email;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ ok: false, error: 'missing-email' });
    }
    const authHeader = req.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ ok: false, error: 'missing-auth' });
    }
    const decoded = await admin.auth().verifyIdToken(token).catch(() => null);
    const isAdminClaim = !!decoded && (decoded.role === 'admin' || decoded.admin === true);
    if (!isAdminClaim) {
      return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    const userRecord = await admin.auth().getUserByEmail(email).catch(() => null);
    if (!userRecord) {
      return res.status(404).json({ ok: false, error: 'not-found' });
    }
    return res.status(200).json({ ok: true, uid: userRecord.uid });
  } catch (e) {
    console.error('getUidByEmail error', e);
    return res.status(500).json({ ok: false, error: 'internal', detail: String(e) });
  }
});

// ===== Reputación =====
function computeLevel(citas = 0, defaults = 0) {
  const ranks = ['Bronce','Plata','Oro','Platino'];
  let baseIdx = 2 - defaults; // Start at Oro (2), drop per default
  if (baseIdx < 0) baseIdx = 0;
  let level = ranks[baseIdx];
  const ratio = defaults > 0 ? (citas / defaults) : (citas >= 5 ? 5 : 0);
  if (ratio >= 5) level = 'Platino';
  return level;
}

async function updateUserReputation(uid) {
  const ref = admin.firestore().doc(`users/${uid}`);
  const snap = await ref.get();
  const data = snap.exists ? (snap.data() || {}) : {};
  const stats = data.stats || {};
  const citas = Number(stats.citas || 0);
  const defaults = Number(stats.defaults || 0);
  const level = computeLevel(citas, defaults);
  await ref.set({ level, stats: { citas, defaults } }, { merge: true });
  return { level, citas, defaults };
}

// Admin-only: registrar default para un usuario y recomputar level
exports.recordDefault = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  try {
    const authHeader = req.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, error: 'missing-auth' });
    const decoded = await admin.auth().verifyIdToken(token).catch(() => null);
    const isAdminClaim = !!decoded && (decoded.role === 'admin' || decoded.admin === true);
    if (!isAdminClaim) return res.status(403).json({ ok: false, error: 'forbidden' });
    const body = req.body || {};
    const uid = body.uid;
    if (!uid || typeof uid !== 'string') return res.status(400).json({ ok: false, error: 'missing-uid' });
    const ref = admin.firestore().doc(`users/${uid}`);
    await admin.firestore().runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const data = doc.exists ? (doc.data() || {}) : {};
      const stats = data.stats || {};
      const defaults = Number(stats.defaults || 0) + 1;
      const citas = Number(stats.citas || 0);
      const level = computeLevel(citas, defaults);
      tx.set(ref, { stats: { citas, defaults }, level }, { merge: true });
    });
    const result = await updateUserReputation(uid);
    return res.status(200).json({ ok: true, uid, ...result });
  } catch (e) {
    console.error('recordDefault error', e);
    return res.status(500).json({ ok: false, error: 'internal', detail: String(e) });
  }
});

// Trigger: cuando una cita pasa a 'accepted', aumentar contador de citas y recomputar nivel
exports.onAppointmentAccepted = onDocumentUpdated({ region: 'europe-west1', document: 'appointments/{appointmentId}' }, async (event) => {
  try {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const prevStatus = before?.status;
    const currStatus = after?.status;
    const counted = Boolean(after?.countedAcceptance);
    if (prevStatus !== 'accepted' && currStatus === 'accepted' && !counted) {
      const a = String(after?.initiatorUid || '');
      const b = String(after?.partnerUid || '');
      const batch = admin.firestore().batch();
      const refA = admin.firestore().doc(`users/${a}`);
      const refB = admin.firestore().doc(`users/${b}`);
      const [snapA, snapB] = await Promise.all([refA.get(), refB.get()]);
      const dataA = snapA.exists ? (snapA.data() || {}) : {};
      const dataB = snapB.exists ? (snapB.data() || {}) : {};
      const statsA = dataA.stats || {}; const statsB = dataB.stats || {};
      const citasA = Number(statsA.citas || 0) + 1; const citasB = Number(statsB.citas || 0) + 1;
      const defaultsA = Number(statsA.defaults || 0); const defaultsB = Number(statsB.defaults || 0);
      const levelA = computeLevel(citasA, defaultsA);
      const levelB = computeLevel(citasB, defaultsB);
      batch.set(refA, { stats: { citas: citasA, defaults: defaultsA }, level: levelA }, { merge: true });
      batch.set(refB, { stats: { citas: citasB, defaults: defaultsB }, level: levelB }, { merge: true });
      const apptRef = admin.firestore().doc(`appointments/${event.params.appointmentId}`);
      batch.set(apptRef, { countedAcceptance: true }, { merge: true });
      await batch.commit();
    }
  } catch (e) {
    console.error('onAppointmentAccepted error', e);
  }
});

// HTTP alternativa: contar cita aceptada (para evitar depender de Eventarc inicialmente)
exports.countAcceptedAppointment = onRequest({ region: 'europe-west1' }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  try {
    const authHeader = req.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, error: 'missing-auth' });
    const decoded = await admin.auth().verifyIdToken(token).catch(() => null);
    if (!decoded) return res.status(403).json({ ok: false, error: 'forbidden' });
    const uid = decoded.uid;
    const apptId = req.body && req.body.appointmentId;
    if (!apptId || typeof apptId !== 'string') return res.status(400).json({ ok: false, error: 'missing-appointmentId' });
    const apptRef = admin.firestore().doc(`appointments/${apptId}`);
    const apptSnap = await apptRef.get();
    if (!apptSnap.exists) return res.status(404).json({ ok: false, error: 'appointment-not-found' });
    const appt = apptSnap.data() || {};
    const participants = [String(appt.initiatorUid || ''), String(appt.partnerUid || '')];
    if (!participants.includes(uid)) return res.status(403).json({ ok: false, error: 'not-participant' });
    if (appt.status !== 'accepted') return res.status(400).json({ ok: false, error: 'not-accepted' });
    if (appt.countedAcceptance) return res.status(200).json({ ok: true, alreadyCounted: true });
    const a = participants[0]; const b = participants[1];
    const batch = admin.firestore().batch();
    const refA = admin.firestore().doc(`users/${a}`);
    const refB = admin.firestore().doc(`users/${b}`);
    const [snapA, snapB] = await Promise.all([refA.get(), refB.get()]);
    const dataA = snapA.exists ? (snapA.data() || {}) : {}; const dataB = snapB.exists ? (snapB.data() || {}) : {};
    const statsA = dataA.stats || {}; const statsB = dataB.stats || {};
    const citasA = Number(statsA.citas || 0) + 1; const citasB = Number(statsB.citas || 0) + 1;
    const defaultsA = Number(statsA.defaults || 0); const defaultsB = Number(statsB.defaults || 0);
    const levelA = computeLevel(citasA, defaultsA); const levelB = computeLevel(citasB, defaultsB);
    batch.set(refA, { stats: { citas: citasA, defaults: defaultsA }, level: levelA }, { merge: true });
    batch.set(refB, { stats: { citas: citasB, defaults: defaultsB }, level: levelB }, { merge: true });
    batch.set(apptRef, { countedAcceptance: true }, { merge: true });
    await batch.commit();
    return res.status(200).json({ ok: true, updated: true });
  } catch (e) {
    console.error('countAcceptedAppointment error', e);
    return res.status(500).json({ ok: false, error: 'internal', detail: String(e) });
  }
});

// ========== Perfil y Claims ==========
// Al crear doc de usuario: fijar displayName en Auth y claims iniciales (role='user', gender)
exports.onUserDocCreate = onDocumentCreated({ region: 'europe-west1', document: 'users/{userId}' }, async (event) => {
  try {
    const uid = event.params.userId;
    const data = event.data?.data() || {};
    const rawName = (data.name || data.alias || '').toString();
    const name = rawName.slice(0, 100);
    const g = (data.gender || '').toString().toLowerCase();
    const gender = ['masculino','femenino'].includes(g) ? g : null;

    // Actualiza displayName en Auth (best-effort)
    try { await admin.auth().updateUser(uid, { displayName: name }); } catch (e) { /* noop */ }

    // Claims iniciales: conservar claims previos
    const user = await admin.auth().getUser(uid);
    const oldClaims = user.customClaims || {};
    await admin.auth().setCustomUserClaims(uid, { ...oldClaims, role: oldClaims.role || 'user', gender });
  } catch (e) {
    console.error('onUserDocCreate error', e);
  }
});

// Propagar cambios posteriores de role/gender del doc de usuario a las claims
exports.onUserDocWrite = onDocumentWritten({ region: 'europe-west1', document: 'users/{userId}' }, async (event) => {
  try {
    const uid = event.params.userId;
    const before = event.data.before ? (event.data.before.data() || {}) : null;
    const after = event.data.after ? (event.data.after.data() || {}) : null;
    if (!after) return;

    const allowedRoles = new Set(['user','concierge','admin']);
    const rawRole = (after.userRole ?? after.role ?? '').toString().toLowerCase();
    const role = allowedRoles.has(rawRole) ? rawRole : undefined;

    const rawGender = (after.gender ?? '').toString().toLowerCase();
    const gender = ['masculino','femenino'].includes(rawGender) ? rawGender : undefined;

    const roleChanged = !!role && (!before || (before.userRole ?? before.role) !== rawRole);
    const genderChanged = (typeof gender !== 'undefined') && (!before || (before.gender ?? '').toString().toLowerCase() !== rawGender);
    if (!roleChanged && !genderChanged) return;

    const user = await admin.auth().getUser(uid);
    const oldClaims = user.customClaims || {};
    const newClaims = { ...oldClaims };
    if (roleChanged) newClaims.role = role;
    if (genderChanged) newClaims.gender = gender;
    await admin.auth().setCustomUserClaims(uid, newClaims);
  } catch (e) {
    console.error('onUserDocWrite error', e);
  }
});

// ========== Chat ACL en Storage ==========
// Sincroniza ACL: crea/elimina ficheros vacíos en /chat_attachments/{conversationId}/__acl__/{uid}
exports.syncChatACL = onDocumentWritten({ region: 'europe-west1', document: 'conversations/{conversationId}' }, async (event) => {
  try {
    const conversationId = event.params.conversationId;
    const after = event.data.after ? (event.data.after.data() || {}) : null;
    const before = event.data.before ? (event.data.before.data() || {}) : null;

    const afterSet = new Set((after?.participants || []).map((x) => String(x)));
    const beforeSet = new Set((before?.participants || []).map((x) => String(x)));

    const added = [...afterSet].filter((x) => !beforeSet.has(x));
    const removed = [...beforeSet].filter((x) => !afterSet.has(x));

    if (!added.length && !removed.length) return;
    const bucket = admin.storage().bucket();

    await Promise.all([
      ...added.map((uid) => bucket.file(`chat_attachments/${conversationId}/__acl__/${uid}`).save('')),
      ...removed.map((uid) => bucket.file(`chat_attachments/${conversationId}/__acl__/${uid}`).delete({ ignoreNotFound: true })),
    ]);
  } catch (e) {
    console.error('syncChatACL error', e);
  }
});
