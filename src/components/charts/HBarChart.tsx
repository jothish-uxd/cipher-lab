import { useState } from 'react';
import ChartFigure from './ChartFigure';
import { useRovingFocus } from './useRovingFocus';
import type { Pattern } from './PatternDefs';

export interface Bar { label: string; value: number }

interface Props {
  title: string;
  unit: string;          // e.g. "messages"
  data: Bar[];
  pattern: Pattern;
  /** Shared maximum so side-by-side charts use the same scale */
  max?: number;
  summary?: string;
  empty?: string;
}

const n = (x: number) => x.toLocaleString('en-GB');

/** Ranked horizontal bars with room for long labels (a11y-charts "Horizontal bars"). */
export default function HBarChart({ title, unit, data, pattern, max, summary, empty }: Props) {
  const top = Math.max(1, max ?? Math.max(...data.map((d) => d.value), 1));
  const { itemProps } = useRovingFocus(data.length);
  const [readout, setReadout] = useState('');
  const say = (d: Bar, i: number) => `${d.label}: ${n(d.value)} ${unit}. Rank ${i + 1} of ${data.length}.`;
  const auto = data.length
    ? `“${data[0].label}” leads with ${n(data[0].value)} ${unit}` +
      (data.length > 1 ? `, about ${(data[0].value / Math.max(1, data[data.length - 1].value)).toFixed(1)} times “${data[data.length - 1].label}”, the ${data.length}th.` : '.')
    : empty ?? 'Nothing to show.';

  return (
    <ChartFigure
      title={title}
      summary={summary ?? auto}
      readout={readout}
      table={
        <table className="table table--compact">
          <caption className="visually-hidden">{title}</caption>
          <thead><tr><th scope="col">Rank</th><th scope="col">Term</th><th scope="col" className="num">{unit[0].toUpperCase() + unit.slice(1)}</th></tr></thead>
          <tbody>{data.map((d, i) => <tr key={d.label}><td>{i + 1}</td><th scope="row">{d.label}</th><td className="num">{n(d.value)}</td></tr>)}</tbody>
        </table>
      }
    >
      {data.length === 0 ? <p className="muted">{empty ?? 'Nothing to show.'}</p> : (
        <ul className="hbar" aria-label={title}>
          {data.map((d, i) => (
            <li
              key={d.label}
              className="hbar__row"
              aria-label={say(d, i)}
              {...itemProps(i)}
              onMouseEnter={() => setReadout(say(d, i))}
              onMouseLeave={() => setReadout('')}
              onFocusCapture={() => setReadout(say(d, i))}
              onBlur={() => setReadout('')}
            >
              <span className="hbar__label" aria-hidden="true">{d.label}</span>
              <svg className="hbar__track" aria-hidden="true" focusable="false">
                <rect className="hbar__bg" width="100%" height="100%" />
                <rect width={`${(d.value / top) * 100}%`} height="100%" fill={`url(#mono-${pattern})`} stroke="currentColor" strokeWidth="1" />
              </svg>
              <span className="hbar__value" aria-hidden="true">{n(d.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </ChartFigure>
  );
}
