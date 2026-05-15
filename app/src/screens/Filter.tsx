import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArrowDown2 } from 'iconsax-react';
import { haptic } from '../telegram';
import { filterStore } from '../store/filterStore';
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

const SORT_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'default', label: 'По умолчанию' },
  { id: 'newest', label: 'Сначала новые' },
  { id: 'price-desc', label: 'Дороже' },
  { id: 'price-asc', label: 'Дешевле' },
  { id: 'rating', label: 'По рейтингу' },
];

const CITIES = ['Бишкек', 'Алматы', 'Ташкент', 'Москва', 'Ош'];

export function Filter() {
  const nav = useNavigate();
  const loc = useLocation();
  const isSort = loc.pathname.startsWith('/sort');

  const saved = filterStore.get();
  const [selectedRole, setSelectedRole] = useState<string | null>(saved.role);
  const [contract, setContract] = useState(saved.contract);
  const [minRating, setMinRating] = useState<number | null>(saved.minRating);
  const [city, setCity] = useState<string | null>(saved.city);
  const [sort, setSort] = useState<string>(saved.sort);

  function applySort() {
    haptic('light');
    filterStore.set({ sort });
    nav(-1);
  }

  function applyFilter() {
    haptic('light');
    filterStore.set({ role: selectedRole, contract, minRating, city });
    nav(-1);
  }

  function reset() {
    haptic('light');
    filterStore.reset();
    setSelectedRole(null);
    setContract(false);
    setMinRating(null);
    setCity(null);
    setSort('default');
  }

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
                onClick={() => { haptic('light'); setSort(o.id); }}
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
          <PrimaryButton onClick={applySort}>Выбрать</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="screen flt">
      <TopBar variant="back" rightAction={{ label: 'Сбросить', onClick: reset }} />
      <div className="flt-pad">
        <h1 className="h1-page flt-title">Фильтр</h1>

        <Section title="Роль">
          <div className="flt-roles">
            {ROLES.map((r) => (
              <button
                key={r.id}
                className={`flt-role ${selectedRole === r.id ? 'is-active' : ''}`}
                onClick={() => { haptic('light'); setSelectedRole(selectedRole === r.id ? null : r.id); }}
              >
                <span className="flt-role-img" aria-hidden>
                  <img src={r.img} alt="" />
                </span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Город">
          <div className="field-box flt-select-wrap">
            <select
              className="flt-select-control"
              value={city ?? ''}
              onChange={(e) => setCity(e.target.value || null)}
            >
              <option value="">Любой</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <Chev />
          </div>
        </Section>

        <Toggle label="Работает по договору" checked={contract} onToggle={() => { haptic('light'); setContract(v => !v); }} />

        <Section title="Рейтинг от">
          <div className="flt-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`flt-star ${(minRating ?? 0) >= n ? 'is-on' : ''}`}
                onClick={() => { haptic('light'); setMinRating(minRating === n ? null : n); }}
              >
                ★ {n}
              </button>
            ))}
          </div>
        </Section>
      </div>

      <div className="flt-cta">
        <PrimaryButton onClick={applyFilter}>Подтвердить</PrimaryButton>
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
