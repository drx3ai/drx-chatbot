/*
 * FeatureToggles renders buttons for toggling special functionality on and off.
 * Two features are currently supported: Web search (🌐) and the R1 deep
 * thinking mode (🧠).  Each button reflects its current state via
 * aria-pressed and updates the UIProvider when clicked.
 */
'use client';

import { useUI } from '../lib/store';

// Inline SVG icons used for the feature buttons.  These avoid any
// dependencies on external icon libraries and are sized to fit the
// circular button nicely.
export function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20Zm7.5 9h-3.1a17 17 0 0 0-1.3-6a8 8 0 0 1 4.4 6ZM8 12c0-2.4.6-5.2 1.6-7.1C10.4 3.7 11.3 3 12 3s1.6.7 2.4 1.9c1 1.9 1.6 4.7 1.6 7.1s-.6 5.2-1.6 7.1C13.6 20.3 12.7 21 12 21s-1.6-.7-2.4-1.9C8.6 17.2 8 14.4 8 12Zm-1.1-7a17 17 0 0 0-1.3 6H2.5a8 8 0 0 1 4.4-6ZM4 13h3.1a17 17 0 0 0 1.3 6a8 8 0 0 1-4.4-6Zm12.6 6a17 17 0 0 0 1.3-6H21.5a8 8 0 0 1-4.9 6Z"
      />
    </svg>
  );
}

export function AtomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a2 2 0 1 1 0 4a2 2 0 0 1 0-4Zm0 16a2 2 0 1 1 0 4a2 2 0 0 1 0-4ZM2 12a2 2 0 1 1 4 0a2 2 0 0 1-4 0Zm16 0a2 2 0 1 1 4 0a2 2 0 0 1-4 0ZM5 5c5-5 9 5 14 0c-5 5-9-5-14 0Zm0 14c5 5 9-5 14 0c-5-5-9 5-14 0Z"
      />
    </svg>
  );
}

export default function FeatureToggles() {
  const { web, setWeb, r1, setR1 } = useUI();
  return (
    <>
      <button
        className="btn icon"
        aria-pressed={web}
        onClick={() => setWeb(!web)}
        title={web ? 'تعطيل البحث عبر الإنترنت' : 'تفعيل البحث عبر الإنترنت'}
        aria-label="تبديل البحث عبر الإنترنت"
      >
        {/* Use an explicit globe icon instead of an emoji for better accessibility */}
        <GlobeIcon />
      </button>

      <button
        className="btn"
        aria-pressed={r1}
        onClick={() => setR1(!r1)}
        title={r1 ? 'إيقاف وضع R1' : 'تشغيل وضع R1'}
        aria-label="تبديل وضع R1"
      >
        R1 🧠
      </button>
    </>
  );
}