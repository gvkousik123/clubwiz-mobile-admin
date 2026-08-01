import { api } from '../api-client';

export interface Notification {
    id: string;
    type: 'BOOKING' | 'CANCELLATION' | 'ARRIVAL' | 'SYSTEM';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    metadata?: {
        eventId?: string;
        eventName?: string;
        ticketNumber?: string;
        bookingId?: string;
        amount?: number;
        guestCount?: number;
    };
}

export interface NotificationResponse {
    notifications: Notification[];
    unreadCount: number;
    success: boolean;
}

export class NotificationService {
    private static pollingInterval: NodeJS.Timeout | null = null;
    private static lastBookingCheck: string | null = null;

    /**
     * Get all notifications for a club
     */
    static async getNotifications(clubId: string): Promise<NotificationResponse> {
        try {
            const response = await api.get(`/notification/api/notifications`, {
                params: { clubId }
            });
            return response.data;
        } catch (error: any) {
            console.error('❌ [Notification] Error fetching notifications:', error);
            return {
                notifications: [],
                unreadCount: 0,
                success: false
            };
        }
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(notificationId: string): Promise<boolean> {
        try {
            const response = await api.put(`/notification/api/notifications/${notificationId}/read`);
            return response.data.success || true;
        } catch (error: any) {
            console.error('❌ [Notification] Error marking notification as read:', error);
            return false;
        }
    }

    /**
     * Mark all notifications as read
     */
    static async markAllAsRead(clubId: string): Promise<boolean> {
        try {
            const response = await api.put(`/notification/api/notifications/read-all`, null, {
                params: { clubId }
            });
            return response.data.success || true;
        } catch (error: any) {
            console.error('❌ [Notification] Error marking all as read:', error);
            return false;
        }
    }

    /**
     * Poll for new bookings and create local notifications
     * This is a client-side polling mechanism until backend webhook is implemented
     */
    static async checkNewBookings(
        clubId: string,
        onNewBooking: (notification: Notification) => void
    ): Promise<void> {
        try {
            const now = new Date().toISOString();
            const since = this.lastBookingCheck || new Date(Date.now() - 5 * 60 * 1000).toISOString();

            const response = await api.get(`/ticket/api/analytics/bookings`, {
                params: {
                    clubId,
                    page: 0,
                    size: 10,
                    sortBy: 'bookingDate',
                    sortOrder: 'desc'
                }
            });

            if (response.data?.success && response.data?.data?.content) {
                const recentBookings = response.data.data.content.filter((booking: any) => {
                    return new Date(booking.bookingDate) > new Date(since);
                });

                recentBookings.forEach((booking: any) => {
                    const notification: Notification = {
                        id: `booking-${booking.ticketNumber}-${Date.now()}`,
                        type: 'BOOKING',
                        title: '🎉 New Booking Received!',
                        message: `${booking.fullName || 'Guest'} booked ${booking.guestCount} ticket(s) for ₹${booking.totalAmount}`,
                        timestamp: booking.bookingDate,
                        read: false,
                        metadata: {
                            ticketNumber: booking.ticketNumber,
                            amount: booking.totalAmount,
                            guestCount: booking.guestCount
                        }
                    };
                    onNewBooking(notification);
                });
            }

            this.lastBookingCheck = now;
        } catch (error: any) {
            console.error('❌ [Notification] Error checking new bookings:', error);
        }
    }

    /**
     * Start polling for new bookings
     */
    static startPolling(
        clubId: string,
        onNewBooking: (notification: Notification) => void,
        intervalMs: number = 60000
    ): void {
        if (this.pollingInterval) {
            this.stopPolling();
        }

        this.checkNewBookings(clubId, onNewBooking);

        this.pollingInterval = setInterval(() => {
            this.checkNewBookings(clubId, onNewBooking);
        }, intervalMs);

        console.log('✅ [Notification] Started polling for new bookings');
    }

    /**
     * Stop polling for new bookings
     */
    static stopPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('🛑 [Notification] Stopped polling');
        }
    }

    /**
     * Request browser notification permission
     */
    static async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.warn('⚠️ Browser does not support notifications');
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission;
        }

        return Notification.permission;
    }

    /**
     * Show browser notification
     */
    static showBrowserNotification(title: string, options?: NotificationOptions): void {
        if (!('Notification' in window)) {
            console.warn('⚠️ Browser does not support notifications');
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification(title, {
                icon: '/logo.png',
                badge: '/logo.png',
                ...options
            });
        }
    }
}
