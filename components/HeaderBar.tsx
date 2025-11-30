/*
 * HeaderBar renders the top navigation area of the application.  It shows
 * the dr.x brand along with controls for switching models, toggling
 * special features, and accessing command palette and settings.  This
 * component is marked as a client component because it contains
 * interactive elements that rely on React state and hooks.
 */
'use client';

import ModelSwitcher from './ModelSwitcher';
import FeatureToggles from './FeatureToggles';

export default function HeaderBar() {
  return (
    <header className="header" role="banner">
      <div className="brand" aria-label="dr.x">
        <span className="brand-bullet" aria-hidden="true"></span>
        <span>dr.x</span>
        <span className="badge">Alpha</span>
      </div>
      <div className="header-actions" role="toolbar" aria-label="أوامر سريعة">
        <ModelSwitcher />
        <FeatureToggles />
        {/* Placeholder buttons for command palette and settings.  These can be
            wired up later to open modals or popovers. */}
        <button
          className="btn ghost"
          title="لوحة الأوامر (Ctrl/⌘+K)"
          aria-label="لوحة الأوامر"
        >
          ⌘K
        </button>
        <button className="btn ghost" title="الإعدادات" aria-label="الإعدادات">
          ⚙️
        </button>
      </div>
    </header>
  );
}