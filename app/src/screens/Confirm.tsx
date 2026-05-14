import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import './Confirm.css';

/**
 * "Проверьте данные" — final confirmation before submitting an отклик/заявка.
 * Same layout used both in respond and create flows.
 *
 * Layout (Figma «Создать заявку / Проверьте данные»):
 *   1) Title "Проверьте данные"
 *   2) "Описание" label + body text (the actual order description for the
 *      create flow, or the responder's comment for the respond flow)
 *   3) Info card: Тип работы / Город / Дата / Режим / Прайс
 *   4) Primary CTA ("Опубликовать" for create, "Отправить отклик" for
 *      respond)
 */
interface ConfirmProps {
  ctaLabel?: string;
  /** Body text shown under the «Описание» label. */
  comment?: string;
  next?: string;
}

const DEFAULT_DESCRIPTION =
  'Нужен артист, который поет в эстрадном стиле, уверенно держится на сцене, умеет создавать атмосферу праздника и зажечь танцпол! Ищем харизматичного профи с мощным вокалом и живой энергетикой для ярких шоу. Если ты мастер импровизации и любишь публику — мы ждем тебя в команду!';

export function Confirm({ ctaLabel = 'Отправить отклик', comment, next = '/feed' }: ConfirmProps) {
  const nav = useNavigate();
  return (
    <div className="screen cf">
      <TopBar variant="back" />
      <div className="cf-pad">
        <h1 className="h1 cf-title">Проверьте данные</h1>

        <section className="cf-section">
          <h3 className="cf-section-title">Описание</h3>
          <p className="cf-text">{comment ?? DEFAULT_DESCRIPTION}</p>
        </section>

        <div className="cf-card">
          <Row label="Тип работы" value="По договору" iconRight="📝" />
          <Row label="Город" value="Бишкек" />
          <Row label="Дата" value="8-11 апреля" />
          <Row label="Режим" value="Обычный" />
          <Row label="Прайс" value="23 900 сом" />
        </div>
      </div>

      <div className="cf-cta">
        <PrimaryButton onClick={() => nav(next)}>{ctaLabel}</PrimaryButton>
      </div>
    </div>
  );
}

function Row({ label, value, iconRight }: { label: string; value: string; iconRight?: string }) {
  return (
    <div className="cf-row">
      <span className="cf-row-label">{label}</span>
      <span className="cf-row-val">
        {iconRight && <span aria-hidden>{iconRight}</span>}
        {value}
      </span>
    </div>
  );
}
