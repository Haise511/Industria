import { Star1, Location, Calendar, Note, TickSquare, CloseSquare, Verify } from 'iconsax-react';
import './OrderCard.css';

export type OrderRole = 'artist' | 'customer' | 'studio' | 'composer';
export type OrderStatus = 'waiting' | 'accepted' | 'rejected' | 'withdrawn' | null;
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
  /** Уже отформатированный рейтинг (с учётом порога "Новый"). Undefined,
   *  если пользователь — «Новый» (см. authorIsNew). */
  authorRating?: number;
  /** True, если у автора < 3 отзывов — показываем пилюлю «Новый»
   *  вместо звезды с числом. */
  authorIsNew?: boolean;
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
          {order.authorIsNew && (
            <span className="ocard-rating ocard-rating--new">Новый</span>
          )}
          <span className="ocard-role" style={{ color: tagColor }}>
            {ROLE_LABEL[order.authorRole]}
          </span>
        </div>

        <FooterBadge order={order} />

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

const LIFECYCLE_BADGE: Partial<Record<OrderLifecycle, { label: string; color: string }>> = {
  awaiting_date:         { label: 'Ожидает даты',  color: '#ff9f33' },
  today:                 { label: 'Сегодня',       color: '#3B9CFD' },
  awaiting_confirmation: { label: 'Подтвердите',   color: '#ff9f33' },
  awaiting_rating:       { label: 'Оцените',       color: '#fbbe25' },
};

const STATUS_BADGE: Record<NonNullable<OrderStatus>, { label: string; color: string }> = {
  waiting:   { label: 'В ожидании', color: '#ff9f33' },
  accepted:  { label: 'Принят',     color: '#34c759' },
  withdrawn: { label: 'Отозван',    color: '#8b8b8b' },
  rejected: { label: 'Отклонен',   color: '#ff5356' },
};

/** Right-aligned pill inside the footer. Priority: response status > lifecycle. */
function FooterBadge({ order }: { order: Order }) {
  const meta = order.status
    ? STATUS_BADGE[order.status]
    : order.lifecycle ? LIFECYCLE_BADGE[order.lifecycle] : undefined;
  if (!meta) return null;
  return (
    <span
      className="ocard-status"
      style={{ color: meta.color, borderColor: meta.color, background: 'transparent' }}
    >
      {meta.label}
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
