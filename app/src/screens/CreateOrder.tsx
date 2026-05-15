import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextArea, TextInput } from '../components/Field';
import { ArrowDown2 } from 'iconsax-react';
import { haptic } from '../telegram';
import './CreateOrder.css';

const CITIES = ['Бишкек', 'Алматы', 'Ташкент', 'Москва', 'Ош', 'Кара-Балта'];

export function CreateOrder() {
  const nav = useNavigate();
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('Бишкек');
  const [mode, setMode] = useState<'normal' | 'toi'>('normal');

  const canProceed = description.trim().length > 0 && price.trim().length > 0;

  return (
    <div className="screen create">
      <TopBar variant="close" />
      <div className="create-pad">
        <h1 className="h1 create-title">Создать заявку</h1>

        <div className="create-stack">
          <div>
            <div className="field-box create-textarea">
              <TextArea
                placeholder="Кратко опишите заявку"
                maxLength={280}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <span className="field-counter">{description.length}/280</span>
            </div>
          </div>

          <div className="field-box">
            <TextInput
              placeholder="Укажите точную сумму"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="field-box create-select-wrap">
            <select
              className="create-select-control"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <Chevron />
          </div>

          <div className="create-modes">
            <button
              className={`create-mode ${mode === 'normal' ? 'is-active' : ''}`}
              onClick={() => { haptic('light'); setMode('normal'); }}
              type="button"
            >
              <span aria-hidden>🎵</span> Обычный
            </button>
            <button
              className={`create-mode ${mode === 'toi' ? 'is-active' : ''}`}
              onClick={() => { haptic('light'); setMode('toi'); }}
              type="button"
            >
              <span aria-hidden>🪕</span> Тойский
            </button>
          </div>
        </div>
      </div>

      <div className="create-cta">
        <PrimaryButton
          disabled={!canProceed}
          onClick={() => {
            haptic('light');
            nav('/create/date', { state: { description, price: Number(price), city, mode } });
          }}
        >
          Далее
        </PrimaryButton>
      </div>
    </div>
  );
}

function Chevron() {
  return <ArrowDown2 size={14} color="#fff" variant="Linear" />;
}
