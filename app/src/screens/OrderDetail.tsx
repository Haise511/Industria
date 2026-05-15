import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { api, type ApiOrder, type OrderLifecycleStatus } from '../api';
import { haptic } from '../telegram';
import { useAuth } from '../context/AuthContext';
import { ArrowRight2, Star1, Note, Location, Calendar, Verify, Lock1 } from 'iconsax-react';
import './OrderDetail.css';

const ROLE_LABEL: Record<string, string> = {
  artist: 'Артист',
  customer: 'Заказчик',
  studio: 'Студия',
  composer: 'Композитор',
};

const STATUS_LABEL: Record<OrderLifecycleStatus, string> = {
  open: 'Открыта',
  awaiting_date: 'Ожидает наступления даты',
  today: 'Сегодня',
  awaiting_confirmation: 'Ожидает подтверждения',
  awaiting_rating: 'Ожидает оценки',
  completed: 'Завершён',
  cancelled: 'Отменён',
  closed: 'Закрыт',
};

const STATUS_COLOR: Record<OrderLifecycleStatus, string> = {
  open: '#34c759',
  awaiting_date: '#ff9f33',
  today: '#3B9CFD',
  awaiting_confirmation: '#ff9f33',
  awaiting_rating: '#fbbe25',
  completed: '#34c759',
  cancelled: '#ff5356',
  closed: '#888',
};

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
  const lifecycle = order.status;
  const isLifecycleActive =
    lifecycle === 'awaiting_date' ||
    lifecycle === 'today' ||
    lifecycle === 'awaiting_confirmation' ||
    lifecycle === 'awaiting_rating';

  function handleRespond() {
    if (!order) return;
    haptic('light');
    nav('/respond/date', {
      state: {
        orderId: order.id,
        description: order.description,
        price: order.price,
        city: order.city,
        date: order.date,
        mode: order.mode,
      },
    });
  }

  async function handleConfirm() {
    if (!order) return;
    haptic('medium');
    setActionLoading(true);
    try {
      const updated = await api.confirmOrder(order.id);
      setOrder(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    if (!order) return;
    haptic('medium');
    setActionLoading(true);
    try {
      const updated = await api.completeOrder(order.id);
      setOrder(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelSubmit(reason: string) {
    if (!order) return;
    try {
      const updated = await api.cancelOrder(order.id, reason);
      setOrder(updated);
      setCancelOpen(false);
    } catch (e) {
      console.error(e);
    }
  }

  // Кто из текущего пользователя уже подтвердил.
  const myConfirmed = isAuthor ? order.confirmedByAuthor : order.confirmedByExecutor;

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

        {isLifecycleActive && (
          <div className="detail-status-pill" style={{ color: STATUS_COLOR[lifecycle], borderColor: STATUS_COLOR[lifecycle] }}>
            {STATUS_LABEL[lifecycle]}
          </div>
        )}

        {lifecycle === 'cancelled' && (
          <div className="detail-status-pill" style={{ color: STATUS_COLOR.cancelled, borderColor: STATUS_COLOR.cancelled }}>
            Отменён{order.cancelReason ? `: ${order.cancelReason}` : ''}
          </div>
        )}

        {lifecycle === 'completed' && (
          <div className="detail-status-pill" style={{ color: STATUS_COLOR.completed, borderColor: STATUS_COLOR.completed }}>
            Завершён
          </div>
        )}

        {isAuthor && order.editFrozen && (lifecycle === 'open') && (
          <div className="detail-frozen-note">
            <Lock1 size={14} color="currentColor" variant="Bold" />
            <span>Редактирование заблокировано — есть отклики</span>
          </div>
        )}

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
        <CtaBlock
          lifecycle={lifecycle}
          isAuthor={isAuthor}
          myConfirmed={!!myConfirmed}
          actionLoading={actionLoading}
          onRespond={handleRespond}
          onConfirm={handleConfirm}
          onComplete={handleComplete}
          onCancel={() => { haptic('light'); setCancelOpen(true); }}
          onViewResponses={() => { haptic('light'); nav(`/orders/${order.id}/responses`); }}
        />
      </div>

      <CancelOrderModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSubmit={handleCancelSubmit}
      />
    </div>
  );
}

interface CtaProps {
  lifecycle: OrderLifecycleStatus;
  isAuthor: boolean;
  myConfirmed: boolean;
  actionLoading: boolean;
  onRespond: () => void;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onViewResponses: () => void;
}

function CtaBlock(p: CtaProps) {
  // Терминальные состояния — кнопок нет.
  if (p.lifecycle === 'completed' || p.lifecycle === 'cancelled' || p.lifecycle === 'closed') {
    return null;
  }

  // Открытая заявка — отклик / просмотр откликов.
  if (p.lifecycle === 'open') {
    if (p.isAuthor) {
      return (
        <PrimaryButton onClick={p.onViewResponses}>Посмотреть отклики</PrimaryButton>
      );
    }
    return <PrimaryButton onClick={p.onRespond}>Откликнуться</PrimaryButton>;
  }

  // Жизненный цикл — две кнопки в столбик: основное действие + отмена.
  return (
    <div className="detail-cta-stack">
      {p.lifecycle === 'awaiting_date' && (
        <PrimaryButton disabled>Ожидает наступления даты</PrimaryButton>
      )}
      {p.lifecycle === 'today' && (
        <PrimaryButton disabled={p.actionLoading} onClick={p.onConfirm}>
          Подтвердить выполнение
        </PrimaryButton>
      )}
      {p.lifecycle === 'awaiting_confirmation' && (
        p.myConfirmed ? (
          <PrimaryButton disabled>Ожидает подтверждения другой стороной</PrimaryButton>
        ) : (
          <PrimaryButton disabled={p.actionLoading} onClick={p.onConfirm}>
            Подтвердить выполнение
          </PrimaryButton>
        )
      )}
      {p.lifecycle === 'awaiting_rating' && (
        <PrimaryButton disabled={p.actionLoading} onClick={p.onComplete}>
          Оценить
        </PrimaryButton>
      )}
      <button type="button" className="detail-cancel-btn" onClick={p.onCancel}>
        Отменить заказ
      </button>
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
