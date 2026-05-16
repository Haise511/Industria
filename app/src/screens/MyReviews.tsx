import { useEffect, useState } from 'react';
import { Star1, ArrangeVertical } from 'iconsax-react';
import { TopBar } from '../components/TopBar';
import { ReviewCard } from '../components/ReviewCard';
import { useAuth } from '../context/AuthContext';
import { api, formatRatingTier, type ApiReview } from '../api';
import './MyReviews.css';

type SortMode = 'recent' | 'highest' | 'lowest';

const SORT_LABEL: Record<SortMode, string> = {
  recent: 'Сначала новые',
  highest: 'Сначала высокие',
  lowest: 'Сначала низкие',
};

/**
 * Список моих полученных отзывов — design-refs/Отзывы.png.
 * Соответствует пункту меню «Отзывы» на /profile.
 *
 *   - заголовок «Отзывы» + N отзывов + рейтинг в правом верхнем углу
 *   - сортировка циклическая (та же что и на UserProfile)
 *   - карточки отзывов
 */
export function MyReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [sort, setSort] = useState<SortMode>('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.getUserReviews(user.id)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [user]);

  const ratingTier = formatRatingTier(user?.rating ?? 0, user?.ratingCount ?? 0);
  const sortedReviews = sortReviews(reviews, sort);

  return (
    <div className="screen myrev">
      <TopBar variant="back" />
      <div className="myrev-pad">
        <div className="myrev-head">
          <div className="myrev-head-left">
            <h1 className="h1-page myrev-title">Отзывы</h1>
            <span className="myrev-count">
              {reviews.length} {pluralReviews(reviews.length)}
            </span>
          </div>
          {ratingTier !== null && (
            <div className="myrev-rating">
              <Star1 size={24} color="#fbbe25" variant="Bold" />
              <span>{ratingTier.toFixed(1)}</span>
            </div>
          )}
        </div>

        {reviews.length > 0 && (
          <button
            type="button"
            className="myrev-sort"
            onClick={() => setSort(nextSort(sort))}
          >
            <ArrangeVertical size={16} color="currentColor" variant="Linear" />
            <span>{SORT_LABEL[sort]}</span>
          </button>
        )}

        <div className="myrev-list">
          {loading && <p className="muted myrev-empty">Загрузка...</p>}
          {!loading && reviews.length === 0 && (
            <p className="muted myrev-empty">Отзывов пока нет.</p>
          )}
          {sortedReviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

function nextSort(s: SortMode): SortMode {
  if (s === 'recent') return 'highest';
  if (s === 'highest') return 'lowest';
  return 'recent';
}

function sortReviews(items: ApiReview[], mode: SortMode): ApiReview[] {
  const copy = [...items];
  if (mode === 'recent') {
    copy.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  } else if (mode === 'highest') {
    copy.sort((a, b) => b.stars - a.stars);
  } else {
    copy.sort((a, b) => a.stars - b.stars);
  }
  return copy;
}

function pluralReviews(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'отзыв';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'отзыва';
  return 'отзывов';
}
