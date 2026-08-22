'use client';

import { ReactNode, useState } from 'react';
import './superadmin.css';
import { RequirePermission } from '@/components/auth/require-permission';
import { SuperAdminSidebar } from '@/components/superadmin/sidebar';
import { SuperAdminTopbar } from '@/components/superadmin/topbar';

/**
 * Guards and frames the whole platform console.
 *
 * The permission check lives here, once, rather than in each of the twelve
 * pages below it.
 */
export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <RequirePermission permission="platform.console.access">
      <div className="sa-root flex min-h-screen">
        <SuperAdminSidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 min-w-0 flex flex-col">
          <SuperAdminTopbar onOpenSidebar={() => setIsSidebarOpen(true)} />
          <div className="flex-1 px-[16px] md:px-[30px] pt-[26px] pb-12">{children}</div>
        </main>
      </div>
    </RequirePermission>
  );
}
