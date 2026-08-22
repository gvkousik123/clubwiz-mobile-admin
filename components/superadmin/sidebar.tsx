'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, TrendingUp, X } from 'lucide-react';
import { SUPERADMIN_NAV } from './nav-config';
import { useAuthorization } from '@/hooks/use-authorization';
import { AuthService } from '@/lib/services/auth.service';
import { ProfileService } from '@/lib/services/profile.service';

interface SuperAdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export const SuperAdminSidebar = ({ open, onClose }: SuperAdminSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { can, isSuperAdmin } = useAuthorization();

  const currentUser = ProfileService.getCurrentUser();
  const displayName = currentUser?.fullName || currentUser?.username || 'Clubwiz';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } finally {
      ProfileService.clearStoredData();
      router.replace('/bz/auth/intro');
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 md:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform bg-[var(--sa-surface)] border-r border-[var(--sa-border)] px-[14px] py-[22px] transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 md:w-[248px] md:flex md:flex-col md:flex-shrink-0 md:overflow-y-auto ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between gap-[11px] px-2 pt-1 pb-[22px] md:justify-start">
          <div className="flex items-center gap-[11px]">
            <div className="overflow-hidden flex items-center justify-center flex-shrink-0 ">
              <Image
                src="/logo/clubwizlogo.png"
                alt="ClubWiz"
                width={104}
                height={84}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <button
            className="md:hidden p-2 rounded-full text-[var(--sa-text)] hover:bg-white/[0.08]"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto -mx-1 px-1">
          {SUPERADMIN_NAV.map((group) => {
            const visible = group.items.filter((item) => can(item.permission));
            if (visible.length === 0) return null;

            return (
              <div key={group.title}>
                <div className="sa-label px-[10px] pt-5 pb-2 first:pt-[6px]">{group.title}</div>
                {visible.map((item) => {
                  const active =
                    item.href === '/bz/superadmin'
                      ? pathname === item.href
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 w-full px-3 py-[11px] mb-[2px] rounded-[11px] text-[13.5px] font-semibold transition-colors ${
                        active
                          ? 'bg-[var(--sa-accent-soft)] text-[var(--sa-accent)]'
                          : 'text-[rgba(234,242,238,0.68)] hover:bg-white/[0.04]'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.9} />
                      <span className="flex-1">{item.label}</span>
                      {item.pendingBackend && (
                        <span
                          title="Backend endpoint not available yet"
                          className="w-[6px] h-[6px] rounded-full bg-[var(--sa-amber)]"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-3 flex items-center gap-[11px] p-3 rounded-[14px] border bg-[var(--sa-raised)] border-[var(--sa-border)]">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 sa-display text-sm font-bold text-white bg-gradient-to-br from-[#E879F9] to-[#C084FC]">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="sa-display text-[12.5px] font-bold truncate">{displayName}</div>
            <div className="text-[10.5px] font-medium text-[var(--sa-text-dim)]">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="text-[rgba(234,242,238,0.4)] hover:text-[var(--sa-red)] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default SuperAdminSidebar;
