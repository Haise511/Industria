import { useState } from 'react';
import { haptic } from '../telegram';
import './CancelOrderModal.css';

const REASONS = [
  'Изменились планы',
  'Не нашли исполнителя',
  'Договорились вне приложения',
  'Цена не подошла',
  'Дата сместилась',
  'Другая причина',
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void> | void;
}

export function CancelOrderModal({ open, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<string>(REASONS[0]);
  const [custom, setCustom] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const isOther = selected === 'Другая причина';
  const finalReason = isOther ? custom.trim() : selected;
  const canSubmit = finalReason.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    haptic('medium');
    setSubmitting(true);
    try {
      await onSubmit(finalReason);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cmodal-backdrop" onClick={onClose}>
      <div className="cmodal" onClick={(e) => e.stopPropagation()}>
        <h3 className="cmodal-title">Причина отмены</h3>

        <div className="cmodal-list">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`cmodal-option ${selected === r ? 'is-active' : ''}`}
              onClick={() => { haptic('light'); setSelected(r); }}
            >
              {r}
            </button>
          ))}
        </div>

        {isOther && (
          <textarea
            className="cmodal-input"
            placeholder="Опишите причину"
            maxLength={140}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        )}

        <div className="cmodal-actions">
          <button type="button" className="cmodal-btn cmodal-btn--ghost" onClick={onClose}>
            Назад
          </button>
          <button
            type="button"
            className="cmodal-btn cmodal-btn--danger"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? 'Отмена...' : 'Отменить заказ'}
          </button>
        </div>
      </div>
    </div>
  );
}
