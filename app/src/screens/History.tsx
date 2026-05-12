import { TopBar } from '../components/TopBar';
import { OrderCard } from '../components/OrderCard';
import { feedOrders } from '../data/mock';
import './Lists.css';

export function History() {
  return (
    <div className="screen list">
      <TopBar variant="back" />
      <div className="list-pad">
        <h1 className="h1-page list-title">История заказов</h1>
        <div className="list-cards">
          {feedOrders.slice(0, 3).map((o) => (
            <OrderCard key={o.id} order={{ ...o, status: 'accepted' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
