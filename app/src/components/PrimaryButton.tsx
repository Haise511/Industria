import { ButtonHTMLAttributes } from 'react';
import { haptic } from '../telegram';
import './PrimaryButton.css';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  full?: boolean;
}

/**
 * The Figma "button" component — solid pill, brand color, 16/500 white text,
 * radius 96. Default `full` makes it span the screen width (used at bottom of
 * forms). Ghost variant for secondary actions.
 */
export function PrimaryButton({ variant = 'primary', full = true, onClick, children, ...rest }: Props) {
  return (
    <button
      className={`pbtn pbtn--${variant} ${full ? 'pbtn--full' : ''}`}
      onClick={(e) => {
        haptic('medium');
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
