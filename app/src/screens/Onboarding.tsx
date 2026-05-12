import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextArea } from '../components/Field';
import { Flag } from '../components/Flag';
import { InfoCircle } from 'iconsax-react';
import { haptic } from '../telegram';
// Role illustrations extracted from the Figma file (image fills on nodes
// 14:3313 / 14:3320 / 14:3327 / 14:3334) — these are not iconsax glyphs but
// custom isometric illustrations baked into the design.
import roleArtistImg from '../assets/figma/role_artist.png';
import roleStudioImg from '../assets/figma/role_studio.png';
import roleComposerImg from '../assets/figma/role_composer.png';
import roleCustomerImg from '../assets/figma/role_customer.png';
import loaderLogoImg from '../assets/figma/loader_logo.png';
import './Onboarding.css';

/**
 * Step 1: language selection. Progress 1/4.
 */
export function OnbLanguage() {
  const nav = useNavigate();
  const langs: Array<{ code: 'ru' | 'kg' | 'kz' | 'uz'; label: string }> = [
    { code: 'ru', label: 'Русский' },
    { code: 'kg', label: 'Кыргызча' },
    { code: 'kz', label: 'Казакша' },
    { code: 'uz', label: "O'zbekcha" },
  ];
  return (
    <div className="screen">
      <TopBar variant="close" onLeft={() => nav('/')} />
      <Progress step={1} total={4} />
      <div className="onb-pad">
        <div className="onb-head">
          <h1 className="h1">Выберите язык приложения</h1>
          <p className="onb-sub">Позже его можно поменять в настройках</p>
        </div>
        <div className="onb-list">
          {langs.map((l) => (
            <button
              key={l.code}
              className="onb-row"
              onClick={() => {
                haptic('light');
                nav('/onboarding/role');
              }}
            >
              {/* Flag is a 32x32 SVG icon, matching the Figma "Flag Pack"
                  instance dimensions. */}
              <span className="onb-flag" aria-hidden>
                <Flag code={l.code} />
              </span>
              <span className="onb-row-label">{l.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Step 2: role selection. Uses the four Figma image fills as flat
 *  illustrations (no iconsax substitution — Figma intentionally uses bespoke
 *  isometric art). */
export function OnbRole() {
  const nav = useNavigate();
  const roles = [
    { id: 'artist', label: 'Артист', desc: 'Музыкант, певец, DJ, группа', img: roleArtistImg },
    { id: 'studio', label: 'Студия', desc: 'Пространство, оснащенное оборудованием для качественной записи и мастеринга звука', img: roleStudioImg },
    { id: 'composer', label: 'Композитор', desc: 'Битмейкер, композитор, аранжировщик', img: roleComposerImg },
    { id: 'customer', label: 'Заказчик', desc: 'Любой человек или организация, которой нужна музыкальная услуга', img: roleCustomerImg },
  ];
  return (
    <div className="screen">
      <TopBar variant="close" onLeft={() => nav('/')} />
      <Progress step={2} total={4} />
      <div className="onb-pad">
        <div className="onb-head">
          <h1 className="h1">Выберите свою роль</h1>
          <p className="onb-sub">На данный момент вы можете выбрать только одну</p>
        </div>
        <div className="onb-list">
          {roles.map((r) => (
            <button key={r.id} className="onb-row onb-row--col" onClick={() => { haptic('light'); nav('/onboarding/profile'); }}>
              <span className="onb-role-illu" aria-hidden>
                <img src={r.img} alt="" />
              </span>
              <div className="onb-row-text">
                <span className="onb-row-title">{r.label}</span>
                <span className="onb-row-desc">{r.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Step 3: profile fill. */
export function OnbProfile() {
  const nav = useNavigate();
  return (
    <div className="screen">
      <TopBar variant="close" onLeft={() => nav('/')} />
      <Progress step={3} total={4} />
      <div className="onb-pad">
        <div className="onb-head">
          <h1 className="h1">Заполните профиль</h1>
          <p className="onb-sub">Эти данные нужны чтобы настроить ленту</p>
        </div>

        <div className="onb-avatar-wrap">
          <div className="onb-avatar" aria-hidden>
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
              <circle cx="22" cy="26" r="2" fill="#fff" opacity=".7" />
              <circle cx="38" cy="26" r="2" fill="#fff" opacity=".7" />
              <path d="M21 36c2 3 5 4 9 4s7-1 9-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".7" />
            </svg>
          </div>
          <button className="onb-avatar-btn" onClick={() => haptic('light')}>Загрузить фото</button>
        </div>

        <div className="onb-stack">
          <div>
            <label className="field-label">О себе (необязательно)</label>
            <div className="field-box">
              <TextArea placeholder="Немного о своем опыте" maxLength={280} />
              <span className="field-counter">0/280</span>
            </div>
          </div>

          <div>
            <label className="field-label">Договор</label>
            <button className="onb-check">
              <span className="onb-check-circle" />
              <span>Готов работать по договору</span>
            </button>
            <div className="onb-info">
              <InfoIcon /> <span className="muted">Про договор</span>
            </div>
          </div>
        </div>

        <div className="onb-cta">
          <PrimaryButton onClick={() => nav('/onboarding/loading')}>Продолжить</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

/** Loading splash — used both at app entry (`/` and `/loading`) and at the end
 * of profile setup. Auto-advances after ~1.5s. */
export function OnbLoading() {
  const nav = useNavigate();
  // useEffect ensures the timer fires once on mount and is cleared if the
  // component unmounts before the timeout (avoids the Strict-Mode double-fire
  // and the dangling-timer warning).
  useEffect(() => {
    const id = setTimeout(() => nav('/onboarding/language'), 1500);
    return () => clearTimeout(id);
  }, [nav]);
  return (
    <div className="onb-splash">
      <div className="onb-splash-center">
        {/* Logo extracted from Figma (image fill on node 1:5983 — "Индустрия Лого00 1") */}
        <img src={loaderLogoImg} className="onb-splash-logo" alt="Индустрия" />
        <h2 className="onb-splash-title">От идеи<br />до гонорара</h2>
      </div>
    </div>
  );
}

function Progress({ step, total }: { step: number; total: number }) {
  const pct = (step / total) * 100;
  return (
    <div className="onb-progress">
      <div className="onb-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function InfoIcon() {
  return <InfoCircle size={14} color="currentColor" variant="Linear" />;
}
