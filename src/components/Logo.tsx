/** Cipher Lab mark: three lines of text, partly redacted —
    the model reads what people never see. Monochrome, inherits ink. */
export default function Logo() {
  return (
    <span className="wordmark">
      <svg className="wordmark-glyph" viewBox="0 0 20 20" aria-hidden="true" focusable="false" fill="currentColor">
        <rect x="1" y="3" width="18" height="3.5" rx="1" />
        <rect x="1" y="8.25" width="9" height="3.5" rx="1" />
        <rect x="11.5" y="8.25" width="7.5" height="3.5" rx="1" opacity=".45" />
        <rect x="1" y="13.5" width="13" height="3.5" rx="1" opacity=".45" />
      </svg>
      Cipher Lab
    </span>
  );
}
