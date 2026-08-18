import React from 'react';
import { Droplet, CircleDot } from 'lucide-react';

export default function NavigationBar({ activeTab, onTabChange }) {
  return (
    <nav className="bottom-nav-container" role="tablist" aria-label="Main Navigation">
      <button
        id="nav-tab-fluid"
        role="tab"
        aria-selected={activeTab === 'fluid'}
        className={`nav-item-btn ${activeTab === 'fluid' ? 'active' : ''}`}
        onClick={() => onTabChange('fluid')}
        title="Fluid Wave View"
        aria-label="Fluid Wave View"
      >
        <Droplet size={24} fill={activeTab === 'fluid' ? 'currentColor' : 'none'} strokeWidth={2.2} />
      </button>

      <button
        id="nav-tab-ring"
        role="tab"
        aria-selected={activeTab === 'ring'}
        className={`nav-item-btn ${activeTab === 'ring' ? 'active' : ''}`}
        onClick={() => onTabChange('ring')}
        title="Current Hydration Stats"
        aria-label="Current Hydration Stats"
      >
        <CircleDot size={26} strokeWidth={2.4} />
      </button>

      <button
        id="nav-tab-settings"
        role="tab"
        aria-selected={activeTab === 'settings'}
        className={`nav-item-btn ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
        title="History & Settings"
        aria-label="History & Settings"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" opacity={activeTab === 'settings' ? 1 : 0.7}>
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
        </svg>
      </button>
    </nav>
  );
}

