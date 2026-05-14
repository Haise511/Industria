import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextArea } from '../components/Field';
import { ArrowRight2 } from 'iconsax-react';
import './DatePicker.css';

const DAYS_RU = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

// Hardcoded April 2026 to match Figma. Real implementation would compute.
const MONTH_LABEL = 'Апрель 2026';
const TODAY = 23; // brand dot indicator under this day, per Figma
// Leading days from March (cells before April 1 starts) — April 2026 starts
// on a Wednesday, so leading = [30, 31] from March on Mon/Tue. Trailing days
// 1, 2 from May fill the final row.
const LEADING = [30, 31];
const TRAILING = [1, 2];
const DAYS_IN_MONTH = 30;

/**
 * Calendar reproducing Figma "Выберите дату" — month grid wrapped in a
 * surface-1 card, leading + trailing days muted, range selection (22–25 in
 * the design), today gets a brand dot below the number, plus an optional
 * comment textarea underneath.
 */
export function DatePicker() {
  const nav = useNavigate();
  // Range state: [start, end]. Tapping a day either starts a new range or
  // extends an existing one if the tap is after the start.
  const [range, setRange] = useState<[number, number | null]>([22, 25]);
  const [start, end] = range;

  function tap(d: number) {
    if (end === null || d < start) {
      setRange([d, null]);
    } else if (d === start) {
      setRange([d, d]);
    } else {
      setRange([start, d]);
    }
  }

  function classFor(d: number, muted: boolean): string {
    const cls = ['dp-cell'];
    if (muted) cls.push('dp-cell--mute');
    const hi = end ?? start;
    if (d >= start && d <= hi && !muted) {
      cls.push('is-in-range');
      if (d === start) cls.push('is-range-start');
      if (d === hi) cls.push('is-range-end');
    }
    if (d === TODAY && !muted) cls.push('is-today');
    return cls.join(' ');
  }

  return (
    <div className="screen dp">
      <TopBar variant="back" />
      <div className="dp-pad">
        <h1 className="h1 dp-title">Выберите дату</h1>

        {/* Calendar surface — Figma wraps month + grid in a single
            surface-1 card with 16px padding and 24px radius. */}
        <div className="dp-card">
          <div className="dp-month">
            <span className="dp-month-label">{MONTH_LABEL}</span>
            <button className="dp-month-next" aria-label="Следующий месяц">
              <ArrowRight2 size={20} color="#fff" variant="Linear" />
            </button>
          </div>

          <div className="dp-week">
            {DAYS_RU.map((d) => (
              <span key={d} className="dp-week-day">{d}</span>
            ))}
          </div>

          <div className="dp-grid">
            {LEADING.map((d) => (
              <button key={`lead-${d}`} className="dp-cell dp-cell--mute" disabled>
                {d}
              </button>
            ))}
            {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map((d) => {
              // Mute past days (before "today" 23rd minus a few) to mirror the
              // visual hierarchy in the PNG where 9, 12, 13–19 read greyer.
              const muted = d < 20 && [9, 12, 13, 14, 15, 16, 17, 18, 19].includes(d);
              return (
                <button
                  key={d}
                  className={classFor(d, muted)}
                  onClick={() => !muted && tap(d)}
                  disabled={muted}
                >
                  {d}
                </button>
              );
            })}
            {TRAILING.map((d) => (
              <button key={`tail-${d}`} className="dp-cell dp-cell--mute" disabled>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="dp-comment">
          <div className="field-box">
            <TextArea placeholder="Комментарий (необязательно)" maxLength={280} />
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
