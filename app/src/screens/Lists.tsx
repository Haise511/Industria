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

export function ActiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getResponses()
      .then(data => setOrders(
        data.filter(r => r.status === 'accepted').map(toResponseOrder)
      ))
      .catch(() => setOrders([]))
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
          {!loading && orders.map((o) => (
            <OrderCard key={o.id} order={o} showActions />
          ))}
        </div>
      </div>
    </div>
  );
}
