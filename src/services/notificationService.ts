import { initializeApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

/**
 * Request notification permission from the user
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser.');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Show a simple browser notification
 */
export const showNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    // If a service worker is available, use it for the notification
    // as it allows for background interaction handling
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          ...options
        });
      });
    } else {
      // Fallback to standard Notification API
      new Notification(title, {
        icon: '/pwa-192x192.png',
        ...options
      });
    }
  }
};

/**
 * Schedules a notification for a future time
 * Note: This is an emulation for the current session. 
 * Real background scheduling requires a server or Push API.
 */
export const scheduleNotification = (title: string, options: NotificationOptions & { delayMs: number }) => {
  const { delayMs, ...notificationOptions } = options;
  if (delayMs <= 0) {
    showNotification(title, notificationOptions);
    return;
  }

  setTimeout(() => {
    showNotification(title, notificationOptions);
  }, delayMs);
};
