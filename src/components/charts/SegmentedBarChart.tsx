import { useState } from 'react';
import ChartFigure from './ChartFigure';
import { useRovingFocus } from './useRovingFocus';
import { Swatch, type Pattern } from './PatternDefs';

export interface Series { key: string; label: string; pattern: Pattern }
export interface SegRow { label: string; values: Record<string, number> }

interface Props {
  title: string;
  unit: string;
  series: Series[];
  rows: SegRow[];
  summary?: string;
}

const n = (x: number) => x.toLocaleString('en-GB');
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** 100% stacked bars, one row per label (a11y-charts "Segmented horizontal"). */
export default function SegmentedBarChart({ title, unit, series, rows, summary }: Props) {
  const marks = rows.flatMap((r) => series.map((s) => ({ r, s })));
  const { itemProps } = useRovingFocus(marks.length);
  const [readout, setReadout] = useState('');
  const total = (r: SegRow) => series.reduce((a, s) => a + (r.values[s.key] ?? 0), 0);
  const say = (r: SegRow, s: Series) => `${r.label}, ${s.label}: ${n(r.values[s.key] ?? 0)} ${unit}, ${pct((r.values[s.key] ?? 0) / Math.max(1, total(r)))} of ${r.label}.`;
  const auto = rows.map((r) => {
    const top = [...series].sort((a, b) => (r.values[b.key] ?? 0) - (r.values[a.key] ?? 0))[0];
    return `${top.label} is the largest share of ${r.label} (${pct((r.values[top.key] ?? 0) / Math.max(1, total(r)))}).`;
  }).join(' ');

  let mark = 0;
  return (
    <ChartFigure
      title={title}
      summary={summary ?? auto}
      readout={readout}
      legend={
        <ul className="seg-legend">
          {series.map((s) => <li key={s.key}><Swatch pattern={s.pattern} />{s.label}</li>)}
        </ul>
      }
      table={
        <table className="table table--compact">
          <caption className="visually-hidden">{title}</caption>
          <thead><tr><th scope="col">Label</th>{series.map((s) => <th key={s.key} scope="col" className="num">{s.label}</th>)}<th scope="col" className="num">Total</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.label}><th scope="row">{r.label}</th>{series.map((s) => <td key={s.key} className="num">{n(r.values[s.key] ?? 0)}</td>)}<td className="num">{n(total(r))}</td></tr>
          ))}</tbody>
        </table>
      }
    >
      <ul className="segbar" aria-label={title}>
        {rows.map((r) => {
          const t = Math.max(1, total(r));
          let x = 0;
          return (
            <li key={r.label} className="segbar__row">
              <span className="segbar__label" aria-hidden="true">{r.label}</span>
              <div className="segbar__track" role="list" aria-label={r.label}>
                {series.map((s) => {
                  const w = ((r.values[s.key] ?? 0) / t) * 100;
                  const i = mark++;
                  const left = x;
                  x += w;
                  return (
                    <span
                      key={s.key}
                      role="listitem"
                      className="segbar__seg"
                      style={{ left: `${left}%`, width: `${w}%` }}
                      aria-label={say(r, s)}
                      {...itemProps(i)}
                      onMouseEnter={() => setReadout(say(r, s))}
                      onMouseLeave={() => setReadout('')}
                      onFocusCapture={() => setReadout(say(r, s))}
                      onBlur={() => setReadout('')}
                    >
                      <svg aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill={`url(#mono-${s.pattern})`} stroke="currentColor" strokeWidth="1" /></svg>
                    </span>
                  );
                })}
              </div>
              <span className="segbar__total" aria-hidden="true">{n(total(r))}</span>
            </li>
          );
        })}
      </ul>
    </ChartFigure>
  );
}
