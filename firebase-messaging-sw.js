/**
 * Firebase Cloud Messaging Service Worker
 * Handles background push notifications for TuCitaSegura
 */

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize Firebase in service worker
// Note: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'TuCitaSegura';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva notificación',
    icon: payload.notification?.icon || '/assets/icon.png',
    badge: '/assets/badge.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
    tag: payload.data?.type || 'general',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Handle different notification types
  const data = event.notification.data;
  let targetUrl = data.url || '/webapp/perfil.html';

  // Determine URL based on notification type
  switch (data.type) {
    case 'new_match':
      targetUrl = '/webapp/conversaciones.html';
      break;

    case 'new_message':
      if (data.conversationId) {
        targetUrl = `/webapp/chat.html?id=${data.conversationId}`;
      }
      break;

    case 'date_request':
    case 'date_confirmed':
    case 'date_reminder':
      if (data.appointmentId) {
        targetUrl = `/webapp/cita-detalle.html?id=${data.appointmentId}`;
      }
      break;

    case 'new_badge':
      targetUrl = '/webapp/logros.html';
      break;

    case 'vip_event':
      targetUrl = '/webapp/eventos-vip.html';
      break;

    case 'referral_completed':
      targetUrl = '/webapp/referidos.html';
      break;
  }

  // Open the app at the target URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }

        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle push event (for custom handling)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    // Custom handling for specific notification types
    if (data.type === 'silent') {
      // Silent notification - don't show anything
      // Just update app state or cache
      return;
    }

  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }
});

console.log('[Service Worker] Firebase Messaging Service Worker loaded');
