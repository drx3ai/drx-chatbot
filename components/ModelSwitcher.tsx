/*
 * ModelSwitcher displays a segmented control allowing the user to switch
 * between available language models.  It consumes the model state from
 * the UIProvider and updates it when the user selects a different option.
 */
'use client';

import { useUI } from '../lib/store';
import { MODELS, type ModelId } from '../lib/models';

export default function ModelSwitcher() {
  const { model, setModel } = useUI();
  const entries = Object.entries(MODELS) as [ModelId, { label: string }][];
  return (
    <div className="model-switch" role="radiogroup" aria-label="النموذج">
      {entries.map(([id, { label }]) => (
        <button
          key={id}
          className="btn seg"
          role="radio"
          aria-checked={model === id}
          onClick={() => setModel(id)}
          title={`تبديل إلى ${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}