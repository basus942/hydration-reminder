let swRegistration = null;
let activeIntervalTimer = null;

// Register Service Worker
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;

    // Register Periodic Sync if supported
    if ('periodicSync' in reg) {
      try {
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
        if (status.state === 'granted') {
          await reg.periodicSync.register('hydrotrack-reminder-check', {
            minInterval: 15 * 60 * 1000 // 15 minutes minimum
          });
        }
      } catch {
        // Periodic sync not permitted, fallback to SW timer and in-tab sync
      }
    }

    return reg;
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}

// Request Notification Permission
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

// Send test notification via Service Worker
export async function sendTestNotification() {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    alert('Please allow notification permissions in your browser to test reminders.');
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        reg.showNotification('HydroTrack 💧 (Test Notification)', {
          body: 'Notifications are working! You will receive regular hydration reminders.',
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: 'hydrotrack-test',
          renotify: true,
          data: { url: '/' },
          actions: [
            { action: 'log-250', title: '+250 ml Water' },
            { action: 'dismiss', title: 'Got it!' }
          ]
        });
        return true;
      }
    }
  } catch (err) {
    console.warn('Service worker notification failed, trying fallback:', err);
  }

  // Fallback if supported
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('HydroTrack 💧 (Test Notification)', {
        body: 'Notifications are working! You will receive daily hydration reminders.',
        icon: '/icon-192.svg'
      });
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

// Sync Reminder Schedule to Service Worker and set active interval
export function setupReminderSchedule(settings) {
  if (!settings || !settings.reminder_enabled) {
    if (activeIntervalTimer) {
      clearInterval(activeIntervalTimer);
      activeIntervalTimer = null;
    }
    return;
  }

  const intervalMs = Math.max(1, Number(settings.interval_minutes) || 60) * 60 * 1000;

  // 1. Send sync message when SW is ready
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.active) {
        reg.active.postMessage({
          type: 'SYNC_SCHEDULE',
          settings
        });
      }
    }).catch(() => {});
  }

  // 2. Setup in-tab interval as active fallback (checking SW trigger)
  if (activeIntervalTimer) {
    clearInterval(activeIntervalTimer);
  }

  activeIntervalTimer = setInterval(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          reg.active.postMessage({ type: 'TRIGGER_REMINDER_CHECK' });
        }
      }).catch(() => {});
    }
  }, intervalMs);
}
