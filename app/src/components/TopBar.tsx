import { haptic } from '../telegram';
import './TopBar.css';

interface TopBarProps {
  // legacy props kept for API compat with existing callers; ignored visually now
  variant?: 'close' | 'back';
  onLeft?: () => void;
  hideMore?: boolean;
  rightAction?: { label: string; onClick: () => void };
}
export function TopBar({ rightAction }: TopBarProps) {
  // Telegram WebApp handles close (swipe-down) and back (native BackButton) natively,
  // so we no longer render those pills here. Only render the bar if a custom right
  // action is provided (rare). Otherwise render a thin spacer to preserve layout.
  if (!rightAction) return <div className="topbar topbar--empty" aria-hidden />;
  return (
    <div className="topbar">
      <span className="topbar-spacer" aria-hidden />
      <button className="topbar-pill" onClick={() => { haptic('light'); rightAction.onClick(); }}>
        {rightAction.label}
      </button>
    </div>
  );
}
