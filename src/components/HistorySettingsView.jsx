import React, { useState, useEffect } from 'react';
import { Target, Bell, Calendar, Trash2, Clock, Sparkles } from 'lucide-react';
import { sendTestNotification, requestNotificationPermission } from '../services/notifications';

export default function HistorySettingsView({
  settings,
  onUpdateSettings,
  weeklyHistory,
  todayLogs,
  onDeleteLog
}) {
  const [goalInput, setGoalInput] = useState(settings.daily_goal_ml || 2000);
  const [activeChartIndex, setActiveChartIndex] = useState(null);
  const [testingNotif, setTestingNotif] = useState(false);
  const [testResult, setTestResult] = useState('');

  // Keep goalInput in sync with external settings updates
  useEffect(() => {
    setGoalInput(settings.daily_goal_ml || 2000);
  }, [settings.daily_goal_ml]);

  const handleGoalChange = (val) => {
    const num = Math.max(500, Math.min(8000, Number(val) || 2000));
    setGoalInput(num);
    onUpdateSettings({ daily_goal_ml: num });
  };

  const handleToggleReminder = async (enabled) => {
    if (enabled) {
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        alert('Please allow notification permissions in your browser settings to enable reminders.');
        return;
      }
    }
    onUpdateSettings({ reminder_enabled: enabled });
  };

  const handleTriggerTest = async () => {
    setTestingNotif(true);
    setTestResult('');
    try {
      const sent = await sendTestNotification();
      if (sent) {
        setTestResult('Notification sent! Check your device.');
      } else {
        setTestResult('Notification simulated (permissions required).');
      }
    } catch {
      setTestResult('Failed to trigger notification.');
    } finally {
      setTimeout(() => {
        setTestingNotif(false);
        setTestResult('');
      }, 4000);
    }
  };

  return (
    <div className="settings-view-container animate-fade-in">
      {/* Header */}
      <header className="screen-header" style={{ paddingBottom: 16 }}>
        <h1 className="header-title-centered">History & Settings</h1>
      </header>

      {/* Section 1: 7-Day History Chart (FR7) */}
      <div className="settings-section-card">
        <h2 className="settings-section-title">
          <Calendar size={18} color="#6E62E5" />
          <span>7-Day Hydration History</span>
        </h2>

        <div className="history-bar-chart">
          {weeklyHistory.map((day, idx) => (
            <div
              key={idx}
              className="chart-day-column"
              onClick={() => setActiveChartIndex(activeChartIndex === idx ? null : idx)}
            >
              {/* Tooltip on tap/hover */}
              {activeChartIndex === idx && (
                <div className="chart-tooltip">
                  {day.total_ml.toLocaleString()}ml
                </div>
              )}
              <div
                className="chart-bar-container"
                title={`${day.dayLabel}: ${day.total_ml}ml / ${day.goal_ml}ml`}
              >
                <div
                  className={`chart-bar-fill ${day.isGoalMet ? 'goal-met' : ''}`}
                  style={{ height: `${Math.max(4, day.percent)}%` }}
                />
              </div>
              <span className={`chart-day-text ${day.isToday ? 'is-today' : ''}`}>
                {day.dayLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Daily Goal Configuration (FR3) */}
      <div className="settings-section-card">
        <h2 className="settings-section-title">
          <Target size={18} color="#6E62E5" />
          <span>Daily Hydration Goal</span>
        </h2>

        <div className="goal-input-row">
          <span className="field-label">Target intake per day</span>
          <div className="goal-number-box">
            <input
              id="input-daily-goal"
              type="number"
              className="goal-number-input"
              value={goalInput}
              step="50"
              min="500"
              max="8000"
              onChange={(e) => setGoalInput(e.target.value)}
              onBlur={(e) => handleGoalChange(e.target.value)}
            />
            <span className="goal-number-unit">ml</span>
          </div>
        </div>

        <input
          id="slider-daily-goal"
          type="range"
          className="goal-slider"
          min="500"
          max="8000"
          step="50"
          value={goalInput}
          onChange={(e) => handleGoalChange(e.target.value)}
        />
      </div>

      {/* Section 3: Smart Reminders (FR5 & FR6) */}
      <div className="settings-section-card">
        <div className="setting-toggle-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} color="#6E62E5" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Hydration Reminders</span>
          </div>
          <label className="toggle-switch">
            <input
              id="toggle-reminders"
              type="checkbox"
              checked={Boolean(settings.reminder_enabled)}
              onChange={(e) => handleToggleReminder(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {settings.reminder_enabled && (
          <div className="animate-fade-in">
            <div className="time-inputs-grid">
              <div className="time-input-field">
                <label htmlFor="reminder-start-time" className="field-label">Start Time</label>
                <input
                  id="reminder-start-time"
                  type="time"
                  className="field-time"
                  value={settings.reminder_start || '08:00'}
                  onChange={(e) => onUpdateSettings({ reminder_start: e.target.value })}
                />
              </div>

              <div className="time-input-field">
                <label htmlFor="reminder-end-time" className="field-label">End Time</label>
                <input
                  id="reminder-end-time"
                  type="time"
                  className="field-time"
                  value={settings.reminder_end || '22:00'}
                  onChange={(e) => onUpdateSettings({ reminder_end: e.target.value })}
                />
              </div>
            </div>

            <div className="time-input-field" style={{ marginBottom: 8 }}>
              <label htmlFor="reminder-interval-select" className="field-label">Reminder Interval</label>
              <select
                id="reminder-interval-select"
                className="field-select"
                value={settings.interval_minutes || 60}
                onChange={(e) => onUpdateSettings({ interval_minutes: Number(e.target.value) })}
              >
                <option value={30}>Every 30 minutes</option>
                <option value={45}>Every 45 minutes</option>
                <option value={60}>Every 1 hour (Default)</option>
                <option value={90}>Every 1.5 hours</option>
                <option value={120}>Every 2 hours</option>
                <option value={180}>Every 3 hours</option>
              </select>
            </div>

            <button
              id="btn-test-notification"
              className="test-notif-btn"
              onClick={handleTriggerTest}
              disabled={testingNotif}
            >
              <Sparkles size={16} />
              <span>{testingNotif ? 'Sending notification...' : 'Send Test Notification'}</span>
            </button>
            {testResult && (
              <p style={{ fontSize: 12, color: '#16A34A', textAlign: 'center', marginTop: 6, fontWeight: 600 }}>
                {testResult}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Today's Log Timeline (FR2 & FR4) */}
      <div className="settings-section-card">
        <h2 className="settings-section-title">
          <Clock size={18} color="#6E62E5" />
          <span>Today's Log Timeline ({todayLogs.length})</span>
        </h2>

        {todayLogs.length === 0 ? (
          <div className="empty-state-box">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#A59BFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            <p className="empty-state-text">No water logged yet today.<br />Tap + or any quick preset to start!</p>
          </div>
        ) : (
          <div className="log-timeline-list">
            {todayLogs.map((item) => {
              const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
              return (
                <div key={item.id} className="log-timeline-item">
                  <div className="log-item-left">
                    <span className="log-item-time">{timeStr}</span>
                    <span className="log-item-amount">+{item.amount_ml} ml</span>
                  </div>
                  <button
                    className="log-item-del-btn"
                    onClick={() => onDeleteLog(item.id)}
                    title="Delete entry"
                    aria-label={`Delete ${item.amount_ml}ml entry`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

