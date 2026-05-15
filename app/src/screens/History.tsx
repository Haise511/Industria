import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { OrderCard, type Order } from '../components/OrderCard';
import { api, toOrder } from '../api';
import './Lists.css';

export function History() {
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
      <TopBar variant="back" />
      <div className="list-pad">
        <h1 className="h1-page list-title">История заказов</h1>
        <div className="list-cards">
          {loading && <p className="list-empty">Загрузка...</p>}
          {!loading && orders.length === 0 && <p className="list-empty">Нет заказов</p>}
          {!loading && orders.map((o) => (
            <OrderCard key={o.id} order={o} onClick={() => nav(`/feed/${o.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}
