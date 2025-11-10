// Usage:
//  node scripts/setAdminClaim.js --uid=<UID>
//  node scripts/setAdminClaim.js --email=<EMAIL>
//
// Auth setup:
//  - Set GOOGLE_APPLICATION_CREDENTIALS to your Service Account JSON path
//    PowerShell:  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\ruta\\serviceAccount.json"
//  - Or set FIREBASE_SERVICE_ACCOUNT_PATH to the JSON path
//
// Then run one of the usage commands above.

const admin = require('firebase-admin');

function getCredential() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.credential.applicationDefault();
  }
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!keyPath) {
    throw new Error(
      'Configure GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_PATH with your service account JSON path.'
    );
  }
  const serviceAccount = require(keyPath);
  return admin.credential.cert(serviceAccount);
}

admin.initializeApp({ credential: getCredential() });

async function main() {
  const args = process.argv.slice(2);
  const uidArg = args.find((a) => a.startsWith('--uid='));
  const emailArg = args.find((a) => a.startsWith('--email='));
  const roleArg = args.find((a) => a.startsWith('--role='));

  if (!uidArg && !emailArg) {
    console.error('Usage: node scripts/setAdminClaim.js --uid=<UID> [--role=admin|concierge] or --email=<EMAIL> [--role=admin|concierge]');
    process.exit(1);
  }

  let uid;
  if (uidArg) {
    uid = uidArg.split('=')[1];
  } else {
    const email = emailArg.split('=')[1];
    if (!email) {
      console.error('Invalid --email argument');
      process.exit(1);
    }
    const user = await admin.auth().getUserByEmail(email);
    uid = user.uid;
  }

  let role = 'admin';
  if (roleArg) {
    const r = roleArg.split('=')[1];
    if (r === 'admin' || r === 'concierge') {
      role = r;
    } else {
      console.error('Invalid --role. Allowed: admin | concierge');
      process.exit(1);
    }
  }
  await admin.auth().setCustomUserClaims(uid, { role });
  const updated = await admin.auth().getUser(uid);
  console.log('User updated. Custom claims:', updated.customClaims);
  console.log('Done. If you are logged in, refresh ID token in client with auth.currentUser.getIdToken(true)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
