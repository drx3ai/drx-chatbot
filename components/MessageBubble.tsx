/*
 * MessageBubble is a simple wrapper component that applies styling based
 * on the sender of the message.  User messages are aligned to the
 * right in an RTL layout, whereas assistant messages remain aligned
 * left.  Children can include plain text or richer content such as
 * rendered widgets.
 */
import React from 'react';

export function MessageBubble({
  role,
  children,
}: {
  role: 'user' | 'assistant';
  children: React.ReactNode;
}) {
  return (
    <div
      className={`msg ${role}`}
      role="article"
      aria-roledescription={role === 'user' ? 'رسالة مستخدم' : 'رسالة مساعد'}
    >
      {children}
    </div>
  );
}