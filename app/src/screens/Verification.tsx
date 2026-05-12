import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import './Verification.css';

/**
 * "Верификация" — sheet-style modal that appears over the notifications
 * screen in Figma. We render it as a full screen here for simplicity.
 */
export function Verification() {
  const nav = useNavigate();
  return (
    <div className="screen vrf">
      <TopBar variant="close" />
      <div className="vrf-pad">
        <h1 className="h1">Верификация</h1>
        <p className="vrf-text muted">
          Верификация помогает нам убедиться, что это действительно вы, и защитит ваш аккаунт. Наш менеджер свяжется с вами в течение 72 часов,
          чтобы обсудить детали и завершить процесс
        </p>
      </div>
      <div className="vrf-cta">
        <PrimaryButton onClick={() => nav(-1)}>Заказать верификацию</PrimaryButton>
      </div>
    </div>
  );
}
