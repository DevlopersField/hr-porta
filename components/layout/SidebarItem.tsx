/* eslint-disable @typescript-eslint/no-explicit-any */
// components/layout/SidebarItem.tsx

// ============= IMPORTS =============
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import styles from './Sidebar.module.css';

// ============= TYPES =============
type Props = { href: string; label: string; iconName: string; nested?: boolean };

// ============= COMPONENT =============
export function SidebarItem({ href, label, iconName, nested = false }: Props) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');
  const Icon = (Icons as any)[iconName] ?? Icons.Circle;
  return (
    <Link
      href={href}
      className={`${styles.item} ${isActive ? styles.active : ''} ${nested ? styles.nested : ''}`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}
