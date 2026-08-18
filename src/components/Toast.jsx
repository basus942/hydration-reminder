import React, { useEffect, useState, useRef } from 'react';
import { Droplet } from 'lucide-react';

export default function Toast({ toast, onUndo, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!toast || isPaused) return;

    timerRef.current = setTimeout(() => {
      onDismiss();
    }, 4500);

    return () => clearTimeout(timerRef.current);
  }, [toast, isPaused, onDismiss]);

  if (!toast) return null;

  return (
    <div
      className="toast-container animate-toast"
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Droplet size={18} fill="#7C70FF" color="#7C70FF" />
        <span>Added {toast.amount} ml</span>
      </div>
      <button
        id="btn-toast-undo"
        className="toast-undo-btn"
        onClick={onUndo}
        aria-label={`Undo adding ${toast.amount}ml`}
      >
        Undo
      </button>
    </div>
  );
}

