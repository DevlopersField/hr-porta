// components/ui/FileInput.tsx

// ============= IMPORTS =============
import styles from './FileInput.module.css';

// ============= CONSTANTS =============
// Kept in sync with lib/uploads FILE_ACCEPT (duplicated here to avoid pulling
// node:fs into any client boundary that renders this input).
export const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf,.pdf,.docx,.xlsx,.csv,.txt';

// ============= TYPES =============
type Props = {
  name: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  hint?: string;
};

// ============= COMPONENT =============
export function FileInput({ name, label = 'Attachments', accept = DEFAULT_ACCEPT, multiple = true, hint }: Props) {
  return (
    <div className={styles.wrap}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} type="file" name={name} accept={accept} multiple={multiple} />
      <p className={styles.hint}>{hint ?? 'Images, PDF, DOCX, XLSX, CSV or TXT — up to 10 MB each.'}</p>
    </div>
  );
}
