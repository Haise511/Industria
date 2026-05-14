import { NavLink, useLocation } from 'react-router-dom';
import { Home, ReceiveSquare2, Flash, Profile } from 'iconsax-react';
import { SendSquare2 } from './icons/SendSquare2';
import { haptic } from '../telegram';
import './BottomNav.css';

/*
 * Bottom navigation — icons map 1:1 to the Figma vuesax/bold instances:
 *   Лента   -> vuesax/bold/home              -> <Home />
 *   Заявки  -> vuesax/bold/send-sqaure-2     -> <SendSquare2 />    (custom, see icons/)
 *   Отклики -> vuesax/bold/receive-square-2  -> <ReceiveSquare2 />
 *   Заказы  -> vuesax/bold/flash             -> <Flash />
 *   Профиль -> vuesax/bold/frame (id 1:6211) -> <Profile />
 *
 * The "Заявки" glyph is sourced from the SVG export of node 1:6202 because
 * iconsax-react's <Send2 /> renders a different (paper-plane) vector. The
 * Figma export shows a rounded square with a diagonal arrow inside.
 *
 * `currentColor` flows through `color` on the parent `.bnav-tab`, so the
 * is-active color swap stays driven by CSS rather than per-icon props.
 */

interface Tab {
  to: string;
  label: string;
  render: (size: number) => JSX.Element;
}

const tabs: Tab[] = [
  { to: '/feed', label: 'Лента', render: (s) => <Home size={s} color="currentColor" variant="Bold" /> },
  { to: '/orders/my', label: 'Заявки', render: (s) => <SendSquare2 size={s} /> },
  { to: '/responses', label: 'Отклики', render: (s) => <ReceiveSquare2 size={s} color="currentColor" variant="Bold" /> },
  { to: '/active', label: 'Заказы', render: (s) => <Flash size={s} color="currentColor" variant="Bold" /> },
  { to: '/profile', label: 'Профиль', render: (s) => <Profile size={s} color="currentColor" variant="Bold" /> },
];

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="bnav-wrap">
      <div className="bnav">
        {tabs.map(({ to, label, render }) => {
          const active = loc.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`bnav-tab ${active ? 'is-active' : ''}`}
              onClick={() => haptic('light')}
            >
              <span className="bnav-icon">{render(28)}</span>
              <span className="bnav-label">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
