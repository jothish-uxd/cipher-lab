interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string; // accessible name, e.g. "Spice-route AML"
}

/** Switch with a visible On/Off word so state never relies on color or position alone. */
export default function Toggle({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="toggle"
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__track" aria-hidden="true"><span className="toggle__thumb" /></span>
      <span className="toggle__text" aria-hidden="true">{checked ? 'On' : 'Off'}</span>
    </button>
  );
}
