import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { OrderCard, type Order } from '../components/OrderCard';
import { api, toOrder, toResponseOrder } from '../api';
import './Lists.css';

export function MyOrders() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyOrders()
      .then(data => setOrders(data.map(o => toOrder(o))))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="screen list">
      <TopBar />
      <div className="list-pad">
        <h1 className="h1-page list-title">Заявки</h1>
        <div className="list-cards">
          {loading && <p className="list-empty">Загрузка...</p>}
          {!loading && orders.length === 0 && <p className="list-empty">Нет заявок</p>}
          {!loading && orders.map((o) => (
            <OrderCard key={o.id} order={o} onClick={() => nav(`/feed/${o.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Responses() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getResponses()
      .then(data => setOrders(data.map(toResponseOrder)))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="screen list">
      <TopBar />
      <div className="list-pad">
        <h1 className="h1-page list-title">Отклики</h1>
        <div className="list-cards">
          {loading && <p className="list-empty">Загрузка...</p>}
          {!loading && orders.length === 0 && <p className="list-empty">Нет откликов</p>}
          {!loading && orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      </div>
    </div>
  );
}

const ACTIVE_LIFECYCLES = new Set([
  'awaiting_date',
  'today',
  'awaiting_confirmation',
  'awaiting_rating',
]);

const STATUS_HINT: Record<string, { label: string; color: string }> = {
  awaiting_date: { label: 'Ожидает даты', color: '#ff9f33' },
  today: { label: 'Сегодня', color: '#3B9CFD' },
  awaiting_confirmation: { label: 'Подтвердите', color: '#ff9f33' },
  awaiting_rating: { label: 'Оцените', color: '#fbbe25' },
};

export function ActiveOrders() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Активные заказы могут быть как у автора (мои заявки в lifecycle), так и у исполнителя
    // (принятые отклики). Сливаем оба источника, дедуплицируя по id.
    Promise.all([api.getMyOrders().catch(() => []), api.getResponses().catch(() => [])])
      .then(([mine, responses]) => {
        const list: Order[] = [];
        const seen = new Set<string>();

        for (const o of mine) {
          if (!ACTIVE_LIFECYCLES.has(o.status)) continue;
          const card = toOrder(o);
          if (seen.has(card.id)) continue;
          seen.add(card.id);
          list.push(card);
        }
        for (const r of responses) {
          if (r.status !== 'accepted') continue;
          if (!ACTIVE_LIFECYCLES.has(r.order.status)) continue;
          const card = toResponseOrder(r);
          if (seen.has(card.id)) continue;
          seen.add(card.id);
          list.push(card);
        }
        setOrders(list);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="screen list">
      <TopBar />
      <div className="list-pad">
        <h1 className="h1-page list-title">Заказы</h1>
        <div className="list-cards">
          {loading && <p className="list-empty">Загрузка...</p>}
          {!loading && orders.length === 0 && <p className="list-empty">Нет активных заказов</p>}
          {!loading && orders.map((o) => {
            const hint = o.lifecycle ? STATUS_HINT[o.lifecycle] : undefined;
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
