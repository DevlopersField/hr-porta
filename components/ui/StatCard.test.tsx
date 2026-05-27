// components/ui/StatCard.test.tsx

// ============= IMPORTS =============
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatCard } from './StatCard';

// ============= TESTS =============
describe('StatCard', () => {
  it('renders label and value', () => {
    const html = renderToStaticMarkup(<StatCard label="Total Users" value={24} />);
    expect(html).toContain('Total Users');
    expect(html).toContain('24');
  });

  it('renders delta when provided', () => {
    const html = renderToStaticMarkup(
      <StatCard label="Users" value={24} delta="+5 from last month" deltaTone="green" />
    );
    expect(html).toContain('+5 from last month');
  });

  it('applies featured class when featured', () => {
    const html = renderToStaticMarkup(<StatCard label="Total" value={42} featured />);
    expect(html).toMatch(/featured/);
  });

  it('renders hint when provided and not featured', () => {
    const html = renderToStaticMarkup(<StatCard label="Approvals" value={3} hint="awaiting review" />);
    expect(html).toContain('awaiting review');
  });
});
