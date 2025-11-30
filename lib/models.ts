/*
 * A simple registry of available language models.  Each key maps to a
 * label that will be shown in the model switcher.  You can add
 * additional models here or extend the type to include hints or
 * configuration options.
 */

export type ModelId =
  | 'gpt-5-pro'
  | 'gpt-4o'
  | 'claude-3-5'
  | 'gemini-2'
  | 'drx-r1';

export const MODELS: Record<
  ModelId,
  {
    label: string;
    hint?: string;
  }
> = {
  'gpt-5-pro': { label: 'GPT‑5 Pro' },
  'gpt-4o': { label: 'GPT‑4o' },
  'claude-3-5': { label: 'Claude 3.5' },
  'gemini-2': { label: 'Gemini 2' },
  'drx-r1': { label: 'R1' },
};
