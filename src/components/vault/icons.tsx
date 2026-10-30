import type { ReactNode } from 'react';
import type { ChannelId } from '../../data/vault/org';

/* Monochrome line icons, 24px grid, inherit currentColor. Decorative unless given a title. */

const Svg = ({ children, className = 'icon' }: { children: ReactNode; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
);

export const FlagIcon = ({ filled = false }: { filled?: boolean }) => (
  <Svg><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" fill={filled ? 'currentColor' : 'none'} /></Svg>
);
export const SparkIcon = () => (
  <Svg><path d="M10 4l1.6 4.4L16 10l-4.4 1.6L10 16l-1.6-4.4L4 10l4.4-1.6z" /><path d="M18 3v4M16 5h4M18 15v4M16 17h4" /></Svg>
);
export const ClipIcon = () => (
  <Svg><path d="M20 11.5 12.5 19a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4L15 7.5" /></Svg>
);
export const SearchIcon = () => <Svg><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Svg>;
export const ChevronIcon = () => <Svg><path d="m6 9 6 6 6-6" /></Svg>;
export const BackIcon = () => <Svg><path d="M15 5 8 12l7 7" /></Svg>;
export const ExternalIcon = () => <Svg className="icon icon--xs"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Svg>;
export const FileIcon = () => <Svg><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" /><path d="M14 3v4h4" /></Svg>;
export const PaneBottomIcon = () => <Svg><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M3.5 11h17" /></Svg>;
export const PaneRightIcon = () => <Svg><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M11 4.5v15" /></Svg>;
export const ShieldIcon = () => <Svg><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" /></Svg>;
export const LanguageIcon = () => <Svg><path d="M4 6h9M8.5 4v2M11 6c-1 4-3.5 7-7 9M6.5 10c1.2 2 3 3.6 5.5 4.5" /><path d="m13 20 3.5-8 3.5 8M14.2 17.5h4.6" /></Svg>;
export const FaceIcon = () => <Svg><circle cx="12" cy="12" r="8.5" /><path d="M9 14.5c1.6 1.6 4.4 1.6 6 0" /><path d="M9.5 10h.01M14.5 10h.01" strokeWidth={2.4} /></Svg>;
export const LayersIcon = () => <Svg><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></Svg>;
export const InboxIcon = () => <Svg><path d="M3.5 13.5 6 5h12l2.5 8.5V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" /><path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5" /></Svg>;
export const ChatsIcon = () => <Svg><path d="M4 5h12v8H9l-3 3v-3H4z" /><path d="M16 9h4v8h-2v3l-3-3h-5v-2" /></Svg>;

/* Channels: generic shapes, no brand marks. The channel name always travels with the icon. */
export function ChannelIcon({ id }: { id: ChannelId }) {
  switch (id) {
    case 'email': return <Svg><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" /><path d="m4 7 8 6 8-6" /></Svg>;
    case 'teams': return <Svg><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" /><circle cx="17" cy="9" r="2.2" /><path d="M16 14c2.4 0 4 1.6 4.5 4" /></Svg>;
    case 'bloomberg': return <Svg><rect x="3.5" y="4.5" width="17" height="12" rx="1.5" /><path d="M8 20h8M12 16.5V20M7 9l2.5 2L7 13M12 13h4" /></Svg>;
    case 'whatsapp': return <Svg><path d="M4.5 20 6 16a8 8 0 1 1 3 3z" /><path d="M9.5 9.5c.3 2 2.5 4.6 5 5l1-1.5-1.8-1-1 .8c-.8-.4-1.6-1.2-2-2l.8-1-1-1.8z" /></Svg>;
    case 'sms': return <Svg><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></Svg>;
    case 'messenger': return <Svg><path d="M12 3.5c-4.7 0-8.5 3.5-8.5 7.9 0 2.5 1.2 4.7 3.2 6.1v3l2.9-1.6c.8.2 1.6.3 2.4.3 4.7 0 8.5-3.5 8.5-7.8S16.7 3.5 12 3.5z" /><path d="m7.5 13.5 3-3 2.5 2 3.5-3" /></Svg>;
    case 'linkedin': return <Svg><rect x="3.5" y="3.5" width="17" height="17" rx="2.5" /><path d="M8 10.5V16M8 7.5v.01M11.5 16v-5.5M11.5 13c0-1.6 1-2.5 2.3-2.5S16 11.4 16 13v3" /></Svg>;
  }
}
