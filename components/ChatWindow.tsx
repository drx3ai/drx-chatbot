/*
 * ChatWindow contains the list of messages and the composer for writing
 * new messages.  It demonstrates simple state management for a chat
 * interface in a client component.  Messages are stored in local
 * component state and are sent to the /api/chat route when the user
 * submits the form.  The last message from the assistant is displayed
 * in response to the API call.  You can adapt this component to
 * stream responses and support more advanced features.
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useUI } from '../lib/store';
import { MessageBubble } from './MessageBubble';

type ChatRole = 'user' | 'assistant';

interface Msg {
  id: string;
  role: ChatRole;
  content: string;
}

export default function ChatWindow() {
  const { model, web, r1 } = useUI();
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'hello', role: 'assistant', content: 'مرحباً بك في dr.x 👋' },
  ]);
  const [value, setValue] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever new messages are added
  useEffect(() => {
    boxRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const trimmed = value.trim();
    if (!trimmed) return;
    // Append user message to local state
    const user: Msg = { id: String(Date.now()), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, user]);
    setValue('');

    // Build request body: include existing messages + new one and flags
    const body = {
      messages: [...messages, user],
      model,
      web,
      r1,
    };
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      // Append assistant message based on API response
      const assistant: Msg = {
        id: 'a-' + Date.now(),
        role: 'assistant',
        content: data.text ?? '…',
      };
      setMessages((prev) => [...prev, assistant]);
    } catch {
      // Display a fallback error message if the request fails
      setMessages((prev) => [
        ...prev,
        {
          id: 'err',
          role: 'assistant',
          content: 'تعذّر الحصول على رد.',
        },
      ]);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  }

  return (
    <section className="main" aria-label="المحادثة">
      <div ref={boxRef} className="messages">
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role}>
            {m.content}
          </MessageBubble>
        ))}
      </div>
      <div className="composer">
        <textarea
          dir="auto"
          placeholder={`اكتب رسالتك… (${model}${web ? ' + Web' : ''}${r1 ? ' + R1' : ''})`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="محرر الرسائل"
        />
        <button className="btn" onClick={send} aria-label="إرسال">
          إرسال ⏎
        </button>
      </div>
    </section>
  );
}