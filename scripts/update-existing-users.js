import 'dotenv/config';
import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'demo-tucs';
const dryRun = process.env.DRY_RUN !== 'false';

let app;
try {
  const cred = admin.credential.applicationDefault();
  app = admin.initializeApp({ credential: cred, projectId });
} catch {
  app = admin.initializeApp({ projectId });
}

const auth = admin.auth(app);
const db = admin.firestore(app);

const now = admin.firestore.FieldValue.serverTimestamp();

function deriveRoleFromClaims(claims) {
  if (claims?.admin) return 'admin';
  if (claims?.concierge) return 'concierge';
  return 'user';
}

function defaultsFromAuth(user, claims) {
  return {
    uid: user.uid,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    email: user.email ?? null,
    emailVerified: !!user.emailVerified,
    phoneNumber: user.phoneNumber ?? null,
    gender: 'unknown',
    role: deriveRoleFromClaims(claims),
    membership: { active: false, tier: null },
    vipEligible: !!claims?.vipEligible,
    status: 'active',
    updatedAt: now
  };
}

async function upsertUserProfile(u) {
  const token = await auth.createCustomToken(u.uid).catch(() => null);
  let claims = null;
  try {
    const record = await auth.getUser(u.uid);
    claims = record.customClaims || null;
  } catch {}

  const docRef = db.collection('users').doc(u.uid);
  const snap = await docRef.get();
  const base = defaultsFromAuth(u, claims);

  if (snap.exists) {
    const current = snap.data() || {};
    const update = { ...base };
    if (!current.createdAt) update.createdAt = now; else delete update.createdAt;
    if (dryRun) return { wrote: false, id: u.uid };
    await docRef.set(update, { merge: true });
    return { wrote: true, id: u.uid };
  } else {
    const create = { ...base, createdAt: now };
    if (dryRun) return { wrote: false, id: u.uid };
    await docRef.set(create, { merge: true });
    return { wrote: true, id: u.uid };
  }
}

async function main() {
  let nextPageToken;
  let processed = 0;
  let wrote = 0;
  do {
    const res = await auth.listUsers(1000, nextPageToken);
    for (const u of res.users) {
      const r = await upsertUserProfile(u);
      processed += 1;
      if (r.wrote) wrote += 1;
      if (processed % 50 === 0) {
        console.log(`Procesados: ${processed}, escritos: ${wrote}${dryRun ? ' (dry-run)' : ''}`);
      }
    }
    nextPageToken = res.pageToken;
  } while (nextPageToken);
  console.log(`Finalizado. Usuarios procesados: ${processed}, perfiles escritos: ${wrote}${dryRun ? ' (dry-run)' : ''}`);
}

main().catch((e) => {
  console.error('Error en actualización de usuarios:', e);
  process.exitCode = 1;
});

