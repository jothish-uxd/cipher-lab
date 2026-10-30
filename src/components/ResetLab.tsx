import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetStore } from '../data/store';

/** Icon button in the frame bar that clears every change made in the lab, after a confirm. */
export default function ResetLab() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState('');
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [open]);

  const close = () => { setOpen(false); buttonRef.current?.focus(); };
  const reset = () => {
    resetStore();
    setOpen(false);
    navigate('/lab');
    setDone('Lab reset. Every customer is back to its starting state.');
    buttonRef.current?.focus();
  };

  return (
    <span className="reset">
      <button
        ref={buttonRef}
        type="button"
        className="bframe__btn"
        aria-label="Reset lab"
        title="Reset lab"
        aria-expanded={open}
        aria-controls="reset-confirm"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.75 8a5.25 5.25 0 1 0 1.6-3.78" /><path d="M2.5 2.5v3h3" /></svg>
      </button>
      {open && (
        <div ref={boxRef} id="reset-confirm" className="reset__box" role="alertdialog" aria-labelledby="reset-h" aria-describedby="reset-d">
          <p id="reset-h" className="reset__title">Reset the lab?</p>
          <p id="reset-d" className="reset__desc">This clears every change made in this browser: contracts, data requests, analysis, training, deployments and new solutions. Customers go back to their starting state.</p>
          <div className="reset__actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={reset}>Reset lab</button>
            <button ref={cancelRef} type="button" className="btn btn--secondary btn--sm" onClick={close}>Cancel</button>
          </div>
        </div>
      )}
      <span className="visually-hidden" role="status" aria-live="polite">{done}</span>
    </span>
  );
}
