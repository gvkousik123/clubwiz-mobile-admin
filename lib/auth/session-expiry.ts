/**
 * Shared contract between the API client (which detects an expired session) and
 * the SessionExpiredGate (which shows the panel). Kept in its own module so the
 * client does not have to import React code.
 */
export const SESSION_EXPIRED_EVENT = 'clubwiz:session-expired';

/** Set on window by the gate so the API client knows a UI is listening. */
export const SESSION_GATE_FLAG = '__clubwizSessionGateMounted';

/** Survives a hard reload so the root page can forward to login instead of intro. */
export const SESSION_EXPIRED_FLAG = 'clubwiz.sessionExpired';

const EXPIRY_MESSAGES = [
    'jwt token is expired',
    'jwt token expired',
    'jwt expired',
    'token is expired',
    'token expired',
    'invalid token',
    'expired token',
];

/** True when the backend's error body says the token itself is the problem. */
export const messageSaysExpired = (raw: unknown): boolean => {
    if (typeof raw !== 'string' || !raw) return false;
    const msg = raw.toLowerCase();
    return EXPIRY_MESSAGES.some(m => msg.includes(m));
};

/**
 * Whether the stored access token is past its `exp` claim.
 *
 * Deliberately conservative: a token that is present and parses but carries no
 * `exp` is NOT treated as expired, so a genuine role-based 403 is never mistaken
 * for a dead session. A missing token counts as expired - there is no session.
 */
export const storedTokenIsExpired = (token: string | null): boolean => {
    if (!token) return true;

    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        const payload = parts[1];
        const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
        const decoded = JSON.parse(atob(padded));

        if (typeof decoded?.exp !== 'number') return false;
        return decoded.exp <= Math.floor(Date.now() / 1000);
    } catch {
        // Unparseable token - let the status code and message decide instead.
        return false;
    }
};
