import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextArea, TextInput } from '../components/Field';
import { Flag } from '../components/Flag';
import { ArrowDown2, InfoCircle, TickCircle } from 'iconsax-react';
import { haptic, getTg } from '../telegram';
import { api, setToken } from '../api';
import { useAuth } from '../context/AuthContext';
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
                nav('/onboarding/role', { state: { language: l.code } });
              }}
              type="button"
            >
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
  const loc = useLocation();
  const prev = (loc.state ?? {}) as Record<string, string>;
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
            <button key={r.id} className="onb-row onb-row--col" onClick={() => {
              haptic('light');
              nav('/onboarding/basic', { state: { ...prev, role: r.id } });
            }}>
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

/**
 * Step 3: основные данные — name, telegram username, city, mode.
 * Mirrors Figma frame 1:5859 "Заполните основные данные" (progress 3/4).
 */
export function OnbBasicData() {
  const nav = useNavigate();
  const loc = useLocation();
  const prev = (loc.state ?? {}) as Record<string, string>;
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('Бишкек');
  const [mode, setMode] = useState<'normal' | 'toi'>('normal');
  return (
    <div className="screen">
      <TopBar variant="close" onLeft={() => nav('/')} />
      <Progress step={3} total={4} />
      <div className="onb-pad">
        <div className="onb-head">
          <h1 className="h1">Заполните основные данные</h1>
          <p className="onb-sub">Эти данные нужны чтобы настроить ленту</p>
        </div>

        <div className="onb-stack onb-stack--basic">
          <div>
            <label className="field-label">Ваше имя/псевдоним</label>
            <div className="field-box">
              <TextInput
                placeholder="Lil asian batya"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Телеграм ник (username)</label>
            <div className="field-box">
              <TextInput
                placeholder="@example"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Выберите город</label>
            {/* Native <select> styled to match the design — picker UX is
                delegated to the OS so it matches what Telegram users expect. */}
            <div className="field-box onb-select">
              <select
                className="onb-select-control"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                <option>Бишкек</option>
                <option>Алматы</option>
                <option>Ташкент</option>
                <option>Москва</option>
              </select>
              <ArrowDown2 size={18} color="currentColor" variant="Linear" />
            </div>
          </div>

          <div>
            <label className="field-label">Режим</label>
            <div className="onb-segment" role="tablist">
              <button
                type="button"
                className={`onb-seg-btn ${mode === 'normal' ? 'is-active' : ''}`}
                onClick={() => { haptic('light'); setMode('normal'); }}
              >
                <span aria-hidden>🎵</span>
                <span>Обычный</span>
              </button>
              <button
                type="button"
                className={`onb-seg-btn ${mode === 'toi' ? 'is-active' : ''}`}
                onClick={() => { haptic('light'); setMode('toi'); }}
              >
                <span aria-hidden>🪕</span>
                <span>Тойский</span>
              </button>
            </div>
            <p className="onb-mode-hint">
              <InfoIcon />
              <span>
                <b>Обычный</b>: Современная музыкальная индустрия — запись,
                клипы, продакшн.<br />
                <b>Той</b>: Тойская индустрия — свадьбы, юбилеи, мероприятия,
                выступления.
              </span>
            </p>
          </div>
        </div>

        <div className="onb-cta">
          <PrimaryButton onClick={() => nav('/onboarding/profile', { state: { ...prev, name, username, city, mode } })}>Продолжить</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

/** Step 4: profile fill. */
export function OnbProfile() {
  const nav = useNavigate();
  const loc = useLocation();
  const { setUser } = useAuth();
  const prev = (loc.state ?? {}) as Record<string, string>;
  const [bio, setBio] = useState('');
  const [contract, setContract] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    haptic('light');
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        name: prev.name,
        role: prev.role as 'artist' | 'customer' | 'studio' | 'composer',
        city: prev.city,
        language: prev.language,
        bio: bio || undefined,
        contract,
      });
      setUser(updated);
      nav('/onboarding/loading', { replace: true });
    } catch {
      nav('/onboarding/loading', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen">
      <TopBar variant="close" onLeft={() => nav('/')} />
      <Progress step={4} total={4} />
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
              <TextArea placeholder="Немного о своем опыте" maxLength={280} value={bio} onChange={(e) => setBio(e.target.value)} />
              <span className="field-counter">{bio.length}/280</span>
            </div>
          </div>

          <div>
            <label className="field-label">Договор</label>
            <button className="onb-check" onClick={() => { haptic('light'); setContract(c => !c); }}>
              <span className={`onb-check-circle${contract ? ' is-checked' : ''}`} />
              <span>Готов работать по договору</span>
            </button>
            <div className="onb-info">
              <InfoIcon /> <span className="muted">Про договор</span>
            </div>
          </div>
        </div>

        <div className="onb-cta">
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Продолжить'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

/** Loading splash — Figma frame "Загрузка" (1:5957). Brand-purple aurora
 *  background (1:5958 + blurred ellipses 1:5959/60/61 + mint vector 1:5962),
 *  centered logo (1:5983) + "От идеи до гонорара" Bold/28 (1:5985).
 *
 *  Same screen serves two flows:
 *    - app entry (`/`, `/loading`) → advances to `/onboarding/language`
 *    - end of profile setup (`/onboarding/loading`) → advances to `/feed`
 *  Branch by current path so we don't loop back into onboarding. */
export function OnbLoading() {
  const nav = useNavigate();
  const loc = useLocation();
  const { setAuth } = useAuth();

  useEffect(() => {
    // After onboarding completes — just go to feed.
    if (loc.pathname === '/onboarding/loading') {
      const id = setTimeout(() => nav('/feed', { replace: true }), 800);
      return () => clearTimeout(id);
    }

    // App entry — authenticate with Telegram and route accordingly.
    const initData = getTg()?.initData ?? '';
    if (!initData) {
      // Dev mode: no Telegram context, skip auth and go straight to onboarding.
      const id = setTimeout(() => nav('/onboarding/language', { replace: true }), 1500);
      return () => clearTimeout(id);
    }

    let cancelled = false;
    api.auth(initData)
      .then(({ token, user, isNew }) => {
        if (cancelled) return;
        setToken(token);
        setAuth(user, token);
        nav(isNew ? '/onboarding/language' : '/feed', { replace: true });
      })
      .catch(() => {
        if (!cancelled) nav('/onboarding/language', { replace: true });
      });

    return () => { cancelled = true; };
  }, [nav, loc.pathname, setAuth]);
  return (
    <div className="onb-splash">
      {/* Aurora background — four heavily-blurred colored blobs over a brand
          purple base, recreating the Figma "Gradient" frame and its three
          blue ellipses plus mint vector. Pure CSS, no extra assets. */}
      <div className="onb-splash-aurora" aria-hidden>
        <span className="onb-splash-blob onb-splash-blob--a" />
        <span className="onb-splash-blob onb-splash-blob--b" />
        <span className="onb-splash-blob onb-splash-blob--c" />
        <span className="onb-splash-blob onb-splash-blob--mint" />
      </div>
      <div className="onb-splash-center">
        <img src={loaderLogoImg} className="onb-splash-logo" alt="Индустрия" />
        <h2 className="onb-splash-title">От идеи<br />до гонорара</h2>
      </div>
    </div>
  );
}

/**
 * «Язык приложения» — settings variant of the language picker, reachable
 * from Profile. Re-uses the same row visuals as the onboarding step but
 * with a back-arrow TopBar, no progress bar, a check-mark on the active
 * row, and a primary «Сохранить» CTA. Mirrors design-refs/Язык
 * приложения.png.
 */
export function LanguageSettings() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<'ru' | 'kg' | 'kz' | 'uz'>('ru');
  const langs: Array<{ code: 'ru' | 'kg' | 'kz' | 'uz'; label: string }> = [
    { code: 'ru', label: 'Русский' },
    { code: 'kg', label: 'Кыргызча' },
    { code: 'kz', label: 'Казакша' },
    { code: 'uz', label: "O'zbekcha" },
  ];
  return (
    <div className="screen">
      <TopBar variant="back" />
      <div className="onb-pad">
        <div className="onb-head">
          <h1 className="h1">Язык приложения</h1>
        </div>
        <div className="onb-list">
          {langs.map((l) => (
            <button
              key={l.code}
              className="onb-row"
              onClick={() => { haptic('light'); setSelected(l.code); }}
              type="button"
            >
              <span className="onb-flag" aria-hidden>
                <Flag code={l.code} />
              </span>
              <span className="onb-row-label">{l.label}</span>
              {selected === l.code && (
                <span className="onb-row-check" aria-hidden>
                  {/* Bold variant renders the filled circle silhouette;
                      colored with --brand to match the Figma swatch. */}
                  <TickCircle size={22} color="#4f62ec" variant="Bold" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="onb-cta">
        <PrimaryButton onClick={() => nav(-1)}>Сохранить</PrimaryButton>
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
