// app/(portal)/my-worklife/profile/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { getUserById } from '@/lib/db/users';
import { getProfile } from '@/lib/db/profiles';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateMyProfileAction, updateMyAvatarAction, updateMyNameAction } from './actions';

// ============= HELPERS =============
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

// ============= PAGE =============
export default async function ProfilePage() {
  const session = await requireSession();
  const me = await getUserById(session.id);
  const profile = await getProfile(session.id);
  const manager = me?.managerId ? await getUserById(me.managerId) : null;

  const displayName = me?.displayName ?? session.name ?? session.email ?? 'Me';
  const jobTitle = me?.jobTitle ?? '';
  const department = me?.department ?? '';
  const subtitle = [jobTitle, department].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">My profile</h1>

      {/* ============= HEADER ============= */}
      <GlassPanel>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {me?.avatarPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.avatarPath}
              alt={displayName}
              width={80}
              height={80}
              // eslint-disable-next-line react/forbid-dom-props
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '999px',
                objectFit: 'cover',
                border: '1px solid var(--color-border)',
              } as React.CSSProperties}
            />
          ) : (
            <div
              // eslint-disable-next-line react/forbid-dom-props
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '999px',
                background: 'var(--color-primary)',
                color: 'white',
                display: 'grid',
                placeItems: 'center',
                fontSize: '28px',
                fontWeight: 600,
                flexShrink: 0,
              } as React.CSSProperties}
            >
              {initialsOf(displayName)}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold">{displayName}</h2>
            {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
            {manager && (
              <p className="text-sm text-text-muted">Reports to {manager.displayName}</p>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* ============= AVATAR UPLOAD ============= */}
      <GlassPanel>
        <h2 className="text-lg font-semibold">Profile photo</h2>
        <p className="text-sm text-text-muted mt-1">PNG, JPG or WebP, up to 2 MB.</p>
        <form action={updateMyAvatarAction} className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
          <input
            type="file"
            name="avatar"
            accept="image/png,image/jpeg,image/webp"
            required
            // eslint-disable-next-line react/forbid-dom-props
            style={{ fontSize: '14px' } as React.CSSProperties}
          />
          <Button type="submit" variant="secondary" size="sm" className="self-start">Upload photo</Button>
        </form>
      </GlassPanel>

      {/* ============= DISPLAY NAME (EDITABLE) ============= */}
      <GlassPanel>
        <h2 className="text-lg font-semibold">Display name</h2>
        <p className="text-sm text-text-muted mt-1">Shown across the portal (top bar, approvals, posts).</p>
        <form action={updateMyNameAction} className="flex flex-wrap items-end gap-3 mt-4">
          <Input name="displayName" label="" defaultValue={displayName} maxLength={120} required />
          <Button type="submit">Save name</Button>
        </form>
      </GlassPanel>

      {/* ============= JOB DETAILS (READ-ONLY) ============= */}
      <GlassPanel>
        <h2 className="text-lg font-semibold">Job details</h2>
        <p className="text-sm text-text-muted mt-1">Managed by HR. Contact them to make changes.</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <ReadOnlyField label="Email" value={me?.email ?? session.email ?? '—'} />
          <ReadOnlyField label="Job title" value={jobTitle || '—'} />
          <ReadOnlyField label="Department" value={department || '—'} />
          <ReadOnlyField label="Manager" value={manager?.displayName ?? '—'} />
        </dl>
      </GlassPanel>

      {/* ============= PERSONAL DETAILS (EDITABLE) ============= */}
      <GlassPanel>
        <h2 className="text-lg font-semibold">Personal details</h2>
        <form action={updateMyProfileAction} className="flex flex-col gap-4 mt-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input name="phone" label="Phone" defaultValue={profile.phone} maxLength={120} />
            <Input name="pronouns" label="Pronouns" defaultValue={profile.pronouns} maxLength={120} />
          </div>
          <Input name="dateOfBirth" type="date" label="Date of birth" defaultValue={profile.dateOfBirth} />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Address</label>
            <textarea
              name="address"
              rows={2}
              maxLength={300}
              defaultValue={profile.address}
              // eslint-disable-next-line react/forbid-dom-props
              style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' } as React.CSSProperties}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Bio</label>
            <textarea
              name="bio"
              rows={4}
              maxLength={1000}
              defaultValue={profile.bio}
              // eslint-disable-next-line react/forbid-dom-props
              style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' } as React.CSSProperties}
            />
          </div>
          {/* Preserve emergency-contact fields so a personal-details save does not blank them. */}
          <input type="hidden" name="emergencyContactName" value={profile.emergencyContactName} />
          <input type="hidden" name="emergencyContactPhone" value={profile.emergencyContactPhone} />
          <input type="hidden" name="emergencyContactRelation" value={profile.emergencyContactRelation} />
          <Button type="submit" className="self-start">Save personal details</Button>
        </form>
      </GlassPanel>

      {/* ============= EMERGENCY CONTACT (EDITABLE) ============= */}
      <GlassPanel>
        <h2 className="text-lg font-semibold">Emergency contact</h2>
        <form action={updateMyProfileAction} className="flex flex-col gap-4 mt-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input name="emergencyContactName" label="Contact name" defaultValue={profile.emergencyContactName} maxLength={120} />
            <Input name="emergencyContactRelation" label="Relationship" defaultValue={profile.emergencyContactRelation} maxLength={120} />
          </div>
          <Input name="emergencyContactPhone" label="Contact phone" defaultValue={profile.emergencyContactPhone} maxLength={120} />
          {/* Preserve personal-details fields so an emergency-contact save does not blank them. */}
          <input type="hidden" name="phone" value={profile.phone} />
          <input type="hidden" name="pronouns" value={profile.pronouns} />
          <input type="hidden" name="dateOfBirth" value={profile.dateOfBirth} />
          <input type="hidden" name="address" value={profile.address} />
          <input type="hidden" name="bio" value={profile.bio} />
          <Button type="submit" className="self-start">Save emergency contact</Button>
        </form>
      </GlassPanel>
    </div>
  );
}

// ============= READ-ONLY FIELD =============
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
