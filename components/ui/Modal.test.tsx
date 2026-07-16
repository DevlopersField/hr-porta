// components/ui/Modal.test.tsx

// ============= IMPORTS =============
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Modal } from './Modal';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// ============= TESTS =============
describe('Modal', () => {
  it('renders title and children inside a dialog', () => {
    const html = renderToStaticMarkup(
      <Modal title="Log time" closeHref="/attendance/timesheet">
        <p>form body</p>
      </Modal>,
    );
    expect(html).toContain('Log time');
    expect(html).toContain('form body');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it('renders a close link pointing at closeHref', () => {
    const html = renderToStaticMarkup(
      <Modal title="Edit entry" closeHref="/attendance/timesheet?week=2026-07-13">
        <p>body</p>
      </Modal>,
    );
    expect(html).toContain('href="/attendance/timesheet?week=2026-07-13"');
    expect(html).toContain('aria-label="Close"');
  });

  it('labels the dialog with the title', () => {
    const html = renderToStaticMarkup(
      <Modal title="New project" closeHref="/x">
        <p>body</p>
      </Modal>,
    );
    expect(html).toMatch(/aria-labelledby="[^"]+"/);
  });
});
