import { useId, useState, type ReactNode } from 'react';

interface Props {
  title: string;
  summary: string;
  /** What the focused or hovered mark says; shown under the chart */
  readout?: string;
  legend?: ReactNode;
  table: ReactNode;
  children: ReactNode;
}

/**
 * The a11y-charts reading order: title, summary, chart, legend, then a real table.
 * The chart itself is one keyboard stop; the table is one button away.
 */
export default function ChartFigure({ title, summary, readout, legend, table, children }: Props) {
  const [showTable, setShowTable] = useState(false);
  const id = useId();
  return (
    <figure className="chart" aria-labelledby={`${id}-t`}>
      <figcaption>
        <h3 id={`${id}-t`} className="chart__title">{title}</h3>
        <p className="chart__summary">{summary}</p>
      </figcaption>
      <div className="chart__body">{children}</div>
      <p className="chart__readout" aria-hidden="true">{readout || ' '}</p>
      {legend && <div className="chart__legend">{legend}</div>}
      <button
        type="button"
        className="link-button chart__table-toggle"
        aria-expanded={showTable}
        aria-controls={`${id}-table`}
        onClick={() => setShowTable((s) => !s)}
      >
        {showTable ? 'Hide data table' : 'Show data table'}
      </button>
      <div id={`${id}-table`} hidden={!showTable} className="chart__table">{table}</div>
    </figure>
  );
}
