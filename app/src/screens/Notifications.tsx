import { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { NotificationSheet } from '../components/NotificationSheet';
import { api, type ApiNotification } from '../api';
import { haptic } from '../telegram';
import './Notifications.css';

function groupByDate(items: ApiNotification[]): Array<{ section: string; items: ApiNotification[] }> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const fmt = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const isYesterday = (d: Date) => d.toDateString() === yesterday.toDateString();

  const groups = new Map<string, ApiNotification[]>();
  for (const n of items) {
    const d = new Date(n.createdAt);
    const key = isToday(d) ? 'Сегодня' : isYesterday(d) ? 'Вчера' : fmt(d);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  }
  return [...groups.entries()].map(([section, items]) => ({ section, items }));
}

export function Notifications() {
  const [groups, setGroups] = useState<ReturnType<typeof groupByDate>>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApiNotification | null>(null);

  useEffect(() => {
    api.getNotifications()
      .then(data => {
        setGroups(groupByDate(data));
        api.markNotificationsRead().catch(() => {});
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="screen notif">
      <TopBar variant="back" />
      <div className="notif-pad">
        <h1 className="h1 notif-title">Уведомления</h1>
        {loading && <p className="muted">Загрузка...</p>}
        {!loading && groups.length === 0 && <p className="muted">Нет уведомлений</p>}
        {groups.map((g) => (
          <div key={g.section} className="notif-group">
            <h3 className="notif-section">{g.section}</h3>
            <div className="notif-list">
              {g.items.map((n) => (
                <article
                  key={n.id}
                  className={`notif-item ${!n.read ? 'is-unread' : 'is-read'}`}
                  role="button"
                  onClick={() => { haptic('light'); setSelected(n); }}
                >
                  <div className="notif-avatar" aria-hidden />
                  <div className="notif-text">
                    <h4 className="notif-h4">{n.title ?? n.text}</h4>
                    {n.body && <p className="notif-body">{n.body}</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
      <NotificationSheet notification={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
