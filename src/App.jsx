import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  getSettings,
  saveSettings,
  getAllLogs,
  addLog,
  deleteLog,
  filterTodayLogs,
  calculateTodayTotal,
  getWeeklyHistory
} from './services/db';
import { registerServiceWorker, setupReminderSchedule } from './services/notifications';

import FluidWaveView from './components/FluidWaveView';
import HydrationRingView from './components/HydrationRingView';
import HistorySettingsView from './components/HistorySettingsView';
import NavigationBar from './components/NavigationBar';
import CustomLogModal from './components/CustomLogModal';
import Toast from './components/Toast';

const TABS = ['fluid', 'ring', 'settings'];

export default function App() {
  const [activeTab, setActiveTab] = useState('fluid'); // 'fluid' | 'ring' | 'settings'
  const [logs, setLogs] = useState([]);
  const [settings, setSettingsState] = useState(getSettings());
  const [toast, setToast] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [hasCelebratedGoal, setHasCelebratedGoal] = useState(false);
  const [, setLastMidnightCheck] = useState(Date.now());

  // Swipe Gesture state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Load initial data and register Service Worker
  useEffect(() => {
    async function init() {
      const initialLogs = await getAllLogs();
      setLogs(initialLogs);
      const loadedSettings = getSettings();
      setSettingsState(loadedSettings);

      // Register PWA Service Worker
      await registerServiceWorker();
      setupReminderSchedule(loadedSettings);
    }
    init();

    // Listen to messages from Service Worker (e.g. if user logged water from notification)
    const handleSwMessage = (event) => {
      if (event.data && event.data.type === 'DATA_UPDATED') {
        getAllLogs().then((updated) => setLogs(updated));
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    // Refresh today's calculation on tab focus/visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setLastMidnightCheck(Date.now());
        getAllLogs().then((updated) => setLogs(updated));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Midnight rollover timer check every 60 seconds
    const midnightInterval = setInterval(() => {
      setLastMidnightCheck(Date.now());
    }, 60000);

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(midnightInterval);
    };
  }, []);

  // Today's logs and total
  const todayLogs = useMemo(() => filterTodayLogs(logs), [logs]);
  const todayTotal = useMemo(() => calculateTodayTotal(logs), [logs]);
  const dailyGoal = settings.daily_goal_ml || 2000;
  const percentage = useMemo(() => Math.min(100, Math.round((todayTotal / dailyGoal) * 100)), [todayTotal, dailyGoal]);
  const remaining = useMemo(() => Math.max(0, dailyGoal - todayTotal), [todayTotal, dailyGoal]);

  // 7-day weekly history breakdown
  const weeklyHistory = useMemo(() => getWeeklyHistory(logs, dailyGoal), [logs, dailyGoal]);

  // Goal celebration effect with confetti
  useEffect(() => {
    if (todayTotal >= dailyGoal && !hasCelebratedGoal && todayTotal > 0) {
      setHasCelebratedGoal(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C70FF', '#584BD6', '#4ADE80', '#FCD34D']
        });
      } catch {
        // confetti fallback
      }
    } else if (todayTotal < dailyGoal) {
      setHasCelebratedGoal(false);
    }
  }, [todayTotal, dailyGoal, hasCelebratedGoal]);

  // Add water log
  const handleAddLog = useCallback(async (amount) => {
    const newEntry = await addLog(amount);
    if (newEntry) {
      setLogs((prev) => [newEntry, ...prev]);
      setToast({ id: newEntry.id, amount });
    }
  }, []);

  // Undo last logged water
  const handleUndo = useCallback(async () => {
    if (toast && toast.id) {
      const updated = await deleteLog(toast.id);
      setLogs(updated);
      setToast(null);
    }
  }, [toast]);

  // Delete individual log entry
  const handleDeleteLog = useCallback(async (id) => {
    const updated = await deleteLog(id);
    setLogs(updated);
  }, []);

  // Update Settings
  const handleUpdateSettings = useCallback(async (newSettings) => {
    const updated = await saveSettings({ ...settings, ...newSettings });
    setSettingsState(updated);
    setupReminderSchedule(updated);
  }, [settings]);

  // Touch swipe handling to switch tabs
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const currentIdx = TABS.indexOf(activeTab);

    // Swipe threshold of 60px
    if (diff > 60 && currentIdx < TABS.length - 1) {
      // Swiped Left -> Next tab
      setActiveTab(TABS[currentIdx + 1]);
    } else if (diff < -60 && currentIdx > 0) {
      // Swiped Right -> Previous tab
      setActiveTab(TABS[currentIdx - 1]);
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toast with Undo Action */}
      <Toast toast={toast} onUndo={handleUndo} onDismiss={() => setToast(null)} />

      {/* Main Viewport */}
      <main className="view-viewport" role="tabpanel">
        {activeTab === 'fluid' && (
          <FluidWaveView
            todayTotal={todayTotal}
            dailyGoal={dailyGoal}
            percentage={percentage}
            remaining={remaining}
            onOpenCustomModal={() => setIsCustomModalOpen(true)}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'ring' && (
          <HydrationRingView
            todayTotal={todayTotal}
            dailyGoal={dailyGoal}
            percentage={percentage}
            remaining={remaining}
            onQuickAdd={(amount) => handleAddLog(amount)}
            onOpenCustomModal={() => setIsCustomModalOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <HistorySettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            weeklyHistory={weeklyHistory}
            todayLogs={todayLogs}
            onDeleteLog={handleDeleteLog}
          />
        )}
      </main>

      {/* Bottom Floating Navigation Pill */}
      <NavigationBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Custom Amount Modal */}
      <CustomLogModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onAddLog={handleAddLog}
      />
    </div>
  );
}

