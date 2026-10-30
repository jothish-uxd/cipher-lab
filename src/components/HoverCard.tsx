import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * HoverCard — details that appear on hover or keyboard focus.
 *
 * Design-system rules (WCAG 1.4.13, content on hover or focus)
 * - The trigger is a real button with its own name; the card is extra detail,
 *   linked with aria-describedby, so screen readers hear it on focus.
 * - Hoverable: moving the pointer from the trigger onto the card keeps it open.
 * - Dismissable: Escape closes it without moving focus.
 * - Persistent: it stays until the pointer or focus leaves.
 * - The card holds text only, never links or buttons: put actions in the page.
 * - It renders at the end of <body> and positions itself against the trigger,
 *   so scrolling regions never clip it. It flips above when there's no room below.
 */
interface Props {
  /** Accessible name of the trigger, e.g. "3 policy matches" */
  label: string;
  /** What the trigger shows */
  children: ReactNode;
  /** Card content (text only) */
  card: ReactNode;
  className?: string;
  /** Pass clicks on to a parent (e.g. a table row) instead of stopping them */
  onClick?: () => void;
}

const SHOW_DELAY = 150;
const HIDE_DELAY = 120;
const GAP = 8;

export default function HoverCard({ label, children, card, className, onClick }: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; arrow: number; above: boolean } | null>(null);

  const clear = () => window.clearTimeout(timer.current);
  const show = (delay = SHOW_DELAY) => { clear(); timer.current = window.setTimeout(() => setOpen(true), delay); };
  const hide = (delay = HIDE_DELAY) => { clear(); timer.current = window.setTimeout(() => setOpen(false), delay); };
  useEffect(() => clear, []);

  // Escape dismisses from anywhere while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { clear(); setOpen(false); } };
    const onScroll = () => setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', onScroll, true);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('scroll', onScroll, true); };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !cardRef.current) { setPos(null); return; }
    const t = triggerRef.current.getBoundingClientRect();
    const c = cardRef.current.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const above = t.bottom + GAP + c.height > vh - 8 && t.top - GAP - c.height > 8;
    const centre = t.left + t.width / 2;
    const left = Math.min(Math.max(8, centre - c.width / 2), vw - c.width - 8);
    setPos({ top: above ? t.top - GAP - c.height : t.bottom + GAP, left, arrow: centre - left, above });
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`hovercard-trigger${className ? ` ${className}` : ''}`}
        aria-label={label}
        aria-describedby={id}
        onMouseEnter={() => show()}
        onMouseLeave={() => hide()}
        onFocus={() => show(0)}
        onBlur={() => hide(0)}
        onClick={onClick}
      >
        {children}
      </button>
      {createPortal(
        <div
          ref={cardRef}
          id={id}
          role="tooltip"
          className={`hovercard${pos?.above ? ' is-above' : ''}`}
          hidden={!open}
          style={pos ? { top: pos.top, left: pos.left, ['--arrow-x' as string]: `${pos.arrow}px` } : { visibility: 'hidden' }}
          onMouseEnter={() => clear()}
          onMouseLeave={() => hide()}
        >
          {card}
        </div>,
        document.body,
      )}
    </>
  );
}
