import { api, handleApiResponse, handleApiError } from '../api-client';
import { ApiResponse } from '../api-types';

/**
 * Mobile Auth Service
 * Handles mobile/OTP-based authentication flows
 */
export class MobileAuthService {

    /**
     * Send OTP to email for mobile verification
     * POST /notification/api/otp/send?email=...&mobile=...
     */
    static async sendOtp(email: string, mobileNumber: string): Promise<any> {
        try {
            const response = await api.post(
                `/notification/api/otp/send?email=${encodeURIComponent(email)}&mobile=${encodeURIComponent(mobileNumber)}`
            );
            return handleApiResponse(response);
        } catch (error) {
            throw handleApiError(error);
        }
    }

    /**
     * Validate OTP sent to email
     * POST https://clubwiz.in/notification/api/otp/validate?email=...&otp=...
     */
    static async validateOtp(email: string, otp: string): Promise<any> {
        try {
            // Convert OTP to integer as per API spec
            const otpInt = parseInt(otp, 10);

            // Send as query parameters, not in body
            const response = await api.post(
                `/notification/api/otp/validate?email=${encodeURIComponent(email)}&otp=${otpInt}`
            );
            return handleApiResponse(response);
        } catch (error) {
            throw handleApiError(error);
        }
    }

    /**
     * Verify Firebase token from mobile auth
     * POST /auth/mobile/verify-firebase-token
     */
    static async verifyFirebaseToken(idToken: string): Promise<any> {
        try {
            const response = await api.post('/auth/mobile/verify-firebase-token', {
                idToken
            });
            return handleApiResponse(response);
        } catch (error) {
            throw handleApiError(error);
        }
    }

    /**
     * Complete user registration after Firebase verification
     * POST /auth/mobile/complete-registration
     */
    static async completeRegistration(data: {
        mobileNumber: string;
        fullName: string;
        email: string;
    }): Promise<any> {
        try {
            const response = await api.post('/auth/mobile/complete-registration', data);
            return handleApiResponse(response);
        } catch (error) {
            throw handleApiError(error);
        }
    }
}
