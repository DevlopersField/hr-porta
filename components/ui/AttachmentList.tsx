// components/ui/AttachmentList.tsx

// ============= IMPORTS =============
import { FileText, Download } from 'lucide-react';
import styles from './AttachmentList.module.css';

// ============= TYPES =============
export type AttachmentView = {
  id: string;
  originalName: string;
  mime: string;
  size: number;
};

type Props = {
  attachments: AttachmentView[];
  // Compact mode drops image thumbnails (used in dense tables).
  compact?: boolean;
};

// ============= HELPERS =============
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string): boolean {
  return mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp';
}

// ============= COMPONENT =============
export function AttachmentList({ attachments, compact = false }: Props) {
  if (attachments.length === 0) return null;
  return (
    <ul className={styles.list}>
      {attachments.map(a => {
        const href = `/api/files/${a.id}`;
        return (
          <li key={a.id} className={styles.item}>
            <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>
              {!compact && isImage(a.mime) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={href} alt={a.originalName} className={styles.thumb} />
              ) : (
                <span className={styles.icon} aria-hidden="true"><FileText size={16} /></span>
              )}
              <span className={styles.name}>{a.originalName}</span>
              <span className={styles.size}>{formatSize(a.size)}</span>
              <span className={styles.download} aria-hidden="true"><Download size={14} /></span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
