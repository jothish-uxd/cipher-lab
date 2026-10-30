import { useRef, useState, type KeyboardEvent } from 'react';

/** One tab stop per chart; arrow keys, Home and End move between marks. */
export function useRovingFocus(count: number) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const move = (i: number) => {
    const next = Math.max(0, Math.min(count - 1, i));
    setActive(next);
    refs.current[next]?.focus();
  };
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const map: Record<string, number> = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: count - 1 };
    if (e.key in map) { e.preventDefault(); move(map[e.key]); }
  };
  const itemProps = (i: number) => ({
    ref: (el: HTMLElement | null) => { refs.current[i] = el; },
    tabIndex: i === active ? 0 : -1,
    onKeyDown: (e: KeyboardEvent) => onKeyDown(e, i),
    onFocus: () => setActive(i),
  });
  return { itemProps };
}
