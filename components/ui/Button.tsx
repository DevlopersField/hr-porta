// components/ui/Button.tsx

// ============= IMPORTS =============
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import styles from './Button.module.css';

// ============= TYPES =============
type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

// ============= COMPONENT =============
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: Props) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
