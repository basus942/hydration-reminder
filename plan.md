# SRS — Water Tracker PWA (v1)

## 1. Purpose
A PWA for logging daily fluid intake with reminders. No accounts, no friends, no backend — all data stored locally on device.

## 2. Scope
**In:** logging, goal setting, reminders, history, offline support, installable PWA
**Out:** friends, multi-beverage tracking, AI features, accounts, cloud sync

## 3. Functional Requirements
- FR1: User can log intake via quick-add buttons (200/300/500ml) or custom amount
- FR2: User can undo the last log entry
- FR3: User can set/edit a daily goal (ml)
- FR4: Daily total resets automatically at local midnight
- FR5: User can configure reminders (start time, end time, interval)
- FR6: App sends notifications at each interval, skipped if goal already met
- FR7: User can view history (daily/weekly totals vs goal)
- FR8: All data persists via localStorage/IndexedDB — no server

## 4. Non-Functional Requirements
- NFR1: Installable as PWA (manifest.json, service worker)
- NFR2: Works offline
- NFR3: Notifications work via service worker (not just in-tab timers)
- NFR4: Responsive, mobile-first UI
- NFR5: No ads, no accounts, no third-party data collection

## 5. Constraints
- Background notification reliability varies by OS (Android Chrome > iOS Safari)
- No data backup/sync across devices in v1

## 6. Data Model
- `LogEntry`: id, amount_ml, timestamp
- `Settings`: daily_goal_ml, reminder_start, reminder_end, interval_minutes