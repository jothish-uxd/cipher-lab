/** Cipher Lab mark: three lines of text, partly redacted —
    the model reads what people never see. */
export default function Logo() {
  return (
    <span className="logo">
      <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect x="2" y="2" width="28" height="28" rx="7" fill="var(--accent)" />
        <rect x="8" y="10" width="16" height="3" rx="1.5" fill="var(--accent-ink)" />
        <rect x="8" y="15" width="9" height="3" rx="1.5" fill="var(--accent-ink)" />
        <rect x="19" y="15" width="5" height="3" rx="1.5" fill="var(--accent-ink)" opacity=".5" />
        <rect x="8" y="20" width="12" height="3" rx="1.5" fill="var(--accent-ink)" opacity=".5" />
      </svg>
      <span className="logo-word">Cipher Lab</span>
    </span>
  );
}
