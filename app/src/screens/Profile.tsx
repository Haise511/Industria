import { useNavigate } from 'react-router-dom';
import {
  Card,
  Star1,
  ShieldTick,
  Refresh,
  Profile2User,
  VideoPlay,
  Document,
  Messages2,
  Location,
  ArrowRight2,
  Global,
} from 'iconsax-react';
import { TopBar } from '../components/TopBar';
import { useAuth } from '../context/AuthContext';
import avatarMainImg from '../assets/figma/avatar_main.png';
import './Profile.css';

const ROLE_LABEL: Record<string, string> = {
  artist: 'Артист',
  customer: 'Заказчик',
  studio: 'Студия',
  composer: 'Композитор',
};

interface MenuItem {
  icon: JSX.Element;
  label: string;
  hint?: string;
  hintColor?: string;
  hintInline?: boolean;
  to: string;
}

const ICON = { size: 20, color: '#fff', variant: 'Bold' as const };

export function Profile() {
  const nav = useNavigate();
  const { user } = useAuth();

  const name = user?.name ?? '—';
  const role = user?.role ? ROLE_LABEL[user.role] : '—';
  const city = user?.city ?? null;
  const rating = user?.rating ?? 0;
  const avatar = user?.avatarUrl ?? null;

  const items: MenuItem[] = [
    { icon: <Card {...ICON} />, label: 'Подписка', hint: 'Активна до 15 мая 2026', hintColor: 'var(--success)', to: '/subscription' },
    { icon: <Star1 {...ICON} />, label: 'Отзывы', hint: rating > 0 ? rating.toFixed(1) : '—', hintInline: true, to: '/reviews' },
    { icon: <ShieldTick {...ICON} />, label: 'Заказать верификацию', to: '/verification' },
    { icon: <Refresh {...ICON} />, label: 'История заказов', to: '/history' },
    { icon: <Profile2User {...ICON} />, label: 'Услуги команды', to: '/team' },
    { icon: <VideoPlay {...ICON} />, label: 'Туториалы', hint: 'Обучающие видео на YouTube', to: '/tutorials' },
    { icon: <Document {...ICON} />, label: 'Правила использования сервиса', to: '/rules' },
    { icon: <Global {...ICON} />, label: 'Язык приложения', to: '/settings/language' },
    { icon: <Messages2 {...ICON} />, label: 'Написать в поддержку', to: '/support' },
  ];

  return (
    <div className="screen prof">
      <TopBar />
      <div className="prof-pad">
        <div className="prof-card">
          <div className="prof-head">
            <div className="prof-ava">
              <img src={avatar ?? avatarMainImg} alt="" />
            </div>
            <div className="prof-head-text">
              <h2 className="prof-head-name">{name}</h2>
              <div className="prof-head-meta">
                <span className="prof-role">{role}</span>
                {city && (
                  <span className="prof-meta-loc">
                    <Location size={12} color="#fff" variant="Bold" />
                    <span>{city}</span>
                  </span>
                )}
                {rating > 0 && (
                  <span className="prof-meta-rating">
                    <Star1 size={14} color="#fbbe25" variant="Bold" />
                    <span>{rating.toFixed(1)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="prof-progress">
            <div className="prof-progress-row">
              <span className="muted">Заполненность профиля</span>
              <span>85%</span>
            </div>
            <div className="prof-progress-track">
              <div className="prof-progress-fill" style={{ width: '85%' }} />
            </div>
          </div>
        </div>

        <div className="prof-menu">
          {items.map((it) => (
            <button key={it.label} className="prof-menu-item" onClick={() => nav(it.to)}>
              <span className="prof-menu-icon">{it.icon}</span>
              <span className="prof-menu-body">
                {it.hintInline ? (
                  <span className="prof-menu-row">
                    <span className="prof-menu-label">{it.label}</span>
                    <span className="prof-menu-hint--inline">{it.hint}</span>
                  </span>
                ) : (
                  <>
                    <span className="prof-menu-label">{it.label}</span>
                    {it.hint && (
                      <span className="prof-menu-hint" style={{ color: it.hintColor ?? 'var(--text-muted)' }}>
                        {it.hint}
                      </span>
                    )}
                  </>
                )}
              </span>
              <span className="prof-menu-chev">
                <ArrowRight2 size={14} color="#fff" variant="Linear" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
