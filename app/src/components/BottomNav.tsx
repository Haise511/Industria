import { NavLink, useLocation } from 'react-router-dom';
import { Home, Send2, ReceiveSquare2, Flash, Profile } from 'iconsax-react';
import { haptic } from '../telegram';
import './BottomNav.css';

/*
 * Bottom navigation — icons map 1:1 to the Figma vuesax/bold instances:
 *   Лента   -> vuesax/bold/home              -> <Home />
 *   Заявки  -> vuesax/bold/send-sqaure-2     -> <Send2 />          (sic: typo in source)
 *   Отклики -> vuesax/bold/receive-square-2  -> <ReceiveSquare2 />
 *   Заказы  -> vuesax/bold/flash             -> <Flash />
 *   Профиль -> vuesax/bold/frame (id 1:6211) -> <Profile />
 *
 * The Figma node is mis-named "vuesax/bold/frame" but its two child vectors
 * (a 9.5x9.5 head circle + a 14.1x9.2 shoulders shape) match iconsax's
 * single-user `Profile` glyph (NOT `Profile2User`, which has four vectors).
 *
 * `currentColor` flows through `color` on the parent `.bnav-tab`, so the
 * is-active color swap stays driven by CSS rather than per-icon props.
 */

type IconCmp = typeof Home;

interface Tab {
  to: string;
  label: string;
  Icon: IconCmp;
}

const tabs: Tab[] = [
  { to: '/feed', label: 'Лента', Icon: Home },
  { to: '/orders/my', label: 'Заявки', Icon: Send2 },
  { to: '/responses', label: 'Отклики', Icon: ReceiveSquare2 },
  { to: '/active', label: 'Заказы', Icon: Flash },
  { to: '/profile', label: 'Профиль', Icon: Profile },
];

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="bnav-wrap">
      <div className="bnav">
        {tabs.map(({ to, label, Icon }) => {
          const active = loc.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`bnav-tab ${active ? 'is-active' : ''}`}
              onClick={() => haptic('light')}
            >
              <span className="bnav-icon">
                <Icon size={24} color="currentColor" variant="Bold" />
              </span>
              <span className="bnav-label">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
