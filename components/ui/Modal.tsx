// components/ui/Modal.tsx
// URL-driven modal: the server decides whether it renders (via search params);
// this client shell only handles dismissal (Escape / backdrop / X → closeHref)
// and body scroll lock. Content is ordinary server-rendered children.

'use client';

// ============= IMPORTS =============
import { useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Modal.module.css';

// ============= TYPES =============
type Props = {
  title: string;
  closeHref: string;
  children: React.ReactNode;
};

// ============= COMPONENT =============
export function Modal({ title, closeHref, children }: Props) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(closeHref);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [router, closeHref]);

  return (
    <div
      className={styles.backdrop}
      onClick={e => {
        if (e.target === e.currentTarget) router.push(closeHref);
      }}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <Link href={closeHref} className={styles.close} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
