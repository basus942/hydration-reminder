const DB_NAME = 'tarang_db';
const DB_VERSION = 1;
const STORAGE_LOGS_KEY = 'tarang_logs_v1';
const STORAGE_SETTINGS_KEY = 'tarang_settings_v1';

export const DEFAULT_SETTINGS = {
  daily_goal_ml: 2000,
  reminder_enabled: true,
  reminder_start: '08:00',
  reminder_end: '22:00',
  interval_minutes: 60
};

// Cached IndexedDB connection instance
let cachedDb = null;

function openDB() {
  if (cachedDb) {
    return Promise.resolve(cachedDb);
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
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
    request.onsuccess = () => {
      cachedDb = request.result;
      resolve(cachedDb);
    };
    request.onerror = () => resolve(null);
  });
}

// Fallback to localStorage
function getLocalLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLogs(logs) {
  try {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
  } catch {
    // ignore
  }
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }

  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'user_settings', value: merged });
    }
  } catch {
    // ignore
  }

  return merged;
}

export async function getAllLogs() {
  const db = await openDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('logs', 'readonly');
        const store = tx.objectStore('logs');
        const req = store.getAll();
        req.onsuccess = () => {
          const logs = req.result || [];
          saveLocalLogs(logs);
          resolve(logs.sort((a, b) => b.timestamp - a.timestamp));
        };
        req.onerror = () => resolve(getLocalLogs());
      } catch {
        resolve(getLocalLogs());
      }
    });
  }
  return getLocalLogs().sort((a, b) => b.timestamp - a.timestamp);
}

export async function addLog(amountMl) {
  const amount = Number(amountMl);
  if (!amount || isNaN(amount) || amount <= 0) return null;

  const newEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    amount_ml: amount,
    timestamp: Date.now()
  };

  const current = getLocalLogs();
  const updated = [newEntry, ...current];
  saveLocalLogs(updated);

  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction('logs', 'readwrite');
      tx.objectStore('logs').put(newEntry);
    }
  } catch {
    // ignore
  }

  return newEntry;
}

export async function deleteLog(id) {
  const current = getLocalLogs();
  const updated = current.filter((item) => item.id !== id);
  saveLocalLogs(updated);

  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction('logs', 'readwrite');
      tx.objectStore('logs').delete(id);
    }
  } catch {
    // ignore
  }

  return updated;
}

export function filterTodayLogs(logs) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTimestamp = startOfDay.getTime();

  return logs.filter((item) => item.timestamp >= startTimestamp);
}

export function calculateTodayTotal(logs) {
  const todayLogs = filterTodayLogs(logs);
  return todayLogs.reduce((sum, item) => sum + (Number(item.amount_ml) || 0), 0);
}

export function getWeeklyHistory(logs, dailyGoal = 2000) {
  const days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const startTimestamp = d.getTime();
    
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);
    const endTimestamp = endOfDay.getTime();

    const dayLogs = logs.filter(
      (log) => log.timestamp >= startTimestamp && log.timestamp <= endTimestamp
    );

    const total = dayLogs.reduce((sum, log) => sum + (Number(log.amount_ml) || 0), 0);
    const percent = Math.min(100, Math.round((total / dailyGoal) * 100));

    const dayName = i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' });
    const dateFormatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    days.push({
      dateStr,
      dayLabel: dayName,
      dateFormatted,
      total_ml: total,
      goal_ml: dailyGoal,
      percent,
      isToday: i === 0,
      isGoalMet: total >= dailyGoal
    });
  }

  return days;
}

