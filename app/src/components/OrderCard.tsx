import { Star1, Location, Calendar, Note, TickSquare, CloseSquare, Verify } from 'iconsax-react';
import './OrderCard.css';

export type OrderRole = 'artist' | 'customer' | 'studio' | 'composer';
export type OrderStatus = 'waiting' | 'accepted' | 'rejected' | null;
export type OrderLifecycle =
  | 'open'
  | 'awaiting_date'
  | 'today'
  | 'awaiting_confirmation'
  | 'awaiting_rating'
  | 'completed'
  | 'cancelled'
  | 'closed';

export interface Order {
  id: string;
  price: string; // already formatted, e.g. "23 900 сом"
  contract?: 'contract' | 'cash';
  city?: string;
  date?: string;
  description: string;
  authorName: string;
  authorRole: OrderRole;
  authorRating?: number;
  authorAvatar?: string;
  status?: OrderStatus;
  lifecycle?: OrderLifecycle;
  verified?: boolean;
  score?: number;
}

const ROLE_LABEL: Record<OrderRole, string> = {
  artist: 'Артист',
  customer: 'Заказчик',
  studio: 'Студия',
  composer: 'Композитор',
};

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
  showActions?: boolean; // approve/reject icons (responses screen)
}

export function OrderCard({ order, onClick, showActions = false }: OrderCardProps) {
  const tagColor = `var(--tag-${order.authorRole})`;
  return (
    <article className="ocard" onClick={onClick} role={onClick ? 'button' : undefined}>
      <header className="ocard-meta">
        <span className="ocard-price">{order.price}</span>
        {typeof order.score === 'number' && order.score >= 60 && (
          <span className="ocard-score">{order.score}%</span>
        )}
        <div className="ocard-meta-right">
          {order.contract === 'contract' && (
            <span className="ocard-meta-item">
              <Icon name="contract" /> По договору
            </span>
          )}
          {order.city && (
            <span className="ocard-meta-item">
              <Icon name="pin" /> {order.city}
            </span>
          )}
          {order.date && (
            <span className="ocard-meta-item">
              <Icon name="calendar" /> {order.date}
            </span>
          )}
        </div>
      </header>

      <p className="ocard-desc">{order.description}</p>

      <footer className="ocard-foot">
        <div className="ocard-author">
          <div className="ocard-avatar" aria-hidden>
            {order.authorAvatar ? (
              <img src={order.authorAvatar} alt="" />
            ) : (
              <span>{order.authorName.charAt(0)}</span>
            )}
          </div>
          <span className="ocard-author-name">{order.authorName}</span>
          {order.verified && (
            <span aria-label="Верифицирован" style={{ display: 'inline-flex' }}>
              <Verify size={14} color="#3B9CFD" variant="Bold" />
            </span>
          )}
          {typeof order.authorRating === 'number' && (
            <span className="ocard-rating">
              <Star1 size={14} color="#fbbe25" variant="Bold" /> {order.authorRating.toFixed(1)}
            </span>
          )}
          <span className="ocard-role" style={{ color: tagColor }}>
            {ROLE_LABEL[order.authorRole]}
          </span>
        </div>

        {order.status && <StatusBadge status={order.status} />}

        {showActions && (
          <div className="ocard-actions">
            <button className="ocard-action" aria-label="Принять">
              <TickSquare size={16} color="#34c759" variant="Bold" />
            </button>
            <button className="ocard-action" aria-label="Отклонить">
              <CloseSquare size={16} color="#ff5356" variant="Bold" />
            </button>
          </div>
        )}
      </footer>
    </article>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  if (!status) return null;
  const map = {
    waiting: { label: 'В ожидании', color: '#ff9f33', bg: 'rgba(255, 159, 51, 0.12)' },
    accepted: { label: 'Принят', color: '#34c759', bg: 'rgba(52, 199, 89, 0.12)' },
    rejected: { label: 'Отклонен', color: '#ff5356', bg: 'rgba(255, 83, 86, 0.12)' },
  };
  const s = map[status];
  return (
    <span className="ocard-status" style={{ color: s.color, background: s.bg, borderColor: s.color }}>
      {s.label}
    </span>
  );
}

function Icon({ name }: { name: 'contract' | 'pin' | 'calendar' }) {
  // 12px iconsax-react glyphs at currentColor, matching the meta-row hint size.
  switch (name) {
    case 'contract':
      return <Note size={12} color="currentColor" variant="Bold" />;
    case 'pin':
      return <Location size={12} color="currentColor" variant="Bold" />;
    case 'calendar':
      return <Calendar size={12} color="currentColor" variant="Bold" />;
  }
}
