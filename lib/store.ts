/*
 * UIProvider and useUI provide global state management for the dr.x
 * interface using React context.  The state includes the selected
 * model and flags for enabling web search and the R1 deep thinking
 * mode.  These values are consumed by multiple components without
 * prop drilling.
 */
'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ModelId } from './models';

export type UIState = {
  model: ModelId;
  setModel: (m: ModelId) => void;
  web: boolean;
  setWeb: (v: boolean) => void;
  r1: boolean;
  setR1: (v: boolean) => void;
};

const UIContext = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<ModelId>('gpt-5-pro');
  const [web, setWeb] = useState(false);
  const [r1, setR1] = useState(false);
  const value = useMemo(
    () => ({ model, setModel, web, setWeb, r1, setR1 }),
    [model, web, r1],
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIState {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within <UIProvider>');
  return ctx;
}