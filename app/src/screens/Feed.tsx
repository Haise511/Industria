import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Notification, Filter, ArrangeVertical, Add } from 'iconsax-react';
import { TopBar } from '../components/TopBar';
import { OrderCard, type Order } from '../components/OrderCard';
import { haptic } from '../telegram';
import { api, toOrder } from '../api';
import { filterStore } from '../store/filterStore';
import './Feed.css';

const CHIPS = ['Все', 'Заказчики', 'Студии', 'Композиторы', 'Артисты'];
const CHIP_ROLE: Record<string, string | undefined> = {
  'Заказчики': 'customer', 'Студии': 'studio',
  'Композиторы': 'composer', 'Артисты': 'artist',
};

function sortOrders(orders: Order[], sort: string): Order[] {
  const arr = [...orders];
  switch (sort) {
    case 'newest':
      return arr; // already sorted by createdAt desc from server
    case 'price-desc':
      return arr.sort((a, b) => parsePriceNum(b.price) - parsePriceNum(a.price));
    case 'price-asc':
      return arr.sort((a, b) => parsePriceNum(a.price) - parsePriceNum(b.price));
    case 'rating':
      return arr.sort((a, b) => (b.authorRating ?? 0) - (a.authorRating ?? 0));
    default:
      return arr; // 'default' = match score order from server
  }
}

function parsePriceNum(price: string): number {
  return Number(price.replace(/\D/g, '')) || 0;
}

export function Feed() {
  const nav = useNavigate();
  const [mode, setMode] = useState<'normal' | 'toi'>('normal');
  const [chip, setChip] = useState('Все');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(() => filterStore.get());

  // Re-render when filterStore changes (user applied filters)
  useEffect(() => filterStore.subscribe(() => setFilters(filterStore.get())), []);

  useEffect(() => {
    setLoading(true);
    const chipRole = CHIP_ROLE[chip];
    const role = chipRole ?? filters.role ?? undefined;
    api.getOrders({ mode, ...(role ? { role } : {}) })
      .then(data => {
        let result = data
          .filter(o => !filters.contract || o.contract === 'contract')
          .map(o => toOrder(o));

        if (filters.minRating) {
          result = result.filter(o =>
            o.authorRating !== undefined && o.authorRating >= filters.minRating!
          );
        }

        setOrders(sortOrders(result, filters.sort));
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [mode, chip, filters]);

  const hasActiveFilters = filters.role || filters.contract || filters.minRating || filters.city;

  return (
    <div className="screen feed">
      <TopBar />
      <div className="feed-controls">
        <div className="feed-segment-row">
          <div className="feed-segment">
            <button className={`feed-seg-btn ${mode === 'normal' ? 'is-active' : ''}`}
              onClick={() => { haptic('light'); setMode('normal'); }}>Обычный</button>
            <button className={`feed-seg-btn ${mode === 'toi' ? 'is-active' : ''}`}
              onClick={() => { haptic('light'); setMode('toi'); }}>Тойский</button>
          </div>
          <button className="feed-bell" onClick={() => nav('/notifications')} aria-label="Уведомления">
            <Notification size={20} color="#fff" variant="Bold" />
            <span className="feed-bell-dot" />
          </button>
        </div>

        <div className="h-scroll feed-chips">
          <button className={`feed-chip-icon${hasActiveFilters ? ' is-active' : ''}`}
            aria-label="Фильтр" onClick={() => nav('/filter')}>
            <Filter size={20} color="#fff" variant="Bold" />
          </button>
          <button className={`feed-chip-icon${filters.sort !== 'default' ? ' is-active' : ''}`}
            aria-label="Сортировка" onClick={() => nav('/sort')}>
            <ArrangeVertical size={20} color="#fff" variant="Bold" />
          </button>
          {CHIPS.map((c) => (
            <button key={c} className={`feed-chip ${chip === c ? 'is-active' : ''}`}
              onClick={() => { haptic('light'); setChip(c); }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="feed-list">
        {loading && <p className="feed-empty">Загрузка...</p>}
        {!loading && orders.length === 0 && <p className="feed-empty">Нет заявок</p>}
        {!loading && orders.map((o) => (
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
