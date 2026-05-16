import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown2, Edit2, Add } from 'iconsax-react';
import { TopBar } from '../components/TopBar';
import { TextArea, TextInput } from '../components/Field';
import { api, type ProfileLink } from '../api';
import { useAuth } from '../context/AuthContext';
import { KG_CITIES } from '../constants/cities';
import { haptic } from '../telegram';
import avatarMainImg from '../assets/figma/avatar_main.png';
import './ProfileEdit.css';

const BIO_MAX = 280;

/**
 * Экран редактирования профиля — соответствует design-refs/Личное.png.
 *
 * Поля:
 *   - аватар + кнопка-карандаш (загрузка вырезана — см. roadmap «Аватар»)
 *   - О себе (bio, 280 символов)
 *   - Ссылка на кейсы — список ProfileLink с «Добавить ещё»
 *   - Выберите город (KG_CITIES)
 *   - Ваше имя/псевдоним
 *   - Телеграм ник (username — read-only, тянется из Telegram)
 *   - Сохранить → PUT /profile → возврат на /profile
 *
 * Соцсети и стриминги не выведены отдельным UI в макете — оставлены поля в
 * схеме, добавим UI когда дизайн появится.
 */
export function ProfileEdit() {
  const nav = useNavigate();
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [city, setCity] = useState(user?.city ?? KG_CITIES[0]);
  const [cases, setCases] = useState<ProfileLink[]>(user?.cases ?? []);
  // Username берётся из Telegram (одностороннее поле); рендерим read-only.
  const usernameDisplay = user?.username ? `@${user.username}` : '—';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Если стор обновится за пределами экрана (например, после онбординга) —
  // подхватываем актуальные значения, но только пока не начали редактировать.
  useEffect(() => {
    if (!user) return;
    setName((prev) => (prev === '' ? user.name : prev));
    setBio((prev) => (prev === '' ? user.bio ?? '' : prev));
    setCity((prev) => (prev ? prev : user.city ?? KG_CITIES[0]));
    setCases((prev) => (prev.length === 0 && user.cases?.length ? user.cases : prev));
  }, [user]);

  // Кейсы — массив ссылок. Минимум один пустой инпут, чтобы было что заполнить.
  const caseRows = useMemo(() => (cases.length === 0 ? [{ label: '', url: '' }] : cases), [cases]);

  function updateCase(i: number, patch: Partial<ProfileLink>) {
    const next = [...caseRows];
    next[i] = { ...next[i], ...patch };
    // label оставляем равным url, пока в UI нет отдельного поля для подписи.
    if (patch.url !== undefined) next[i].label = next[i].url;
    setCases(next);
  }

  function addCase() {
    haptic('light');
    setCases([...caseRows, { label: '', url: '' }]);
  }

  async function handleSave() {
    if (!user) return;
    haptic('medium');
    setSaving(true);
    setError(null);
    try {
      const cleanCases = caseRows.filter((c) => c.url.trim());
      const updated = await api.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        city,
        cases: cleanCases,
      });
      setUser(updated);
      nav('/profile');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось сохранить';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen pedit">
      <TopBar variant="back" />
      <div className="pedit-pad">
        <div className="pedit-avatar-wrap">
          <div className="pedit-avatar">
            <img src={user?.avatarUrl ?? avatarMainImg} alt="" />
          </div>
          {/* Загрузка фото — отдельная задача (roadmap «Аватар»). Пока — кнопка-плейсхолдер. */}
          <button type="button" className="pedit-avatar-edit" aria-label="Сменить фото">
            <Edit2 size={16} color="#fff" variant="Bold" />
          </button>
        </div>

        <div className="pedit-stack">
          <Section label="О себе">
            <div className="field-box">
              <TextArea
                placeholder="Расскажите о своём опыте, стиле, оборудовании"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                maxLength={BIO_MAX}
              />
              <span className="field-counter">{bio.length}/{BIO_MAX}</span>
            </div>
          </Section>

          <Section label="Ссылка на кейсы">
            <div className="pedit-cases">
              {caseRows.map((c, i) => (
                <div className="field-box" key={i}>
                  <TextInput
                    placeholder="https://webogram.org/a/"
                    value={c.url}
                    onChange={(e) => updateCase(i, { url: e.target.value })}
                  />
                </div>
              ))}
              <button type="button" className="pedit-add" onClick={addCase}>
                <Add size={16} color="currentColor" variant="Linear" />
                <span>Добавить ещё</span>
              </button>
            </div>
          </Section>

          <Section label="Выберите город">
            <div className="field-box pedit-select">
              <select
                className="pedit-select-control"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {KG_CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ArrowDown2 size={18} color="currentColor" variant="Linear" />
            </div>
          </Section>

          <Section label="Ваше имя/псевдоним">
            <div className="field-box">
              <TextInput
                placeholder="Lil asian batya"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </Section>

          <Section label="Телеграм ник (username)">
            <div className="field-box pedit-readonly">
              <span>{usernameDisplay}</span>
            </div>
          </Section>
        </div>

        {error && <p className="pedit-error">{error}</p>}

        <div className="pedit-cta">
          <button
            type="button"
            className="pedit-submit"
            disabled={saving || !name.trim()}
            onClick={handleSave}
          >
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pedit-field">
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
