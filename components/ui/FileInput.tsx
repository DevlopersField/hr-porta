// components/ui/FileInput.tsx

// ============= IMPORTS =============
// Server Component: importing from lib/uploads (node:fs) is safe here.
import { FILE_ACCEPT } from '@/lib/uploads';
import styles from './FileInput.module.css';

// ============= TYPES =============
type Props = {
  name: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  hint?: string;
};

// ============= COMPONENT =============
export function FileInput({ name, label = 'Attachments', accept = FILE_ACCEPT, multiple = true, hint }: Props) {
  return (
    <div className={styles.wrap}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} type="file" name={name} accept={accept} multiple={multiple} />
      <p className={styles.hint}>{hint ?? 'Images, PDF, DOCX, XLSX, CSV or TXT — up to 10 MB each.'}</p>
    </div>
  );
}
