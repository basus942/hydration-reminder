const CACHE_NAME = 'hydrotrack-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg'
];

const DB_NAME = 'hydrotrack_db';
const DB_VERSION = 1;

// --- IndexedDB Helper inside Service Worker ---
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getDBItem(storeName, key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function getAllLogs() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('logs', 'readonly');
      const store = tx.objectStore('logs');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

async function addLogEntry(amountMl) {
  try {
    const db = await openDB();
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      amount_ml: amountMl,
      timestamp: Date.now()
    };
    return new Promise((resolve) => {
      const tx = db.transaction('logs', 'readwrite');
      const store = tx.objectStore('logs');
      store.put(entry);
      tx.oncomplete = () => {
        notifyClients({ type: 'DATA_UPDATED', newEntry: entry });
        resolve(entry);
      };
      tx.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage(message);
  }
}

// Calculate today's total intake
function getTodayIntake(logs) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTimestamp = startOfDay.getTime();

  return logs
    .filter((item) => item.timestamp >= startTimestamp)
    .reduce((sum, item) => sum + (Number(item.amount_ml) || 0), 0);
}

// Check and trigger reminder notification
async function checkAndSendReminder() {
  const settings = await getDBItem('settings', 'user_settings');
  if (!settings || !settings.reminder_enabled) {
    return;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = (settings.reminder_start || '08:00').split(':').map(Number);
  const [endH, endM] = (settings.reminder_end || '22:00').split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Check if current time is within reminder window (supports cross-midnight windows)
  const isInWindow = startMinutes <= endMinutes
    ? (currentMinutes >= startMinutes && currentMinutes <= endMinutes)
    : (currentMinutes >= startMinutes || currentMinutes <= endMinutes);

  if (!isInWindow) {
    return;
  }

  // Check if goal is already met (FR6)
  const logs = await getAllLogs();
  const todayTotal = getTodayIntake(logs);
  const dailyGoal = Number(settings.daily_goal_ml) || 2000;

  if (todayTotal >= dailyGoal) {
    // Goal met! Skip notification
    return;
  }

  const remaining = dailyGoal - todayTotal;
  const quotes = [
    `Time for a sip! 💧 You've had ${todayTotal.toLocaleString()} ml so far (${remaining.toLocaleString()} ml left).`,
    `Stay hydrated and energized! 🌊 Quick 250ml sip?`,
    `Hydration break! 🥤 Only ${remaining.toLocaleString()} ml to hit your ${dailyGoal.toLocaleString()} ml goal.`,
    `Drink up! 💦 Your body will thank you.`
  ];
  const bodyText = quotes[Math.floor(Math.random() * quotes.length)];

  await self.registration.showNotification('HydroTrack Reminder 💧', {
    body: bodyText,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: 'hydrotrack-reminder',
    renotify: true,
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'log-250', title: '+250 ml Water' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  });
}

// --- Lifecycle Events ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Stale-while-revalidate / cache-first with network fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Periodic Sync (for supported browsers)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'hydrotrack-reminder-check') {
    event.waitUntil(checkAndSendReminder());
  }
});

// Push Notification (if future Web Push connected)
self.addEventListener('push', (event) => {
  event.waitUntil(checkAndSendReminder());
});

// Handle incoming messages from UI
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'TRIGGER_REMINDER_CHECK') {
    event.waitUntil(checkAndSendReminder());
  } else if (event.data.type === 'TRIGGER_TEST_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification('HydroTrack 💧 (Test Notification)', {
        body: 'Notifications are working perfectly! You will receive regular hydration reminders.',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        tag: 'hydrotrack-test',
        renotify: true,
        data: { url: '/' },
        actions: [
          { action: 'log-250', title: '+250 ml Water' },
          { action: 'dismiss', title: 'Got it!' }
        ]
      })
    );
  } else if (event.data.type === 'SYNC_SCHEDULE') {
    // Schedule updated, run immediate check if needed
    if (event.data.immediate) {
      event.waitUntil(checkAndSendReminder());
    }
  }
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'log-250') {
    event.waitUntil(
      addLogEntry(250).then(() => {
        return self.registration.showNotification('Logged! 💧', {
          body: 'Added +250 ml to your daily hydration.',
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: 'hydrotrack-confirm',
          silent: true
        });
      })
    );
    return;
  }

  if (event.action === 'dismiss') {
    return;
  }

  // Open / Focus app window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
