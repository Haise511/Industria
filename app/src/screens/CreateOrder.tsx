import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BottomSheetShell } from '../components/BottomSheetShell';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextArea, TextInput } from '../components/Field';
import { ArrowDown2 } from 'iconsax-react';
import { haptic } from '../telegram';
import { KG_CITIES } from '../constants/cities';
import './CreateOrder.css';

const CITIES = KG_CITIES;

export function CreateOrder() {
  const nav = useNavigate();
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [mode, setMode] = useState<'normal' | 'toi'>('normal');

  const canProceed = description.trim().length > 0 && price.trim().length > 0 && city.length > 0;

  return (
    <BottomSheetShell
      hideBack
      title="Создать заявку"
      cta={
        <PrimaryButton
          disabled={!canProceed}
          onClick={() => {
            haptic('light');
            nav('/create/date', { state: { description, price: Number(price), city, mode } });
          }}
        >
          Далее
        </PrimaryButton>
      }
    >
      <div className="create-stack">
        <div className="field-box create-textarea">
          <TextArea
            placeholder="Кратко опишите заявку"
            maxLength={280}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <span className="field-counter">{description.length}/280</span>
        </div>

        <div className="field-box">
          <TextInput
            placeholder="Укажите точную сумму"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        <div className={`field-box create-select-wrap${city ? '' : ' is-placeholder'}`}>
          <select
            className="create-select-control"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="" disabled hidden>Выберите город</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ArrowDown2 size={14} color="#fff" variant="Linear" />
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
    </BottomSheetShell>
  );
}
