import { useNavigate } from 'react-router-dom';
import { ArrowLeft2, ArrowDown2 } from 'iconsax-react';
import { haptic } from '../telegram';
import './TopBar.css';

interface TopBarProps {
  /** Left button mode: "close" shows X+Закрыть pill; "back" shows ‹+Назад */
  variant?: 'close' | 'back';
  /** Override the default back/close behavior (otherwise navigate(-1)) */
  onLeft?: () => void;
  /** Hide the right-side dropdown chevron pill */
  hideMore?: boolean;
}

/**
 * Pure-SVG close glyph that mirrors the Figma "Close" vector inside the
 * pill-button instance (node I1:5761;35:825;1:1785;1:1740). Two crossed
 * strokes with rounded caps — independent of any iconsax substitution.
 *
 * 14x14 viewBox so it slots into the 14px slot in the pill flex row.
 */
function CloseGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
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

/**
 * The pill-shaped header echoing Telegram's native chrome.
 * Matches Figma: pill bg #413f40, radius 32, 14px text in Fixel Display 500/14.
 */
export function TopBar({ variant = 'close', onLeft, hideMore = false }: TopBarProps) {
  const navigate = useNavigate();
  const handleLeft = () => {
    haptic('light');
    if (onLeft) onLeft();
    else navigate(-1);
  };
  return (
    <div className="topbar">
      <button className="topbar-pill topbar-pill--left" onClick={handleLeft} aria-label={variant === 'close' ? 'Закрыть' : 'Назад'}>
        {variant === 'close' ? (
          <CloseGlyph />
        ) : (
          <ArrowLeft2 size={14} color="currentColor" variant="Linear" />
        )}
        <span>{variant === 'close' ? 'Закрыть' : 'Назад'}</span>
      </button>
      {!hideMore && (
        <button className="topbar-pill topbar-pill--icon" aria-label="Меню">
          <ArrowDown2 size={14} color="currentColor" variant="Linear" />
        </button>
      )}
    </div>
  );
}
