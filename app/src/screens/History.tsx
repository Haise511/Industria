import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { OrderCard, type Order } from '../components/OrderCard';
import { api, toOrder, toResponseOrder } from '../api';
import './Lists.css';

const TERMINAL = new Set(['completed', 'cancelled', 'closed']);

const HIST_HINT: Record<string, { label: string; color: string }> = {
  completed: { label: 'Завершён', color: '#34c759' },
  cancelled: { label: 'Отменён', color: '#ff5356' },
  closed: { label: 'Закрыт', color: '#888' },
};

export function History() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // История: терминальные заказы автора + терминальные заказы где я исполнитель.
    Promise.all([api.getMyOrders().catch(() => []), api.getResponses().catch(() => [])])
      .then(([mine, responses]) => {
        const list: Order[] = [];
        const seen = new Set<string>();
        for (const o of mine) {
          if (!TERMINAL.has(o.status)) continue;
          const c = toOrder(o);
          if (seen.has(c.id)) continue;
          seen.add(c.id);
          list.push(c);
        }
        for (const r of responses) {
          if (r.status !== 'accepted') continue;
          if (!TERMINAL.has(r.order.status)) continue;
          const c = toResponseOrder(r);
          if (seen.has(c.id)) continue;
          seen.add(c.id);
          list.push(c);
        }
        setOrders(list);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="screen list">
      <TopBar variant="back" />
      <div className="list-pad">
        <h1 className="h1-page list-title">История заказов</h1>
        <div className="list-cards">
          {loading && <p className="list-empty">Загрузка...</p>}
          {!loading && orders.length === 0 && <p className="list-empty">Нет заказов</p>}
          {!loading && orders.map((o) => {
            const hint = o.lifecycle ? HIST_HINT[o.lifecycle] : undefined;
            return (
              <div key={o.id} className="active-card-wrap">
                <OrderCard order={o} onClick={() => nav(`/feed/${o.id}`)} />
                {hint && (
                  <span className="active-card-hint" style={{ color: hint.color, borderColor: hint.color }}>
                    {hint.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
