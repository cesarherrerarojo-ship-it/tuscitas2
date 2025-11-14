// Firebase Configuration for TuCitaSegura
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Your web app's Firebase configuration
// Configuration extracted from project logs
const firebaseConfig = {
  apiKey: "AIzaSyAgFcoHwoBpo80rlEHL2hHVZ2DqtjWXh2s",
  authDomain: "tuscitasseguras-2d1a6.firebaseapp.com",
  projectId: "tuscitasseguras-2d1a6",
  storageBucket: "tuscitasseguras-2d1a6.firebasestorage.app",
  messagingSenderId: "924208562587",
  appId: "1:924208562587:web:5291359426fe390b36213e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ============================================================================
// FIREBASE CLOUD MESSAGING (FCM) CONFIGURATION
// ============================================================================

/**
 * VAPID Public Key for Push Notifications
 *
 * ⚠️ CONFIGURATION REQUIRED:
 * 1. Go to Firebase Console → Project Settings
 * 2. Navigate to "Cloud Messaging" tab
 * 3. Scroll to "Web Push certificates"
 * 4. Click "Generate key pair" if not already generated
 * 5. Copy the public key and replace the value below
 *
 * NOTE: This is a PUBLIC key - safe to include in client code
 * The key starts with "B" and is 88 characters long
 *
 * @example
 * export const VAPID_PUBLIC_KEY = 'BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
 */
export const VAPID_PUBLIC_KEY = 'BJW5I1B7KSEvM1q8FuwNokyu4sgoUy0u93C2XSQ8kpDVUdw6jv1UgYo9k_lIRjs-Rpte-YUkFqM7bbOYAD32T-w';
// ✅ VAPID key configured (2025-11-14)
// See: https://console.firebase.google.com/project/tuscitasseguras-2d1a6/settings/cloudmessaging

// Export app for potential future use
export default app;
