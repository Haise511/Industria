import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Notification, Filter, ArrangeVertical, Add } from 'iconsax-react';
import { TopBar } from '../components/TopBar';
import { OrderCard } from '../components/OrderCard';
import { feedOrders } from '../data/mock';
import { haptic } from '../telegram';
import './Feed.css';

const CHIPS = ['Все', 'Заказчики', 'Студии', 'Композиторы', 'Артисты'];

export function Feed() {
  const nav = useNavigate();
  const [mode, setMode] = useState<'normal' | 'toi'>('normal');
  const [chip, setChip] = useState('Все');
  return (
    <div className="screen feed">
      <TopBar />
      <div className="feed-controls">
        <div className="feed-segment-row">
          <div className="feed-segment">
            <button
              className={`feed-seg-btn ${mode === 'normal' ? 'is-active' : ''}`}
              onClick={() => { haptic('light'); setMode('normal'); }}
            >
              Обычный
            </button>
            <button
              className={`feed-seg-btn ${mode === 'toi' ? 'is-active' : ''}`}
              onClick={() => { haptic('light'); setMode('toi'); }}
            >
              Тойский
            </button>
          </div>
          <button className="feed-bell" onClick={() => nav('/notifications')} aria-label="Уведомления">
            {/* Figma: vuesax/bold/notification — bell with unread dot */}
            <Notification size={20} color="#fff" variant="Bold" />
            <span className="feed-bell-dot" />
          </button>
        </div>

        <div className="h-scroll feed-chips">
          <button className="feed-chip-icon" aria-label="Фильтр" onClick={() => nav('/filter')}>
            <Filter size={20} color="#fff" variant="Bold" />
          </button>
          <button className="feed-chip-icon" aria-label="Сортировка" onClick={() => nav('/sort')}>
            <ArrangeVertical size={20} color="#fff" variant="Bold" />
          </button>
          {CHIPS.map((c) => (
            <button
              key={c}
              className={`feed-chip ${chip === c ? 'is-active' : ''}`}
              onClick={() => { haptic('light'); setChip(c); }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="feed-list">
        {feedOrders.map((o) => (
          <OrderCard key={o.id} order={o} onClick={() => nav(`/feed/${o.id}`)} />
        ))}
      </div>

      <button className="feed-fab" onClick={() => nav('/create')}>
        <span>Создать заявку</span>
        <Add size={20} color="#fff" variant="Linear" />
      </button>
    </div>
  );
}
