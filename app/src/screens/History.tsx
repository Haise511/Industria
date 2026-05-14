import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { OrderCard } from '../components/OrderCard';
import { feedOrders } from '../data/mock';
import './Lists.css';

/** «История заказов» — Figma «История,повторный заказ/История/История
 *  заказов.png». Стандартный список карточек без статус-плашек: завершённые
 *  заказы выводятся как обычные карточки, без зелёного «Принят» бейджа. */
export function History() {
  const nav = useNavigate();
  return (
    <div className="screen list">
      <TopBar variant="back" />
      <div className="list-pad">
        <h1 className="h1-page list-title">История заказов</h1>
        <div className="list-cards">
          {feedOrders.slice(0, 3).map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onClick={() => nav(`/feed/${o.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
