import type { ReactNode } from 'react';

/**
 * Frames the business screens to a phone width.
 *
 * These screens are phone-designed and carry almost no responsive breakpoints,
 * so they are constrained here rather than stretching across a desktop viewport.
 * The width itself lives in globals.css (--app-frame-width) so the fixed headers
 * inside these screens can line up with it via .app-bar.
 *
 * The /bz/superadmin console is a genuine desktop layout and keeps its own.
 */
export default function BusinessLayout({ children }: { children: ReactNode }) {
    return <div className="app-frame relative min-h-screen">{children}</div>;
}
