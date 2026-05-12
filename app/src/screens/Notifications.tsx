import { TopBar } from '../components/TopBar';
import { notifications } from '../data/mock';
import './Notifications.css';

export function Notifications() {
  return (
    <div className="screen notif">
      <TopBar variant="back" />
      <div className="notif-pad">
        <h1 className="h1 notif-title">Уведомления</h1>
        {notifications.map((g) => (
          <div key={g.section} className="notif-group">
            <h3 className="notif-section muted">{g.section}</h3>
            <div className="notif-list">
              {g.items.map((n) => (
                <article key={n.id} className="notif-item">
                  <div className="notif-dot" />
                  <div className="notif-text">
                    <h4 className="notif-h4">{n.title}</h4>
                    <p className="notif-body muted">{n.body}</p>
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
