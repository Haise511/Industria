import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { BottomSheetShell } from '../components/BottomSheetShell';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextArea } from '../components/Field';
import { ArrowLeft2, ArrowRight2 } from 'iconsax-react';
import { haptic } from '../telegram';
import './DatePicker.css';

const DAYS_RU = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  // Convert to Mon-based (0=Mon … 6=Sun)
  const leading = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const leadCells = Array.from({ length: leading }, (_, i) => ({
    day: daysInPrev - leading + i + 1,
    muted: true as const,
  }));
  const mainCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    muted: false as const,
  }));
  const totalCells = leadCells.length + mainCells.length;
  const trailing = (7 - (totalCells % 7)) % 7;
  const trailCells = Array.from({ length: trailing }, (_, i) => ({
    day: i + 1,
    muted: true as const,
  }));

  return [...leadCells, ...mainCells, ...trailCells];
}

function formatDateRange(year: number, month: number, start: number, end: number | null): string {
  const m = MONTHS_RU[month].toLowerCase()
  if (end === null || end === start) return `${start} ${m} ${year}`
  return `${start}–${end} ${m} ${year}`
}

export function DatePicker() {
  const nav = useNavigate();
  const loc = useLocation();
  const prev = (loc.state ?? {}) as Record<string, unknown>;

  // Determine which confirm screen to navigate to based on where we came from
  const isRespondFlow = loc.pathname.startsWith('/respond');
  const confirmPath = isRespondFlow ? '/respond/confirm' : '/create/confirm';

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [range, setRange] = useState<[number, number | null]>([now.getDate(), null]);
  const [comment, setComment] = useState('');
  const [start, end] = range;

  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const cells = buildMonthGrid(year, month);

  function prevMonth() {
    haptic('light');
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setRange([1, null]);
  }

  function nextMonth() {
    haptic('light');
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setRange([1, null]);
  }

  function tap(day: number) {
    haptic('light');
    // First tap (no end yet): if later — set as range end, if earlier — new start,
    // if same — collapse to single day. Subsequent tap (end already set) — reset.
    if (end !== null) {
      setRange([day, null]);
    } else if (day > start) {
      setRange([start, day]);
    } else if (day < start) {
      setRange([day, null]);
    } else {
      setRange([day, day]);
    }
  }

  function cellClass(day: number, muted: boolean): string {
    const cls = ['dp-cell'];
    if (muted) { cls.push('dp-cell--mute'); return cls.join(' '); }
    if (isCurrentMonth && day === today) cls.push('is-today');
    const hi = end ?? start;
    if (day >= start && day <= hi) {
      cls.push('is-in-range');
      if (day === start) cls.push('is-range-start');
      if (day === hi) cls.push('is-range-end');
    }
    return cls.join(' ');
  }

  function handleNext() {
    haptic('light');
    const dateStr = formatDateRange(year, month, start, end);
    nav(confirmPath, { state: { ...prev, date: dateStr, comment: comment || undefined } });
  }

  return (
    <BottomSheetShell
      title="Выберите дату"
      cta={<PrimaryButton onClick={handleNext}>Далее</PrimaryButton>}
    >
      <div className="dp-card">
        <div className="dp-month">
          <span className="dp-month-label">{MONTHS_RU[month]} {year}</span>
          <div className="dp-month-nav">
            {!isCurrentMonth && (
              <button className="dp-month-prev" onClick={prevMonth} aria-label="Предыдущий месяц">
                <ArrowLeft2 size={20} color="#fff" variant="Linear" />
              </button>
            )}
            <button className="dp-month-next" onClick={nextMonth} aria-label="Следующий месяц">
              <ArrowRight2 size={20} color="#fff" variant="Linear" />
            </button>
          </div>
        </div>

        <div className="dp-week">
          {DAYS_RU.map((d) => <span key={d} className="dp-week-day">{d}</span>)}
        </div>

        <div className="dp-grid">
          {cells.map((c, i) => (
            <button
              key={i}
              className={cellClass(c.day, c.muted)}
              onClick={() => !c.muted && tap(c.day)}
              disabled={c.muted}
            >
              {c.day}
            </button>
          ))}
        </div>
      </div>

      {isRespondFlow && (
        <div className="dp-comment">
          <div className="field-box">
            <TextArea
              placeholder="Комментарий (необязательно)"
              maxLength={280}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <span className="field-counter">{comment.length}/280</span>
          </div>
        </div>
      )}
    </BottomSheetShell>
  );
}
