import { useState } from 'react';
import { Star1, ArrowLeft2 } from 'iconsax-react';
import { haptic } from '../telegram';
import './ReviewModal.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { stars: number; text?: string }) => Promise<void> | void;
}

const MAX_LEN = 280;

/**
 * Bottom-sheet форма отзыва для шага awaiting_rating жизненного цикла заказа.
 *
 * Дизайн — design-refs/Заказы/Оценить заказ.png:
 *   - в шапке две капсулы: «← Назад» (слева) и «✕ Закрыть» (справа)
 *   - заголовок «Оцените и оставьте отзыв», без подзаголовка
 *   - 5 крупных звёзд (контурные → заливка #fbbe25 при выборе)
 *   - одно поле: "Комментарий (необязательно)" сверху-слева, счётчик 0/280 снизу-справа
 *   - одна primary-кнопка «Отправить» на всю ширину
 */
export function ReviewModal({ open, onClose, onSubmit }: Props) {
  const [stars, setStars] = useState<number>(0);
  const [text, setText] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const canSubmit = stars > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    haptic('medium');
    setSubmitting(true);
    try {
      await onSubmit({ stars, text: text.trim() || undefined });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rmodal-backdrop" onClick={onClose}>
      <div className="rmodal" onClick={(e) => e.stopPropagation()}>
        <div className="rmodal-head">
          <button type="button" className="rmodal-pill" onClick={onClose}>
            <ArrowLeft2 size={14} color="currentColor" variant="Linear" />
            <span>Назад</span>
          </button>
          <button type="button" className="rmodal-pill" onClick={onClose} aria-label="Закрыть">
            <CloseGlyph />
            <span>Закрыть</span>
          </button>
        </div>

        <h3 className="rmodal-title">Оцените и оставьте отзыв</h3>

        <div className="rmodal-stars" role="radiogroup" aria-label="Оценка">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`rmodal-star ${n <= stars ? 'is-on' : ''}`}
              role="radio"
              aria-checked={n === stars}
              aria-label={`${n} из 5`}
              onClick={() => { haptic('light'); setStars(n); }}
            >
              <Star1
                size={44}
                color={n <= stars ? '#fbbe25' : '#3a3a3a'}
                variant="Bold"
              />
            </button>
          ))}
        </div>

        <div className="rmodal-field">
          <span className="rmodal-field-label">Комментарий (необязательно)</span>
          <textarea
            className="rmodal-field-input"
            maxLength={MAX_LEN}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <span className="rmodal-field-counter">{text.length}/{MAX_LEN}</span>
        </div>

        <button
          type="button"
          className="rmodal-submit"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {submitting ? 'Отправляем...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
}

/** Тот же CloseGlyph, что в TopBar — независимая от iconsax 14×14 крестик-икона. */
function CloseGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 3L11 11M11 3L3 11"
        stroke="currentColor"
        strokeWidth="1.66"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
