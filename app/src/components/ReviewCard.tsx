import { Star1 } from 'iconsax-react';
import type { ApiReview } from '../api';
import './ReviewCard.css';

interface Props {
  review: ApiReview;
}

/**
 * Карточка одного отзыва — design-refs/Отзывы.png и
 * design-refs/Профиль/Профиль.png:
 *   - ряд из 5 звёзд (заполненные жёлтые до stars, остальные серые)
 *   - текст отзыва (необязателен)
 *   - имя автора + дата DD.MM.YYYY
 */
export function ReviewCard({ review }: Props) {
  return (
    <article className="rcard">
      <div className="rcard-stars" aria-label={`${review.stars} из 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star1
            key={n}
            size={20}
            color={n <= review.stars ? '#fbbe25' : '#3a3a3a'}
            variant="Bold"
          />
        ))}
      </div>
      {review.text && <p className="rcard-text">{review.text}</p>}
      <div className="rcard-foot">
        {review.fromUser?.name && <span className="rcard-from">{review.fromUser.name}</span>}
        <span className="rcard-date">{formatDate(review.createdAt)}</span>
      </div>
    </article>
  );
}

/** ISO → DD.MM.YYYY. Дефолтный toLocaleDateString('ru-RU') даёт ровно тот же
 *  формат, что в макете («10.11.2026»). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
