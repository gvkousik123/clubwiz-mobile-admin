import { useState, useEffect, useCallback } from 'react';
import { NotificationService, Notification } from '@/lib/services/notification.service';
import { useToast } from './use-toast';

export function useNotifications(clubId: string | null, enablePolling: boolean = true) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const loadNotifications = useCallback(async () => {
        if (!clubId) return;

        setLoading(true);
        try {
            const response = await NotificationService.getNotifications(clubId);
            if (response.success) {
                setNotifications(response.notifications);
                setUnreadCount(response.unreadCount);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [clubId]);

    const handleNewBooking = useCallback((notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        toast({
            title: notification.title,
            description: notification.message,
            className: "bg-green-50 border-green-200 text-green-900",
        });

        NotificationService.showBrowserNotification(notification.title, {
            body: notification.message,
            tag: notification.id,
        });
    }, [toast]);

    const markAsRead = useCallback(async (notificationId: string) => {
        const success = await NotificationService.markAsRead(notificationId);
        if (success) {
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!clubId) return;

        const success = await NotificationService.markAllAsRead(clubId);
        if (success) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        }
    }, [clubId]);

    useEffect(() => {
        if (!clubId || !enablePolling) return;

        NotificationService.requestPermission();

        NotificationService.startPolling(clubId, handleNewBooking, 60000);

        return () => {
            NotificationService.stopPolling();
        };
    }, [clubId, enablePolling, handleNewBooking]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refresh: loadNotifications
    };
}
