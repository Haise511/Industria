import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import './Confirm.css';

/**
 * "Проверьте данные" — final confirmation before submitting an отклик/заявка.
 * Same layout used both in respond and create flows in the design.
 */
interface ConfirmProps {
  /** Called when the primary button is tapped. Defaults to navigate(-2). */
  ctaLabel?: string;
  comment?: string;
  next?: string;
}

export function Confirm({ ctaLabel = 'Отправить отклик', comment, next = '/feed' }: ConfirmProps) {
  const nav = useNavigate();
  return (
    <div className="screen cf">
      <div className="cf-top">
        <TopBar variant="back" />
      </div>
      <div className="cf-pad">
        <h1 className="h1 cf-title">Проверьте данные</h1>

        <div className="cf-card">
          <Row label="Тип работы" value="По договору" />
          <Row label="Город" value="Бишкек" />
          <Row label="Дата" value="22-25 апреля" />
          <Row label="Прайс" value="23 900 сом" strong />
        </div>

        <div className="cf-comment">
          <label className="field-label">Комментарий</label>
          <div className="cf-comment-box">
            {comment ??
              'Привет! Очень откликнулся ваш запрос. У нас сейчас готовится новый проект под сезон, и мы ищем постоянного участника в команду. Если вам интересно поработать в драйвовом коллективе с перспективой постоянных выступлений, давайте созвонимся'}
          </div>
        </div>
      </div>

      <div className="cf-cta">
        <PrimaryButton onClick={() => nav(next)}>{ctaLabel}</PrimaryButton>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`cf-row ${strong ? 'cf-row--strong' : ''}`}>
      <span className="muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
