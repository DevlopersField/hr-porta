// components/ui/Input.tsx

// ============= IMPORTS =============
import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

// ============= TYPES =============
type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };

// ============= COMPONENT =============
export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, className = '', id, ...rest },
  ref,
) {
  const inputId = id ?? `inp_${rest.name ?? Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className={styles.wrap}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <input
        id={inputId}
        ref={ref}
        className={`${styles.input} ${error ? styles.errorBorder : ''} ${className}`}
        {...rest}
      />
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
});
