import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star1, TickSquare, CloseSquare, Verify } from 'iconsax-react';
import { TopBar } from '../components/TopBar';
import { api, type ApiResponse } from '../api';
import { haptic } from '../telegram';
import './OrderResponses.css';

const ROLE_LABEL: Record<string, string> = {
  artist: 'Артист', customer: 'Заказчик', studio: 'Студия', composer: 'Композитор',
};

export function OrderResponses() {
  const { id } = useParams<{ id: string }>();
  const [responses, setResponses] = useState<ApiResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getOrderResponses(id)
      .then(setResponses)
      .catch(() => setResponses([]))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAction(responseId: number, status: 'accepted' | 'rejected') {
    haptic('medium');
    try {
      await api.updateResponse(responseId, status);
      setResponses(prev =>
        prev.map(r => r.id === responseId ? { ...r, status } : r)
      );
    } catch { /* ignore */ }
  }

  return (
    <div className="screen orsp">
      <TopBar variant="back" />
      <div className="orsp-pad">
        <h1 className="h1 orsp-title">Отклики</h1>
        {loading && <p className="muted">Загрузка...</p>}
        {!loading && responses.length === 0 && (
          <p className="muted orsp-empty">Пока никто не откликнулся</p>
        )}
        {responses.map(r => (
          <div key={r.id} className="orsp-card">
            <div className="orsp-user">
              <div className="orsp-avatar">
                {r.user?.avatarUrl
                  ? <img src={r.user.avatarUrl} alt="" />
                  : <span>{r.user?.name?.charAt(0) ?? '?'}</span>}
              </div>
              <div className="orsp-user-info">
                <div className="orsp-name-row">
                  <span className="orsp-name">{r.user?.name}</span>
                  {r.user?.verified && <Verify size={14} color="#3B9CFD" variant="Bold" />}
                </div>
                <div className="orsp-meta">
                  {(r.user?.rating ?? 0) > 0 && (
                    <span className="orsp-rating">
                      <Star1 size={12} color="#fbbe25" variant="Bold" /> {r.user!.rating.toFixed(1)}
                    </span>
                  )}
                  <span className="orsp-role muted">{ROLE_LABEL[r.user?.role ?? ''] ?? '—'}</span>
                </div>
              </div>
            </div>

            {r.date && <p className="orsp-date muted">Дата: {r.date}</p>}
            {r.comment && <p className="orsp-comment">{r.comment}</p>}

            <div className="orsp-actions">
              {r.status === 'waiting' ? (
                <>
                  <button
                    className="orsp-btn orsp-btn--accept"
                    onClick={() => handleAction(r.id, 'accepted')}
                  >
                    <TickSquare size={16} color="currentColor" variant="Bold" />
                    Принять
                  </button>
                  <button
                    className="orsp-btn orsp-btn--reject"
                    onClick={() => handleAction(r.id, 'rejected')}
                  >
                    <CloseSquare size={16} color="currentColor" variant="Bold" />
                    Отклонить
                  </button>
                </>
              ) : (
                <span className={`orsp-status orsp-status--${r.status}`}>
                  {r.status === 'accepted' ? 'Принят' : 'Отклонён'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
