/*
 * Sidebar lists the available conversations and provides quick actions
 * for creating a new chat and searching through history.  For the
 * purposes of this demo the contents are static; in a real app you
 * would populate these lists from your back‑end or local storage.  The
 * sidebar is displayed on the right because we operate in RTL mode.
 */
'use client';

export default function Sidebar() {
  return (
    <aside className="sidebar" aria-label="المحادثات">
      <button className="btn primary" style={{ width: '100%' }}>
        محادثة جديدة
      </button>
      <input
        aria-label="بحث في المحادثات"
        placeholder="ابحث…"
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 10,
          background: '#0b0b0e',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginTop: 8,
        }}
      >
        <div className="badge">المثبتة</div>
        <button className="btn ghost">• موجز الصباح</button>
        <button className="btn ghost">• تلخيص مستند</button>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginTop: 12,
        }}
      >
        <div className="badge">الأخيرة</div>
        <button className="btn ghost">• محادثة 1</button>
        <button className="btn ghost">• محادثة 2</button>
      </div>
    </aside>
  );
}