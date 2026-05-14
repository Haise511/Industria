import { TopBar } from '../components/TopBar';
import { notifications } from '../data/mock';
import './Notifications.css';

/**
 * «Уведомления» — Figma design-refs/Уведомления/Уведомления.png.
 * Группы по датам (Сегодня / Вчера / <дата>). Непрочитанные уведомления
 * (`unread: true`) выводятся ярким белым тайтлом, прочитанные —
 * приглушённым, как в макете.
 */
export function Notifications() {
  return (
    <div className="screen notif">
      <TopBar variant="back" />
      <div className="notif-pad">
        <h1 className="h1 notif-title">Уведомления</h1>
        {notifications.map((g) => (
          <div key={g.section} className="notif-group">
            <h3 className="notif-section">{g.section}</h3>
            <div className="notif-list">
              {g.items.map((n) => (
                <article
                  key={n.id}
                  className={`notif-item ${n.unread ? 'is-unread' : 'is-read'}`}
                >
                  <div className="notif-avatar" aria-hidden />
                  <div className="notif-text">
                    <h4 className="notif-h4">{n.title}</h4>
                    <p className="notif-body">{n.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
