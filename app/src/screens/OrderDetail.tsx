import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { api, type ApiOrder } from '../api';
import { haptic } from '../telegram';
import { useAuth } from '../context/AuthContext';
import { ArrowRight2, Star1, Note, Location, Calendar, Verify } from 'iconsax-react';
import './OrderDetail.css';

const ROLE_LABEL: Record<string, string> = {
  artist: 'Артист',
  customer: 'Заказчик',
  studio: 'Студия',
  composer: 'Композитор',
};

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getOrderById(id)
      .then(setOrder)
      .catch(() => nav(-1))
      .finally(() => setLoading(false));
  }, [id, nav]);

  if (loading) {
    return (
      <div className="screen detail">
        <TopBar />
        <div className="detail-pad">
          <p className="muted">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const price = order.price.toLocaleString('ru-RU') + ' сом';
  const role = ROLE_LABEL[order.author.role] ?? order.author.role;
  const isAuthor = user?.id === order.author.id;

  function handleRespond() {
    haptic('light');
    nav('/respond/date', {
      state: {
        orderId: order!.id,
        description: order!.description,
        price: order!.price,
        city: order!.city,
        date: order!.date,
        mode: order!.mode,
      },
    });
  }

  return (
    <div className="screen detail">
      <TopBar />
      <div className="detail-pad">
        <div className="detail-author">
          <div className="detail-avatar">
            {order.author.avatarUrl
              ? <img src={order.author.avatarUrl} alt="" />
              : <span>{order.author.name.charAt(0)}</span>}
          </div>
          <div className="detail-author-meta">
            <div className="detail-author-row">
              <h2 className="h2">{order.author.name}</h2>
              {order.author.verified && (
                <Verify size={16} color="#3B9CFD" variant="Bold" />
              )}
              <Chevron />
            </div>
            {order.author.rating > 0 && (
              <div className="detail-rating">
                <Star /> {order.author.rating.toFixed(1)}
              </div>
            )}
            <span className="detail-role muted">{role}</span>
          </div>
        </div>

        <section className="detail-section">
          <h3 className="detail-section-title">Описание</h3>
          <p className="detail-text">{order.description}</p>
        </section>

        <section className="detail-grid">
          <div className="detail-row">
            <span className="muted">Тип работы</span>
            <span className="detail-row-val">
              <ContractIcon />
              {order.contract === 'contract' ? ' По договору' : ' Наличные'}
            </span>
          </div>
          {order.city && (
            <div className="detail-row">
              <span className="muted">Город</span>
              <span className="detail-row-val">
                <Location size={14} color="currentColor" variant="Bold" /> {order.city}
              </span>
            </div>
          )}
          <div className="detail-row">
            <span className="muted">Режим</span>
            <span className="detail-row-val">
              {order.mode === 'toi' ? 'Тойский' : 'Обычный'}
            </span>
          </div>
          {order.date && (
            <div className="detail-row">
              <span className="muted">Дата</span>
              <span className="detail-row-val">
                <Calendar size={14} color="currentColor" variant="Bold" /> {order.date}
              </span>
            </div>
          )}
          <div className="detail-row detail-row--strong">
            <span className="muted">Прайс</span>
            <span className="detail-row-val detail-price">{price}</span>
          </div>
        </section>
      </div>

      <div className="detail-cta">
        {isAuthor ? (
          <PrimaryButton onClick={() => { haptic('light'); nav(`/orders/${order.id}/responses`); }}>
            Посмотреть отклики
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={handleRespond}>Откликнуться</PrimaryButton>
        )}
      </div>
    </div>
  );
}

function Chevron() {
  return <ArrowRight2 size={20} color="#fff" variant="Linear" />;
}
function Star() {
  return <Star1 size={14} color="#fbbe25" variant="Bold" />;
}
function ContractIcon() {
  return <Note size={14} color="currentColor" variant="Bold" />;
}
