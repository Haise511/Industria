import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextArea } from '../components/Field';
import './DatePicker.css';

const DAYS_RU = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * Calendar reproducing Figma "Выберите дату" — month grid with prev-month
 * leading days greyed out, single day select, today highlighted with brand
 * color, comment textarea below.
 */
export function DatePicker() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<number | null>(22);

  // Hardcoded April 2026 to match Figma. Real implementation would compute.
  const month = 'Апрель 2026';
  const leading = [31, 1]; // March 30/31, then April starts
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="screen dp">
      <div className="dp-top">
        <TopBar variant="back" />
      </div>
      <div className="dp-pad">
        <h1 className="h1 dp-title">Выберите дату</h1>

        <div className="dp-month">
          <span className="dp-month-label">{month}</span>
          <button className="dp-month-next" aria-label="Следующий месяц">›</button>
        </div>

        <div className="dp-week">
          {DAYS_RU.map((d) => (
            <span key={d} className="dp-week-day">{d}</span>
          ))}
        </div>

        <div className="dp-grid">
          <button className="dp-cell dp-cell--mute" disabled>30</button>
          <button className="dp-cell dp-cell--mute" disabled>31</button>
          {days.map((d) => (
            <button
              key={d}
              className={`dp-cell ${selected === d ? 'is-selected' : ''}`}
              onClick={() => setSelected(d)}
              disabled={d < 5}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="dp-comment">
          <label className="field-label">Комментарий (необязательно)</label>
          <div className="field-box">
            <TextArea placeholder="" maxLength={280} />
            <span className="field-counter">0/280</span>
          </div>
        </div>
      </div>

      <div className="dp-cta">
        <PrimaryButton onClick={() => nav('/respond/confirm')}>Далее</PrimaryButton>
      </div>
    </div>
  );
}
