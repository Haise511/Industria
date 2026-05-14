import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArrowDown2 } from 'iconsax-react';
// Figma uses the same isometric illustrations on the Filter screen as on the
// Onboarding role picker. Re-use the extracted PNGs (image fills) instead of
// emoji or iconsax glyphs so the visuals match the design exactly.
import roleArtistImg from '../assets/figma/role_artist.png';
import roleStudioImg from '../assets/figma/role_studio.png';
import roleComposerImg from '../assets/figma/role_composer.png';
import roleCustomerImg from '../assets/figma/role_customer.png';
import './Filter.css';

const ROLES: Array<{ id: string; label: string; img: string }> = [
  { id: 'artist', label: 'Артист', img: roleArtistImg },
  { id: 'studio', label: 'Студия', img: roleStudioImg },
  { id: 'composer', label: 'Композитор', img: roleComposerImg },
  { id: 'customer', label: 'Заказчик', img: roleCustomerImg },
];

/** Sort options shown on `/sort` (Figma "Сотрировка" sheet, design-refs
 *  Фильтр/Сотрировка.png). Single-select radio rows + brand CTA. */
const SORT_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'default', label: 'По умолчанию' },
  { id: 'newest', label: 'Сначала новые' },
  { id: 'price-desc', label: 'Дороже' },
  { id: 'price-asc', label: 'Дешевле' },
  { id: 'rating', label: 'По рейтингу' },
];

export function Filter() {
  const nav = useNavigate();
  const loc = useLocation();
  const isSort = loc.pathname.startsWith('/sort');
  const [selectedRole, setSelectedRole] = useState<string | null>('artist');
  const [rating, setRating] = useState<number | null>(null);
  const [contract, setContract] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sort, setSort] = useState<string>('default');

  if (isSort) {
    return (
      <div className="screen flt">
        <TopBar variant="close" />
        <div className="flt-pad">
          <h1 className="h1-page flt-title">Сначала показывать</h1>
          <div className="flt-sort-list">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.id}
                className={`flt-sort-row ${sort === o.id ? 'is-active' : ''}`}
                onClick={() => setSort(o.id)}
              >
                <span className={`flt-radio ${sort === o.id ? 'is-on' : ''}`}>
                  {sort === o.id && <span className="flt-radio-dot" />}
                </span>
                <span className="flt-sort-label">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flt-cta">
          <PrimaryButton onClick={() => nav(-1)}>Выбрать</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="screen flt">
      <TopBar variant="back" />
      <div className="flt-pad">
        <h1 className="h1-page flt-title">Фильтр</h1>

        <Section title="Роль">
          <div className="flt-roles">
            {ROLES.map((r) => (
              <button
                key={r.id}
                className={`flt-role ${selectedRole === r.id ? 'is-active' : ''}`}
                onClick={() => setSelectedRole(r.id)}
              >
                <span className="flt-role-img" aria-hidden>
                  <img src={r.img} alt="" />
                </span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Средняя цена">
          <div className="flt-slider">
            <div className="flt-slider-track">
              <div className="flt-slider-fill" />
              <span className="flt-slider-thumb flt-slider-thumb--l" />
              <span className="flt-slider-thumb flt-slider-thumb--r" />
            </div>
            <div className="flt-slider-row">
              <div className="flt-slider-cell">2 000 с</div>
              <div className="flt-slider-cell">200 000 с</div>
            </div>
          </div>
        </Section>

        <button className="flt-select">
          <span className="muted">Город</span>
          <Chev />
        </button>

        <button className="flt-select">
          <span className="muted">Дата</span>
          <Chev />
        </button>

        <Toggle label="Работает по договору" checked={contract} onToggle={() => setContract((v) => !v)} />

        <Section title="Рейтинг">
          <div className="flt-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`flt-star ${(rating ?? 0) >= n ? 'is-on' : ''}`}
                onClick={() => setRating(n)}
              >
                ★ {n}
              </button>
            ))}
          </div>
        </Section>

        <Toggle label="Верифицирован" checked={verified} onToggle={() => setVerified((v) => !v)} />
      </div>

      <div className="flt-cta">
        <PrimaryButton onClick={() => nav(-1)}>Подтвердить</PrimaryButton>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flt-section">
      <h3 className="flt-section-title muted">{title}</h3>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button className="flt-toggle" onClick={onToggle}>
      <span className={`flt-toggle-circle ${checked ? 'is-on' : ''}`}>
        {checked && <span className="flt-toggle-dot" />}
      </span>
      <span>{label}</span>
    </button>
  );
}

function Chev() {
  return <ArrowDown2 size={14} color="#fff" variant="Linear" />;
}
