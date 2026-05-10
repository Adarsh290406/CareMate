importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-messaging-compat.js');

// These credentials will be injected or read from a config if needed, 
// but for the SW we usually hardcode or use a manifest.
// For simplicity in this applet, I'll use a placeholder structure.
firebase.initializeApp({
  projectId: "gen-lang-client-0745704782",
  appId: "1:230736691270:web:a4c5fecd655ee131648a47",
  apiKey: "AIzaSyBcpB12V2U-12Ptggxrut9Dvt3oLFfR7FA",
  authDomain: "gen-lang-client-0745704782.firebaseapp.com",
  storageBucket: "gen-lang-client-0745704782.firebasestorage.app",
  messagingSenderId: "230736691270"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
