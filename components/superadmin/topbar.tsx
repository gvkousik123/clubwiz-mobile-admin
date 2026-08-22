'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu, Search } from 'lucide-react';
import { PAGE_META } from './nav-config';

interface SuperAdminTopbarProps {
  onOpenSidebar: () => void;
}

export const SuperAdminTopbar = ({ onOpenSidebar }: SuperAdminTopbarProps) => {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: 'Clubwiz', subtitle: 'Platform console' };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 px-[16px] py-4 border-b border-[var(--sa-border)] bg-[rgba(5,16,12,0.92)] backdrop-blur-[12px]">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-[14px] border border-[var(--sa-border)] bg-[var(--sa-raised)] text-[var(--sa-text)] hover:bg-white/[0.04] transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="sa-display text-[20px] font-bold leading-[1.15]">{meta.title}</div>
        <div className="text-[12.5px] font-medium mt-[2px] text-[var(--sa-text-dim)]">
          {meta.subtitle}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-[9px] px-[14px] h-[42px] w-full max-w-[320px] rounded-xl border border-[var(--sa-border)] bg-[var(--sa-card)] shadow-[inset_0_0_0_1px_rgba(56,189,248,0.05)]">
        <Search className="w-[17px] h-[17px] flex-shrink-0 text-[rgba(234,242,238,0.5)]" />
        <input
          placeholder="Search clubs, events, tickets…"
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13.5px] font-medium text-[var(--sa-text)]"
        />
      </div>

      <button
        aria-label="Notifications"
        className="relative w-[42px] h-[42px] rounded-xl border flex items-center justify-center bg-[var(--sa-card)] border-[var(--sa-border)] text-[var(--sa-text)]"
      >
        <Bell className="w-[19px] h-[19px]" strokeWidth={1.9} />
      </button>
    </header>
  );
};

export default SuperAdminTopbar;
