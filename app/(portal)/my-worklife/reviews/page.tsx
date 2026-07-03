// app/(portal)/my-worklife/reviews/page.tsx

// ============= IMPORTS =============
import { requireSession } from '@/lib/auth';
import { listReviews, type Review, type ReviewStatus } from '@/lib/db/performance';
import { listUsers, type User } from '@/lib/db/users';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusPill } from '@/components/ui/StatusPill';
import { createReviewAction, saveSelfAssessmentAction, submitReviewAction, finalizeReviewAction } from '../actions';

// ============= HELPERS =============
const STATUS_TONE: Record<ReviewStatus, 'green' | 'amber' | 'red'> = {
  draft: 'amber',
  submitted: 'amber',
  finalized: 'green',
};

const textareaStyle = { padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' } as React.CSSProperties;
const selectStyle = { padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface-strong)', fontSize: '14px' } as React.CSSProperties;

// ============= PAGE =============
export default async function ReviewsPage() {
  const user = await requireSession();
  const users = await listUsers();
  const userMap = new Map(users.map(u => [u.id, u]));

  const myReviews = (await listReviews(user.id)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  // ============= TEAM: reports with submitted reviews =============
  const reports = users.filter(u => u.managerId === user.id);
  const teamSubmitted: Array<{ report: User; review: Review }> = [];
  for (const report of reports) {
    const reviews = await listReviews(report.id);
    for (const review of reviews.filter(r => r.status === 'submitted')) {
      teamSubmitted.push({ report, review });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Reviews</h1>

      {/* ============= START NEW SELF-REVIEW ============= */}
      <GlassPanel className="max-w-xl">
        <h2 className="text-lg font-semibold mb-4">Start a self-review</h2>
        <form action={createReviewAction} className="flex items-end gap-2">
          <Input name="cycle" label="Review cycle" placeholder="2026 Mid-Year" required maxLength={120} />
          <Button type="submit">Create</Button>
        </form>
      </GlassPanel>

      {/* ============= MY REVIEWS ============= */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">My reviews</h2>
        {myReviews.length === 0 ? (
          <GlassPanel>
            <p className="text-sm text-text-muted">No reviews yet. Start one above.</p>
          </GlassPanel>
        ) : (
          myReviews.map(r => (
            <GlassPanel key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">{r.cycle}</h3>
                  <p className="text-xs text-text-muted">Updated {new Date(r.updatedAt).toLocaleString()}</p>
                </div>
                <StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill>
              </div>

              {(r.status === 'draft' || r.status === 'submitted') && (
                <form action={saveSelfAssessmentAction} className="flex flex-col gap-3 mt-4">
                  <input type="hidden" name="reviewId" value={r.id} />
                  <label className="text-sm font-medium">Self-assessment</label>
                  <textarea
                    name="selfAssessment"
                    rows={4}
                    maxLength={5000}
                    defaultValue={r.selfAssessment}
                    // eslint-disable-next-line react/forbid-dom-props
                    style={textareaStyle}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" variant="secondary">Save</Button>
                  </div>
                </form>
              )}

              {r.status === 'draft' && (
                <form action={submitReviewAction} className="mt-3">
                  <input type="hidden" name="reviewId" value={r.id} />
                  <Button type="submit" size="sm">Submit for review</Button>
                </form>
              )}

              {r.status === 'finalized' && (
                <div className="mt-4 flex flex-col gap-1 text-sm">
                  {r.selfAssessment && <p className="text-text-muted whitespace-pre-line">{r.selfAssessment}</p>}
                  <p><strong>Manager rating:</strong> {r.managerRating ?? '—'} / 5</p>
                  {r.managerNotes && <p className="text-text-muted whitespace-pre-line"><strong>Notes:</strong> {r.managerNotes}</p>}
                  {r.managerId && <p className="text-xs text-text-muted">Finalized by {userMap.get(r.managerId)?.displayName ?? r.managerId}</p>}
                </div>
              )}
            </GlassPanel>
          ))
        )}
      </section>

      {/* ============= TEAM REVIEWS ============= */}
      {reports.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Team reviews</h2>
          {teamSubmitted.length === 0 ? (
            <GlassPanel>
              <p className="text-sm text-text-muted">No submitted reviews from your team right now.</p>
            </GlassPanel>
          ) : (
            teamSubmitted.map(({ report, review }) => (
              <GlassPanel key={review.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold">{report.displayName}</h3>
                    <p className="text-sm text-text-muted">{review.cycle}</p>
                  </div>
                  <StatusPill tone={STATUS_TONE[review.status]}>{review.status}</StatusPill>
                </div>

                {review.selfAssessment && (
                  <p className="text-sm text-text-muted whitespace-pre-line mt-3">{review.selfAssessment}</p>
                )}

                <form action={finalizeReviewAction} className="flex flex-col gap-3 mt-4 max-w-md">
                  <input type="hidden" name="userId" value={report.id} />
                  <input type="hidden" name="reviewId" value={review.id} />
                  <label className="text-sm font-medium">Rating</label>
                  <select
                    name="rating"
                    defaultValue="3"
                    required
                    // eslint-disable-next-line react/forbid-dom-props
                    style={selectStyle}
                  >
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    name="notes"
                    rows={3}
                    maxLength={5000}
                    // eslint-disable-next-line react/forbid-dom-props
                    style={textareaStyle}
                  />
                  <Button type="submit" size="sm" className="self-start">Finalize</Button>
                </form>
              </GlassPanel>
            ))
          )}
        </section>
      )}
    </div>
  );
}
