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
import avatarMainImg from '../assets/figma/avatar_main.png';
import './Profile.css';

/*
 * Profile screen layout (Figma 1:10087):
 *   - Some menu rows have a sub-hint UNDER the label ("Подписка / Активна до...")
 *   - Some have the hint INLINE next to the label ("Отзывы 4.8")
 *   - Some have only the label ("Заказать верификацию")
 * `hintInline` differentiates the inline-after-label case from the
 * stacked sub-hint case.
 *
 * All glyphs come from iconsax-react (Bold variant) — they map 1:1 to the
 * vuesax/bold instances in Figma:
 *   card -> Card, refresh -> Refresh, profile-2user -> Profile2User,
 *   video-play -> VideoPlay, document -> Document, message-2 -> Messages2.
 */
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
  const items: MenuItem[] = [
    { icon: <Card {...ICON} />, label: 'Подписка', hint: 'Активна до 15 мая 2026', hintColor: 'var(--success)', to: '/subscription' },
    { icon: <Star1 {...ICON} />, label: 'Отзывы', hint: '4.8', hintInline: true, to: '/reviews' },
    { icon: <ShieldTick {...ICON} />, label: 'Заказать верификацию', to: '/verification' },
    { icon: <Refresh {...ICON} />, label: 'История заказов', to: '/history' },
    { icon: <Profile2User {...ICON} />, label: 'Услуги команды', to: '/team' },
    { icon: <VideoPlay {...ICON} />, label: 'Туториалы', hint: 'Обучающие видео на YouTube', to: '/tutorials' },
    { icon: <Document {...ICON} />, label: 'Правила использования сервиса', to: '/rules' },
    // Figma «Профиль.png» добавляет пункт «Язык приложения» между правилами
    // и поддержкой. Маршрут /settings/language пока ведёт на пустой экран —
    // отдельный пункт сделаем при появлении конкретного флоу настроек.
    { icon: <Global {...ICON} />, label: 'Язык приложения', to: '/settings/language' },
    { icon: <Messages2 {...ICON} />, label: 'Написать в поддержку', to: '/support' },
  ];

  return (
    <div className="screen prof">
      <TopBar />
      <div className="prof-pad">
        <div className="prof-card">
          <div className="prof-head">
            {/* Figma: аватар отображает фото пользователя (нода 1:10093,
                fill image). Используем основной аватар из assets/figma. */}
            <div className="prof-ava">
              <img src={avatarMainImg} alt="" />
            </div>
            <div className="prof-head-text">
              <h2 className="prof-head-name">MacLovin</h2>
              <div className="prof-head-meta">
                <span className="prof-role">Артист</span>
                <span className="prof-meta-loc">
                  <Location size={12} color="#fff" variant="Bold" />
                  <span>Бишкек</span>
                </span>
                <span className="prof-meta-rating">
                  <Star1 size={14} color="#fbbe25" variant="Bold" />
                  <span>4.8</span>
                </span>
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
