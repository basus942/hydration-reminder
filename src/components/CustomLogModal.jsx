import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CustomLogModal({ isOpen, onClose, onAddLog }) {
  const [customAmount, setCustomAmount] = useState('250');

  // Handle Escape key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    const amount = Number(customAmount);
    if (amount > 0) {
      onAddLog(amount);
      onClose();
    }
  };

  const handlePresetSelect = (amt) => {
    setCustomAmount(String(amt));
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-log-modal-title"
    >
      <div className="modal-dialog animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="custom-log-modal-title" className="modal-title">Log Water Intake</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Quick presets chips */}
        <div className="custom-presets-row">
          {[150, 200, 250, 350, 500].map((amt) => (
            <button
              key={amt}
              type="button"
              className={`preset-chip ${Number(customAmount) === amt ? 'active' : ''}`}
              onClick={() => handlePresetSelect(amt)}
            >
              {amt}ml
            </button>
          ))}
        </div>

        {/* Input box */}
        <form onSubmit={handleSubmit}>
          <div className="custom-input-box">
            <input
              id="input-custom-water-amount"
              type="number"
              min="10"
              max="5000"
              step="10"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="e.g. 250"
              autoFocus
            />
            <span style={{ fontWeight: 700, fontSize: 18, color: '#7F7A9B' }}>ml</span>
          </div>

          <button id="btn-submit-custom-water" type="submit" className="modal-confirm-btn">
            Log {Number(customAmount) || 0} ml
          </button>
        </form>
      </div>
    </div>
  );
}

