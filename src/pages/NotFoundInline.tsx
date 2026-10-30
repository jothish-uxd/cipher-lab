import type { RefObject } from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundInline({ headingRef, what }: { headingRef: RefObject<HTMLHeadingElement>; what: string }) {
  return (
    <div className="page">
      <h1 ref={headingRef} tabIndex={-1} className="page-title">This {what} doesn’t exist</h1>
      <p className="lede">It may have been renamed. Pick one from the <Link to="/studio">customer list</Link>.</p>
    </div>
  );
}
