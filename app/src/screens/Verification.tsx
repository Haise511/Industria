import { useNavigate } from 'react-router-dom';
import { BottomSheetShell } from '../components/BottomSheetShell';
import { PrimaryButton } from '../components/PrimaryButton';
import './Verification.css';

/**
 * "Верификация" — bottom-sheet modal. In Figma it sits over the notifications
 * screen, so /verification mounts Notifications as its background layer
 * (configured in App.tsx via SHEET_BG).
 */
export function Verification() {
  const nav = useNavigate();
  return (
    <BottomSheetShell
      title="Верификация"
      closeTo="/notifications"
      cta={
        <PrimaryButton onClick={() => nav(-1)}>Заказать верификацию</PrimaryButton>
      }
    >
      <p className="vrf-text">
        Верификация помогает нам убедиться, что это действительно вы, и защитит
        ваш аккаунт. Наш менеджер свяжется с вами в течение 72 часов, чтобы
        обсудить детали и завершить процесс.
      </p>
    </BottomSheetShell>
  );
}
