import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star1, Verify, ArrangeVertical } from 'iconsax-react';
import { TopBar } from '../components/TopBar';
import { ReviewCard } from '../components/ReviewCard';
import { api, formatRatingTier, type ApiPublicUser, type ApiReview, type ProfileLink } from '../api';
import './UserProfile.css';

const ROLE_LABEL: Record<string, string> = {
  artist: 'Артист',
  customer: 'Заказчик',
  studio: 'Студия',
  composer: 'Композитор',
};

type SortMode = 'recent' | 'highest' | 'lowest';

/**
 * Публичный профиль другого пользователя. Соответствует
 * design-refs/Профиль/Профиль.png:
 *   - крупный аватар + имя + role + рейтинг
 *   - Описание (bio)
 *   - Ссылки (socials + streamings + cases — единым списком, как в макете)
 *   - Отзывы — заголовок, счётчик, сортировка, карточки
 *
 * Маршрут: /users/:id. Открывается по тапу на автора в OrderDetail.
 */
export function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [user, setUser] = useState<ApiPublicUser | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [sort, setSort] = useState<SortMode>('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.getUser(Number(id)).catch(() => null),
      api.getUserReviews(Number(id)).catch(() => []),
    ]).then(([u, r]) => {
      if (cancelled) return;
      if (!u) {
        nav(-1);
        return;
      }
      setUser(u);
      setReviews(r);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, nav]);

  if (loading) {
    return (
      <div className="screen uprof">
        <TopBar variant="back" />
        <div className="uprof-pad">
          <p className="muted">Загрузка...</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const role = ROLE_LABEL[user.role] ?? user.role;
  const ratingTier = formatRatingTier(user.rating, user.ratingCount ?? 0);
  const sortedReviews = sortReviews(reviews, sort);
  // Соцсети + стриминги + кейсы — все ссылки в одну группу под «Ссылки»
  // (макет не разделяет их визуально).
  const allLinks: ProfileLink[] = [
    ...(user.socials ?? []),
    ...(user.streamings ?? []),
    ...(user.cases ?? []),
  ];

  return (
    <div className="screen uprof">
      <TopBar variant="back" />
      <div className="uprof-pad">
        <div className="uprof-head">
          <div className="uprof-ava">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt="" />
              : <span>{user.name.charAt(0)}</span>}
          </div>
          <h2 className="uprof-name">
            {user.name}
            {user.verified && (
              <Verify size={16} color="#3B9CFD" variant="Bold" />
            )}
          </h2>
          <div className="uprof-meta">
            {ratingTier !== null ? (
              <span className="uprof-rating">
                <Star1 size={14} color="#fbbe25" variant="Bold" /> {ratingTier.toFixed(1)}
              </span>
            ) : (
              <span className="uprof-rating uprof-rating--new">Новый</span>
            )}
            <span className="uprof-role muted">{role}</span>
          </div>
        </div>

        {user.bio && (
          <section className="uprof-section">
            <h3 className="uprof-section-title">Описание</h3>
            <p className="uprof-bio">{user.bio}</p>
          </section>
        )}

        {allLinks.length > 0 && (
          <section className="uprof-section">
            <h3 className="uprof-section-title">Ссылки</h3>
            <ul className="uprof-links">
              {allLinks.map((l, i) => (
                <li key={i}>
                  <a className="uprof-link" href={l.url} target="_blank" rel="noopener noreferrer">
                    {l.label || l.url}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="uprof-section uprof-reviews">
          <div className="uprof-reviews-head">
            <h3 className="uprof-section-title">Отзывы</h3>
            <span className="uprof-reviews-count">
              {reviews.length} {pluralReviews(reviews.length)}
            </span>
          </div>

          {reviews.length > 0 && (
            <button
              type="button"
              className="uprof-sort"
              onClick={() => setSort(nextSort(sort))}
              aria-label="Сменить сортировку"
            >
              <ArrangeVertical size={16} color="currentColor" variant="Linear" />
              <span>{SORT_LABEL[sort]}</span>
            </button>
          )}

          <div className="uprof-reviews-list">
            {reviews.length === 0 && (
              <p className="muted uprof-empty">Отзывов пока нет.</p>
            )}
            {sortedReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const SORT_LABEL: Record<SortMode, string> = {
  recent: 'Сначала новые',
  highest: 'Сначала высокие',
  lowest: 'Сначала низкие',
};

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
