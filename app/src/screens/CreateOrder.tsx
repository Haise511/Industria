import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextArea, TextInput } from '../components/Field';
import { ArrowDown2 } from 'iconsax-react';
import './CreateOrder.css';

export function CreateOrder() {
  const nav = useNavigate();
  const [mode, setMode] = useState<'normal' | 'toi'>('normal');
  return (
    <div className="screen create">
      <TopBar variant="close" />
      <div className="create-pad">
        <h1 className="h1 create-title">Создать заявку</h1>

        <div className="create-stack">
          <div>
            <div className="field-box create-textarea">
              <TextArea placeholder="Кратко опишите заявку" maxLength={280} />
              <span className="field-counter">0/280</span>
            </div>
          </div>

          <div className="field-box">
            <TextInput placeholder="Укажите точную сумму" inputMode="numeric" />
          </div>

          <button className="create-select">
            <span className="muted">Выберите город</span>
            <Chevron />
          </button>

          <div className="create-modes">
            <button
              className={`create-mode ${mode === 'normal' ? 'is-active' : ''}`}
              onClick={() => setMode('normal')}
            >
              <span className="create-mode-dot" /> Обычный
            </button>
            <button
              className={`create-mode ${mode === 'toi' ? 'is-active' : ''}`}
              onClick={() => setMode('toi')}
            >
              <span className="create-mode-dot create-mode-dot--alt" /> Тойский
            </button>
          </div>
        </div>
      </div>

      <div className="create-cta">
        <PrimaryButton onClick={() => nav('/create/date')}>Далее</PrimaryButton>
      </div>
    </div>
  );
}

function Chevron() {
  return <ArrowDown2 size={14} color="#fff" variant="Linear" />;
}
