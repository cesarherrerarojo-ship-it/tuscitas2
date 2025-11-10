// Firebase App Check Configuration - DEBUG TOKEN ONLY (No reCAPTCHA)
// This version skips reCAPTCHA validation for localhost development

import app from './firebase-config.js';

// ============================================================================
// DEBUG TOKEN ONLY MODE (FOR LOCALHOST)
// ============================================================================

const isDevelopment = location.hostname === "localhost" ||
                     location.hostname === "127.0.0.1" ||
                     location.hostname.includes("192.168.");

if (isDevelopment) {
  // Set debug token mode BEFORE any App Check initialization
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 App Check: DEBUG TOKEN ONLY MODE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 This mode bypasses reCAPTCHA for localhost development');
  console.log('');
  console.log('⚠️  IMPORTANT:');
  console.log('   1. A debug token will be generated automatically');
  console.log('   2. Copy the token from the console below');
  console.log('   3. Register it in Firebase Console:');
  console.log('      https://console.firebase.google.com/project/tuscitasseguras-2d1a6/appcheck');
  console.log('   4. Go to Apps → Manage debug tokens → Add debug token');
  console.log('   5. Make sure Enforcement is DISABLED:');
  console.log('      - Authentication → Unenforced');
  console.log('      - Cloud Firestore → Unenforced');
  console.log('      - Cloud Storage → Unenforced');
  console.log('   6. Reload this page');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

// ============================================================================
// MINIMAL APP CHECK INITIALIZATION
// ============================================================================

let appCheck = null;

try {
  // Import App Check modules
  const { initializeAppCheck, ReCaptchaV3Provider } = await import(
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js"
  );

  // Initialize with a dummy site key (won't be used in debug mode)
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LfdTvQrAAAAACkGjvbbFIkqHMsTHwRYYZS_CGq2'),
    isTokenAutoRefreshEnabled: true
  });

  window._appCheckInstance = appCheck;

  console.log('✅ App Check initialized in DEBUG TOKEN mode');
  console.log('📍 Mode: LOCALHOST DEVELOPMENT');
  console.log('🔑 Waiting for debug token...');
  console.log('');

  // Wait for debug token to appear
  setTimeout(() => {
    console.log('👀 Check above for "App Check debug token: [TOKEN]"');
    console.log('   Copy that token and register it in Firebase Console');
  }, 1000);

} catch (error) {
  console.error('❌ Error initializing App Check:', error);
  console.error('Stack:', error.stack);
}

// ============================================================================
// HELPER: GET TOKEN MANUALLY
// ============================================================================

window.getAppCheckToken = async function() {
  if (!appCheck) {
    console.error('❌ App Check not initialized');
    return null;
  }

  try {
    const { getToken } = await import(
      "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js"
    );

    const tokenResult = await getToken(appCheck, false);

    console.log('✅ App Check token obtained successfully');
    console.log('   Token:', tokenResult.token.substring(0, 30) + '...');

    return tokenResult;
  } catch (error) {
    console.error('❌ Error getting App Check token:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);

    if (error.message.includes('400')) {
      console.error('');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🚨 400 BAD REQUEST - reCAPTCHA Configuration Problem');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('');
      console.error('This usually means:');
      console.error('  ❌ The site key is not registered in Firebase Console App Check');
      console.error('  ❌ OR the domain (localhost) is not authorized');
      console.error('');
      console.error('QUICK FIX:');
      console.error('  1. Go to Firebase Console → App Check');
      console.error('  2. Make sure ALL services show "Unenforced":');
      console.error('     - Authentication → Unenforced');
      console.error('     - Cloud Firestore → Unenforced');
      console.error('     - Cloud Storage → Unenforced');
      console.error('  3. Reload this page');
      console.error('');
      console.error('If that doesn\'t work:');
      console.error('  1. Comment out App Check import in your HTML files');
      console.error('  2. Work without App Check temporarily');
      console.error('  3. Fix reCAPTCHA configuration later');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    return null;
  }
};

// ============================================================================
// AUTO-TEST IN DEVELOPMENT
// ============================================================================

if (isDevelopment) {
  setTimeout(async () => {
    console.log('');
    console.log('🧪 Testing App Check...');
    const result = await window.getAppCheckToken();

    if (result) {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ SUCCESS: App Check is working!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ All Firebase requests will include App Check tokens');
      console.log('✅ You should NOT see 401 or 403 errors');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  WARNING: App Check token not obtained');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Check if debug token appears above (App Check debug token: ...)');
      console.log('  2. If yes: Copy it and register in Firebase Console');
      console.log('  3. If no: Check for errors above');
      console.log('  4. Verify Enforcement is DISABLED in Firebase Console');
      console.log('');
    }
  }, 3000);
}

export { appCheck };
