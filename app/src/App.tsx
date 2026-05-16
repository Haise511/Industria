import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { initTelegram, getTg } from './telegram';
import { BottomNav } from './components/BottomNav';
import { OnbLanguage, OnbRole, OnbBasicData, OnbProfile, OnbLoading, LanguageSettings } from './screens/Onboarding';
import { Feed } from './screens/Feed';
import { OrderDetail } from './screens/OrderDetail';
import { DatePicker } from './screens/DatePicker';
import { Confirm } from './screens/Confirm';
import { CreateOrder } from './screens/CreateOrder';
import { MyOrders, Responses, ActiveOrders } from './screens/Lists';
import { Profile } from './screens/Profile';
import { ProfileEdit } from './screens/ProfileEdit';
import { UserProfile } from './screens/UserProfile';
import { MyReviews } from './screens/MyReviews';
import { Notifications } from './screens/Notifications';
import { Filter } from './screens/Filter';
import { History } from './screens/History';
import { OrderResponses } from './screens/OrderResponses';
import { Verification } from './screens/Verification';

/** Top-level paths that should display the bottom nav. */
const TAB_PATHS = ['/feed', '/orders/my', '/responses', '/active', '/profile'];

/** Routes that render as bottom-sheet overlays — value is the background
 *  component to mount underneath so the live (blurred) screen shows through
 *  the sheet backdrop. Mapping mirrors the Figma design context. */
const SHEET_BG: Record<string, 'feed' | 'notifications'> = {
  '/create':          'feed',
  '/create/date':     'feed',
  '/create/confirm':  'feed',
  '/respond/date':    'feed',
  '/respond/confirm': 'feed',
  '/verification':    'notifications',
};

export default function App() {
  const loc = useLocation();
  const nav = useNavigate();

  // Initialize the Telegram Mini App once on mount.
  useEffect(() => {
    initTelegram();
  }, []);

  // Wire Telegram BackButton to react-router history. Show on non-tab screens,
  // hide on the main tab screens (Telegram already handles those).
  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    const isTab = TAB_PATHS.some((p) => loc.pathname === p);
    const handler = () => nav(-1);
    if (isTab) {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
      tg.BackButton.onClick(handler);
    }
    return () => tg.BackButton.offClick(handler);
  }, [loc.pathname, nav]);

  // Таб-бар показываем ТОЛЬКО на корневых табах. startsWith ловил детальные
  // экраны (/feed/:id, /profile/edit и т.д.) — там нужен полноэкранный
  // контент с собственной CTA внизу, без плавающей панели.
  const showTabs = TAB_PATHS.includes(loc.pathname);
  const sheetBg = SHEET_BG[loc.pathname];

  return (
    <>
      {sheetBg && (
        <div className="sheet-bg" aria-hidden>
          {sheetBg === 'feed' && <Feed />}
          {sheetBg === 'notifications' && <Notifications />}
        </div>
      )}
      <Routes>
        {/* Onboarding flow — Loading is the app entry point. The logo splash
            auto-advances to /onboarding/language after ~1.5s, matching the
            "Загрузка" frame in Figma which precedes the language picker. */}
        <Route path="/" element={<OnbLoading />} />
        <Route path="/loading" element={<OnbLoading />} />
        <Route path="/onboarding/language" element={<OnbLanguage />} />
        <Route path="/onboarding/role" element={<OnbRole />} />
        <Route path="/onboarding/basic" element={<OnbBasicData />} />
        <Route path="/onboarding/profile" element={<OnbProfile />} />
        <Route path="/onboarding/loading" element={<OnbLoading />} />

        {/* Main tabs */}
        <Route path="/feed" element={<Feed />} />
        <Route path="/feed/:id" element={<OrderDetail />} />
        <Route path="/orders/my" element={<MyOrders />} />
        <Route path="/responses" element={<Responses />} />
        <Route path="/active" element={<ActiveOrders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/reviews" element={<MyReviews />} />
        <Route path="/users/:id" element={<UserProfile />} />

        {/* Respond flow */}
        <Route path="/respond/date" element={<DatePicker />} />
        <Route path="/respond/confirm" element={<Confirm ctaLabel="Отправить отклик" next="/feed" />} />

        {/* Create order flow */}
        <Route path="/create" element={<CreateOrder />} />
        <Route path="/create/date" element={<DatePicker />} />
        <Route path="/create/confirm" element={<Confirm ctaLabel="Опубликовать" next="/orders/my" />} />

        {/* Modals & secondary screens */}
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/filter" element={<Filter />} />
        <Route path="/sort" element={<Filter />} />
        <Route path="/history" element={<History />} />
        <Route path="/orders/:id/responses" element={<OrderResponses />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/settings/language" element={<LanguageSettings />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
      {showTabs && <BottomNav />}
    </>
  );
}
