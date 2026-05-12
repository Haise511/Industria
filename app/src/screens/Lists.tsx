import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { OrderCard } from '../components/OrderCard';
import { myOrders, responses, activeOrders } from '../data/mock';
import './Lists.css';

/** Заявки — заявки, созданные текущим пользователем. */
export function MyOrders() {
  const nav = useNavigate();
  return (
    <div className="screen list">
      <TopBar />
      <div className="list-pad">
        <h1 className="h1-page list-title">Заявки</h1>
        <div className="list-cards">
          {myOrders.map((o) => (
            <OrderCard key={o.id} order={o} onClick={() => nav(`/feed/${o.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Отклики — пользователь откликнулся, ждет ответа. */
export function Responses() {
  return (
    <div className="screen list">
      <TopBar />
      <div className="list-pad">
        <h1 className="h1-page list-title">Отклики</h1>
        <div className="list-cards">
          {responses.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Заказы — активные заказы, где пользователь принят. */
export function ActiveOrders() {
  return (
    <div className="screen list">
      <TopBar />
      <div className="list-pad">
        <h1 className="h1-page list-title">Заказы</h1>
        <div className="list-cards">
          {activeOrders.map((o) => (
            <OrderCard key={o.id} order={o} showActions />
          ))}
        </div>
      </div>
    </div>
  );
}
