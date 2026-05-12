import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import './Field.css';

interface FieldProps {
  label?: string;
  hint?: string;
  /** Right-aligned counter, e.g. "0/280" */
  counter?: string;
  children?: ReactNode;
  className?: string;
}

export function Field({ label, hint, counter, children, className }: FieldProps) {
  return (
    <div className={`field ${className ?? ''}`}>
      {label && <label className="field-label">{label}</label>}
      <div className="field-box">
        {children}
        {counter && <span className="field-counter">{counter}</span>}
      </div>
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="field-input" {...props} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="field-textarea" rows={2} {...props} />;
}
