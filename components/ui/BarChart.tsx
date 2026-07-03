// components/ui/BarChart.tsx

// ============= IMPORTS =============
import styles from './BarChart.module.css';

// ============= TYPES =============
export type BarTone = 'primary' | 'good' | 'warn' | 'bad';

export type BarDatum = {
  label: string;
  value: number;
  tone?: BarTone;
  // Optional display override for the tip value (e.g. "5 / 20"); falls back to value.
  display?: string;
};

type Props = {
  data: BarDatum[];
  // Scale ceiling. Defaults to the largest value so the biggest bar fills the track.
  max?: number;
  emptyText?: string;
  // Accessible summary for the whole figure (it renders as role="img").
  ariaLabel: string;
};

// ============= COMPONENT =============
// Horizontal magnitude bars. Single-series by default (no legend — the panel
// title names it); pass a `tone` per datum for a status breakdown, where each
// bar is already identified by its row label (identity is never color-alone).
// Hover shows a native tooltip via <title>; the value is also printed at the tip.
export function BarChart({ data, max, emptyText = 'No data yet.', ariaLabel }: Props) {
  if (data.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }
  const ceiling = max ?? Math.max(...data.map(d => d.value), 0);

  return (
    <div className={styles.chart} role="img" aria-label={ariaLabel}>
      {data.map(d => {
        const pct = ceiling > 0 ? Math.max(0, Math.min(100, (d.value / ceiling) * 100)) : 0;
        const tip = d.display ?? String(d.value);
        return (
          <div className={styles.row} key={d.label} title={`${d.label}: ${tip}`}>
            <span className={styles.label}>{d.label}</span>
            <div className={styles.track}>
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <div className={styles.fill} data-tone={d.tone ?? 'primary'} style={{ width: `${pct}%` } as React.CSSProperties} />
            </div>
            <span className={styles.value}>{tip}</span>
          </div>
        );
      })}
    </div>
  );
}
