// components/settings/ImageUpload.tsx

// ============= IMPORTS =============
'use client';
import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============= TYPES =============
type Props = {
  label: string;
  purpose: 'logo' | 'favicon' | 'hero' | 'avatar';
  currentUrl: string | null;
  onUpload: (formData: FormData) => Promise<{ url: string }>;
  onClear?: () => Promise<void>;
};

// ============= COMPONENT =============
export function ImageUpload({ label, purpose, currentUrl, onUpload, onClear }: Props) {
  // ============= STATE =============
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [error, setError] = useState<string | null>(null);

  // ============= HANDLER =============
  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('purpose', purpose);
    startTransition(async () => {
      try {
        const result = await onUpload(fd);
        setPreview(result.url);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  function handleClear() {
    if (!onClear) return;
    startTransition(async () => {
      await onClear();
      setPreview(null);
    });
  }

  // ============= RENDER =============
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt={label}
              width={96}
              height={96}
              unoptimized
              className="rounded-md border"
              // eslint-disable-next-line react/forbid-dom-props
              style={{ objectFit: 'contain' } as React.CSSProperties}
            />
            {onClear && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute -top-2 -right-2"
                aria-label="Clear image"
                // eslint-disable-next-line react/forbid-dom-props
                style={{
                  background: '#DC2626',
                  color: 'white',
                  borderRadius: 'var(--radius-md)',
                  padding: '4px',
                  border: 'none',
                  cursor: 'pointer',
                } as React.CSSProperties}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ) : (
          <div
            // eslint-disable-next-line react/forbid-dom-props
            style={{
              width: '96px',
              height: '96px',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--color-text-muted)',
            } as React.CSSProperties}
          >
            <Upload size={28} />
          </div>
        )}
        <label className="cursor-pointer">
          <Button type="button" variant="secondary" disabled={pending}>
            {pending ? 'Uploading...' : preview ? 'Replace' : 'Upload'}
          </Button>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleSelect}
            hidden
          />
        </label>
      </div>
      {error && (
        <p
          className="text-sm"
          // eslint-disable-next-line react/forbid-dom-props
          style={{ color: '#DC2626' } as React.CSSProperties}
        >
          {error}
        </p>
      )}
    </div>
  );
}
