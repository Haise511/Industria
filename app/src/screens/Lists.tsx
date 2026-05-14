import { useNavigate } from 'react-router-dom';
import { Add } from 'iconsax-react';
import { TopBar } from '../components/TopBar';
import { OrderCard } from '../components/OrderCard';
import { myOrders, responses, activeOrders } from '../data/mock';
import './Lists.css';
// Reuse the floating "Создать заявку" CTA styles from Feed (.feed-fab) on
// MyOrders so users can create an order from their own list without bouncing
// through /feed first.
import './Feed.css';

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
      {/* Same floating CTA as the Feed screen — keep the create-order entry
          point reachable on the user's own list too (Figma node 1:6452). */}
      <button className="feed-fab" onClick={() => nav('/create')}>
        <span>Создать заявку</span>
        <Add size={20} color="#fff" variant="Linear" />
      </button>
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
