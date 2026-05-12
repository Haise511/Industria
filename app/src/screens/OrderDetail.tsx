import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { feedOrders } from '../data/mock';
import { ArrowRight2, Star1, Note } from 'iconsax-react';
import './OrderDetail.css';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const order = feedOrders.find((o) => o.id === id) ?? feedOrders[0];

  return (
    <div className="screen detail">
      <TopBar />
      <div className="detail-pad">
        <div className="detail-author">
          <div className="detail-avatar">
            <span>{order.authorName.charAt(0)}</span>
          </div>
          <div className="detail-author-meta">
            <div className="detail-author-row">
              <h2 className="h2">{order.authorName} Studio</h2>
              <Chevron />
            </div>
            <div className="detail-rating">
              <Star /> 5.0
            </div>
            <span className="detail-role muted">Студия</span>
          </div>
        </div>

        <section className="detail-section">
          <h3 className="detail-section-title">Описание</h3>
          <p className="detail-text">
            Ищем талантливого битмейкера с тонким музыкальным вкусом и собственным звучанием! Нужен профи, который чувствует тренды, владеет
            современным саунд-дизайном и умеет создавать цепляющие биты под разные жанры. Если ты горишь музыкой и готов к ярким коллабам — пиши нам!
          </p>
        </section>

        <section className="detail-grid">
          <div className="detail-row">
            <span className="muted">Тип работы</span>
            <span className="detail-row-val">
              <ContractIcon /> По договору
            </span>
          </div>
          <div className="detail-row">
            <span className="muted">Город</span>
            <span className="detail-row-val">{order.city ?? 'Бишкек'}</span>
          </div>
          <div className="detail-row">
            <span className="muted">Режим</span>
            <span className="detail-row-val">Обычный</span>
          </div>
          <div className="detail-row">
            <span className="muted">Свободная дата</span>
            <span className="detail-row-val">1-31 апреля</span>
          </div>
          <div className="detail-row detail-row--strong">
            <span className="muted">Прайс</span>
            <span className="detail-row-val detail-price">{order.price}</span>
          </div>
        </section>
      </div>

      <div className="detail-cta">
        <PrimaryButton onClick={() => nav('/respond/date')}>Откликнуться</PrimaryButton>
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
