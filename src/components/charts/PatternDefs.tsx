/** Monochrome fill patterns from a11y-charts. Rendered once; charts refer to them as url(#mono-<name>). */
export const PATTERNS = ['diagonalForward', 'dots', 'vertical', 'horizontal', 'checker', 'crosshatch', 'solid'] as const;
export type Pattern = (typeof PATTERNS)[number];

export default function PatternDefs() {
  return (
    <svg className="mono-defs" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="mono-solid" patternUnits="userSpaceOnUse" width="8" height="8"><rect width="8" height="8" fill="currentColor" /></pattern>
        <pattern id="mono-diagonalForward" patternUnits="userSpaceOnUse" width="7" height="7"><rect width="7" height="7" style={{ fill: 'var(--bg)' }} /><path d="M-1 1 L1 -1 M0 7 L7 0 M6 8 L8 6" stroke="currentColor" strokeWidth="2.3" /></pattern>
        <pattern id="mono-dots" patternUnits="userSpaceOnUse" width="7" height="7"><rect width="7" height="7" style={{ fill: 'var(--bg)' }} /><circle cx="3.5" cy="3.5" r="1.8" fill="currentColor" /></pattern>
        <pattern id="mono-vertical" patternUnits="userSpaceOnUse" width="7" height="7"><rect width="7" height="7" style={{ fill: 'var(--bg)' }} /><rect width="2.6" height="7" fill="currentColor" /></pattern>
        <pattern id="mono-horizontal" patternUnits="userSpaceOnUse" width="7" height="7"><rect width="7" height="7" style={{ fill: 'var(--bg)' }} /><rect width="7" height="2.6" fill="currentColor" /></pattern>
        <pattern id="mono-checker" patternUnits="userSpaceOnUse" width="9" height="9"><rect width="9" height="9" style={{ fill: 'var(--bg)' }} /><rect width="4.5" height="4.5" fill="currentColor" /><rect x="4.5" y="4.5" width="4.5" height="4.5" fill="currentColor" /></pattern>
        <pattern id="mono-crosshatch" patternUnits="userSpaceOnUse" width="6" height="6"><rect width="6" height="6" style={{ fill: 'var(--bg)' }} /><path d="M-1 1 L1 -1 M0 6 L6 0 M5 7 L7 5 M-1 5 L1 7 M0 0 L6 6 M5 -1 L7 1" stroke="currentColor" strokeWidth="1.2" /></pattern>
      </defs>
    </svg>
  );
}

/** A small legend swatch drawn with the same pattern. */
export function Swatch({ pattern }: { pattern: Pattern }) {
  return (
    <svg className="swatch" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x=".5" y=".5" width="15" height="15" fill={`url(#mono-${pattern})`} stroke="currentColor" />
    </svg>
  );
}
