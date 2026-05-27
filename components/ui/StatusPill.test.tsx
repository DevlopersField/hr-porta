// components/ui/StatusPill.test.tsx

// ============= IMPORTS =============
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatusPill } from './StatusPill';

// ============= TESTS =============
describe('StatusPill', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<StatusPill tone="green">Completed</StatusPill>);
    expect(html).toContain('Completed');
  });

  it('green tone applies green class', () => {
    const html = renderToStaticMarkup(<StatusPill tone="green">x</StatusPill>);
    expect(html).toMatch(/green/i);
  });

  it('amber tone applies amber class', () => {
    const html = renderToStaticMarkup(<StatusPill tone="amber">x</StatusPill>);
    expect(html).toMatch(/amber/i);
  });

  it('red tone applies red class', () => {
    const html = renderToStaticMarkup(<StatusPill tone="red">x</StatusPill>);
    expect(html).toMatch(/red/i);
  });
});
