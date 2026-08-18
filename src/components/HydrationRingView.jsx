import React from 'react';
import { Droplets, GlassWater, Coffee, Plus } from 'lucide-react';

export default function HydrationRingView({
  todayTotal,
  dailyGoal,
  percentage,
  remaining,
  onQuickAdd,
  onOpenCustomModal
}) {
  // SVG Circular Ring Math
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Approximate glasses (250ml per standard glass)
  const glassesConsumed = (todayTotal / 250).toFixed(1).replace('.0', '');
  const totalGlassesGoal = Math.round(dailyGoal / 250);

  return (
    <div className="ring-view-container animate-fade-in">
      {/* Header */}
      <header className="screen-header">
        <h1 className="header-title-centered">Current Hydration</h1>
      </header>

      {/* Circular Progress Ring */}
      <div className="ring-chart-section">
        <div className="ring-svg-wrapper">
          <svg width="220" height="220" viewBox="0 0 220 220">
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5E4AE3" />
                <stop offset="60%" stopColor="#7B6DFA" />
                <stop offset="100%" stopColor="#A298FE" />
              </linearGradient>
            </defs>

            {/* Background Ring Track */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="#EBE5F5"
              strokeWidth="14"
              fill="transparent"
            />

            {/* Progress Arc */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke="url(#ringGradient)"
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform="rotate(-90 110 110)"
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                opacity: percentage === 0 ? 0 : 1
              }}
            />
          </svg>

          {/* Center Progress Text */}
          <div className="ring-center-content">
            <span className="ring-center-percent">{percentage}%</span>
            <span className="ring-center-amount">{todayTotal.toLocaleString()} ml</span>
            <span className="ring-center-remaining">
              {remaining > 0 ? `-${remaining.toLocaleString()} ml` : 'Goal Met! 🎯'}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Glass Count Pill Badge */}
      <div className="glass-counter-badge">
        <span>💧 {glassesConsumed} of ~{totalGlassesGoal} glasses today</span>
      </div>

      {/* Quick Add Presets Grid (2x2 matching UI screenshot) */}
      <div className="quick-add-grid">
        {/* Preset 1: 250 ml Water */}
        <button
          id="btn-quick-250"
          className="quick-add-card card-water"
          onClick={() => onQuickAdd(250)}
          title="Add 250ml Water"
        >
          <div className="card-icon-box">
            <Droplets size={24} color="#6E62E5" strokeWidth={2.2} />
          </div>
          <div>
            <div className="card-amount-label">250 ml</div>
            <div className="card-type-label">Water glass</div>
          </div>
        </button>

        {/* Preset 2: 500 ml Bottle */}
        <button
          id="btn-quick-500"
          className="quick-add-card card-bottle"
          onClick={() => onQuickAdd(500)}
          title="Add 500ml Bottle"
        >
          <div className="card-icon-box">
            <svg width="22" height="26" viewBox="0 0 24 24" fill="none" stroke="#5E5873" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2h8v4H8zM6 8h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM9 13h6" />
            </svg>
          </div>
          <div>
            <div className="card-amount-label">500 ml</div>
            <div className="card-type-label">Bottle</div>
          </div>
        </button>

        {/* Preset 3: 180 ml Cup / Tea */}
        <button
          id="btn-quick-180"
          className="quick-add-card card-tea"
          onClick={() => onQuickAdd(180)}
          title="Add 180ml Cup"
        >
          <div className="card-icon-box">
            <Coffee size={22} color="#D97706" strokeWidth={2.2} />
          </div>
          <div>
            <div className="card-amount-label">180 ml</div>
            <div className="card-type-label">Small cup</div>
          </div>
        </button>

        {/* Preset 4: 300 ml Pitcher / Large Glass */}
        <button
          id="btn-quick-300"
          className="quick-add-card card-pitcher"
          onClick={() => onQuickAdd(300)}
          title="Add 300ml Large Glass"
        >
          <div className="card-icon-box">
            <GlassWater size={23} color="#E06D53" strokeWidth={2.2} />
          </div>
          <div>
            <div className="card-amount-label">300 ml</div>
            <div className="card-type-label">Large glass</div>
          </div>
        </button>
      </div>

      {/* Custom Amount Strip Button */}
      <button
        id="btn-open-custom-log"
        className="custom-add-strip"
        onClick={onOpenCustomModal}
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Log Custom Amount</span>
      </button>
    </div>
  );
}

