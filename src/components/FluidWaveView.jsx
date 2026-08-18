import React from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';

export default function FluidWaveView({
  todayTotal,
  dailyGoal,
  percentage,
  remaining,
  onOpenCustomModal,
  onOpenSettings
}) {
  // Liquid height scaling: min 18%, max 84% for aesthetic balance
  const visualFillHeight = Math.max(18, Math.min(84, 18 + (percentage * 0.66)));

  // Time of day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning ☀️' : hour < 18 ? 'Good afternoon 🌤️' : 'Good evening 🌙';

  return (
    <div className="fluid-view-container animate-fade-in">
      {/* Header */}
      <header className="screen-header">
        <span className="header-greeting-text">{greeting}</span>
        <button
          id="btn-fluid-header-action"
          className="header-btn-circle"
          onClick={onOpenSettings}
          title="Settings & Schedule"
          aria-label="Settings & Schedule"
        >
          <SlidersHorizontal size={18} />
        </button>
      </header>

      {/* Main Hydration Number Display */}
      <div className="fluid-stat-header">
        <h1 className="fluid-amount-display">
          {todayTotal.toLocaleString()}
          <span className="fluid-amount-unit">ml</span>
        </h1>
        <p className="fluid-remaining-text">
          {remaining > 0 ? `Remaining: ${remaining.toLocaleString()} ml` : 'Goal Met! 🎉 Awesome job!'}
        </p>
      </div>

      {/* Liquid Body Container */}
      <div className="liquid-body-container">
        {/* Submerged / Floating Character & Bubbles */}
        <div
          className="character-avatar-wrapper"
          style={{ bottom: `calc(${visualFillHeight}% - 40px)` }}
        >
          <svg viewBox="0 0 160 200" width="150" height="190" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="charSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9C6B45" />
                <stop offset="100%" stopColor="#7A4D2B" />
              </linearGradient>
              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3A291A" />
                <stop offset="100%" stopColor="#1F140A" />
              </linearGradient>
              <linearGradient id="glassLens" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF5722" />
                <stop offset="100%" stopColor="#FF9800" />
              </linearGradient>
              <linearGradient id="phoneBand" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6D00" />
                <stop offset="100%" stopColor="#D84315" />
              </linearGradient>
              <filter id="charShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1E1B4B" floodOpacity="0.35" />
              </filter>
            </defs>

            <g filter="url(#charShadow)">
              {/* Hair Buns (Left & Right) */}
              <circle cx="42" cy="72" r="26" fill="url(#hairGrad)" />
              <circle cx="118" cy="72" r="26" fill="url(#hairGrad)" />
              
              {/* Head / Face */}
              <ellipse cx="80" cy="88" rx="30" ry="34" fill="url(#charSkin)" />
              
              {/* Hair Top Fringe */}
              <path d="M50 78 Q80 56 110 78 Q80 66 50 78 Z" fill="url(#hairGrad)" />

              {/* Headband / Headphones Arc */}
              <path d="M42 85 C42 45 118 45 118 85" stroke="url(#phoneBand)" strokeWidth="7" strokeLinecap="round" />
              {/* Ear Cups */}
              <circle cx="45" cy="86" r="13" fill="#FF8A65" stroke="#FF5722" strokeWidth="3" />
              <circle cx="115" cy="86" r="13" fill="#FF8A65" stroke="#FF5722" strokeWidth="3" />

              {/* Sunglasses */}
              <g>
                <circle cx="68" cy="90" r="12" fill="url(#glassLens)" stroke="#FFCC80" strokeWidth="2.5" />
                <circle cx="92" cy="90" r="12" fill="url(#glassLens)" stroke="#FFCC80" strokeWidth="2.5" />
                <line x1="79" y1="90" x2="81" y2="90" stroke="#FFCC80" strokeWidth="3" />
              </g>

              {/* Smile */}
              <path d="M74 104 Q80 110 86 104" stroke="#5D381E" strokeWidth="2.5" strokeLinecap="round" />

              {/* Neck and Shoulders */}
              <path d="M72 118 L72 130 Q50 134 40 160 L120 160 Q110 134 88 130 L88 118 Z" fill="url(#charSkin)" />
              {/* Swimsuit / Top */}
              <path d="M40 160 Q80 148 120 160 L115 190 Q80 195 45 190 Z" fill="#6055C7" opacity="0.9" />
            </g>
          </svg>
        </div>

        {/* Dynamic Liquid Fill Layer */}
        <div className="liquid-fill-wrapper" style={{ height: `${visualFillHeight}%` }}>
          {/* Waves at top boundary */}
          <div className="wave-svg-container">
            {/* Back Wave */}
            <svg className="wave-layer-back" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,-30 1200,40 L1200,120 L0,120 Z" />
            </svg>
            {/* Front Wave */}
            <svg className="wave-layer-front" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,40 C300,-40 450,80 600,20 C750,-40 900,80 1200,20 L1200,120 L0,120 Z" />
            </svg>
            {/* Soft White Contour Line */}
            <svg className="wave-contour-line" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,40 C300,-40 450,80 600,20 C750,-40 900,80 1200,20" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="3" fill="none" />
            </svg>
          </div>

          {/* Floating % Pill Badge on Wave */}
          <div className="liquid-percentage-tag">
            {percentage}%
          </div>

          {/* Rising Bubbles inside Liquid */}
          <div className="bubble bubble-1" />
          <div className="bubble bubble-2" />
          <div className="bubble bubble-3" />
          <div className="bubble bubble-4" />
          <div className="bubble bubble-5" />
        </div>

        {/* Floating Plus (+) Action Button */}
        <button
          id="btn-fluid-add-water"
          className="floating-plus-btn"
          onClick={onOpenCustomModal}
          title="Add Water Intake"
          aria-label="Add Water Intake"
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

