'use client';

import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationPanel } from './notification-panel';

interface NotificationBellProps {
    clubId: string | null;
    enablePolling?: boolean;
}

export function NotificationBell({ clubId, enablePolling = true }: NotificationBellProps) {
    const [showPanel, setShowPanel] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(
        clubId,
        enablePolling
    );

    return (
        <div className="relative z-[10000]">
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2.5 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-[#14FFEC]" fill={unreadCount > 0 ? '#14FFEC' : 'none'} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showPanel && (
                <NotificationPanel
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onClose={() => setShowPanel(false)}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                />
            )}
        </div>
    );
}
