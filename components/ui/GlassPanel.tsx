// components/ui/GlassPanel.tsx

// ============= IMPORTS =============
import type { HTMLAttributes, PropsWithChildren } from 'react';
import styles from './GlassPanel.module.css';

// ============= TYPES =============
type Props = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  variant?: 'default' | 'strong';
};

// ============= COMPONENT =============
export function GlassPanel({ children, variant = 'default', className = '', ...rest }: Props) {
  const variantClass = variant === 'strong' ? styles.strong : styles.default;
  return (
    <div className={`${styles.panel} ${variantClass} ${className}`} {...rest}>
      {children}
    </div>
  );
}
