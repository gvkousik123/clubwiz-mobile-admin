'use client';

import { X, Check, CheckCheck } from 'lucide-react';
import { Notification } from '@/lib/services/notification.service';
import { formatDistanceToNow } from 'date-fns';

interface NotificationPanelProps {
    notifications: Notification[];
    unreadCount: number;
    onClose: () => void;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}

export function NotificationPanel({
    notifications,
    unreadCount,
    onClose,
    onMarkAsRead,
    onMarkAllAsRead
}: NotificationPanelProps) {
    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'BOOKING':
                return '🎉';
            case 'CANCELLATION':
                return '❌';
            case 'ARRIVAL':
                return '✅';
            default:
                return '📢';
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-[9998]"
                onClick={onClose}
            />
            <div className="fixed right-4 top-20 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] bg-[#031313] border border-[#0C898B] rounded-2xl shadow-2xl z-[9999] overflow-hidden flex flex-col">
                <div className="flex-shrink-0 bg-[#0D1F1F] border-b border-[#0C898B] p-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-[#14FFEC] font-bold text-lg">Notifications</h3>
                        {unreadCount > 0 && (
                            <p className="text-gray-400 text-sm">{unreadCount} unread</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={onMarkAllAsRead}
                                className="p-2 hover:bg-[#0C898B]/20 rounded-lg transition-colors"
                                title="Mark all as read"
                            >
                                <CheckCheck className="w-5 h-5 text-[#14FFEC]" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[#0C898B]/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-6xl mb-4">🔔</div>
                            <p className="text-gray-400">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#0C898B]/30">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-[#0D1F1F] transition-colors cursor-pointer ${
                                        !notification.read ? 'bg-[#0C898B]/10' : ''
                                    }`}
                                    onClick={() => !notification.read && onMarkAsRead(notification.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl flex-shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="text-white font-semibold text-sm">
                                                    {notification.title}
                                                </h4>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-[#14FFEC] rounded-full flex-shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-sm mt-1">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-xs text-gray-500">
                                                    {formatDistanceToNow(new Date(notification.timestamp), {
                                                        addSuffix: true
                                                    })}
                                                </span>
                                                {notification.metadata?.amount && (
                                                    <span className="text-xs text-[#14FFEC] font-semibold">
                                                        ₹{notification.metadata.amount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
