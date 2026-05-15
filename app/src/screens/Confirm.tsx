import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { BottomSheetShell } from '../components/BottomSheetShell';
import { PrimaryButton } from '../components/PrimaryButton';
import { api } from '../api';
import { haptic } from '../telegram';
import './Confirm.css';

interface ConfirmProps {
  ctaLabel?: string;
  next?: string;
}

export function Confirm({ ctaLabel = 'Отправить отклик', next = '/feed' }: ConfirmProps) {
  const nav = useNavigate();
  const loc = useLocation();
  const state = (loc.state ?? {}) as Record<string, unknown>;
  const [loading, setLoading] = useState(false);

  // Detect flow: create order vs respond to order
  const isCreateFlow = loc.pathname === '/create/confirm';

  // Data from accumulated location.state
  const description = (state.description as string) ?? '—';
  const price = state.price as number | undefined;
  const city = (state.city as string) ?? '—';
  const date = (state.date as string) ?? '—';
  const mode = (state.mode as string) === 'toi' ? 'Тойский' : 'Обычный';
  const comment = state.comment as string | undefined;
  const orderId = state.orderId as number | undefined;

  async function handleSubmit() {
    haptic('medium');
    setLoading(true);
    try {
      if (isCreateFlow) {
        await api.createOrder({
          description,
          price: price ?? 0,
          city: city !== '—' ? city : undefined,
          date: date !== '—' ? date : undefined,
          mode: (state.mode as 'normal' | 'toi') ?? 'normal',
        });
        nav('/orders/my', { replace: true });
      } else {
        if (!orderId) throw new Error('No orderId');
        await api.respondToOrder(orderId, {
          date: date !== '—' ? date : undefined,
          comment,
        });
        nav('/responses', { replace: true });
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <BottomSheetShell
      title="Проверьте данные"
      cta={
        <PrimaryButton onClick={handleSubmit} disabled={loading}>
          {loading ? 'Отправка...' : ctaLabel}
        </PrimaryButton>
      }
    >
      <section className="cf-section">
        <h3 className="cf-section-title">Описание</h3>
        <p className="cf-text">{description}</p>
      </section>

      <div className="cf-card">
        {isCreateFlow && price !== undefined && (
          <Row label="Прайс" value={`${price.toLocaleString('ru-RU')} сом`} />
        )}
        <Row label="Город" value={city} />
        <Row label="Дата" value={date} />
        <Row label="Режим" value={mode} />
        {comment && <Row label="Комментарий" value={comment} />}
      </div>
    </BottomSheetShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="cf-row">
      <span className="cf-row-label">{label}</span>
      <span className="cf-row-val">{value}</span>
    </div>
  );
}
