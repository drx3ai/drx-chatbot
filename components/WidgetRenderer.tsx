/*
 * WidgetRenderer is a highly simplified example of how one might
 * interpret a structured widget definition and render the
 * corresponding React elements.  The type definitions mirror some of
 * the shapes defined in the user‑provided widgets.d.ts file.  In
 * practice you would expand this component to handle many more
 * widgets and wire actions into the chat logic.
 */
'use client';

import React from 'react';

// Types for widget configuration.  Extend these as you support more widgets.
type ActionConfig = {
  type: 'emit' | 'post';
  name: string;
  payload?: any;
};

type ButtonWidget = {
  type: 'Button';
  label?: string;
  iconStart?: 'globe' | 'atom';
  onClickAction?: ActionConfig;
};

type SelectWidget = {
  type: 'Select';
  name: string;
  options: { value: string; label: string }[];
  onChangeAction?: ActionConfig;
};

export type WidgetComponent = ButtonWidget | SelectWidget;

export default function WidgetRenderer({ node }: { node: WidgetComponent }) {
  function handle(action?: ActionConfig, value?: string) {
    if (!action) return;
    // You can integrate with your store or event bus here.  For now we log
    // to the console so developers can see the payload.
    // eslint-disable-next-line no-console
    console.log('Widget action', action, value);
  }

  if (node.type === 'Button') {
    return (
      <button className="btn" onClick={() => handle(node.onClickAction)}>
        {node.iconStart === 'globe'
          ? '🌐 '
          : node.iconStart === 'atom'
          ? '🧠 '
          : null}
        {node.label ?? 'زر'}
      </button>
    );
  }
  if (node.type === 'Select') {
    return (
      <select
        className="btn"
        onChange={(e) => handle(node.onChangeAction, e.target.value)}
      >
        {node.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return null;
}