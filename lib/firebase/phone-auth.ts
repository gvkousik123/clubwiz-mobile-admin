import {
  RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult,
  onAuthStateChanged, User, signOut
} from "firebase/auth";
import {
  auth
} from "./config";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
    lastOtpTimestamp?: number;
    recaptchaVerified?: boolean;
  }
}

export class FirebasePhoneAuth {
  private static instance: FirebasePhoneAuth;

  static getInstance(): FirebasePhoneAuth {
    if (!FirebasePhoneAuth.instance) {
      FirebasePhoneAuth.instance = new FirebasePhoneAuth();
    }
    return FirebasePhoneAuth.instance;
  }

  private OTP_COOLDOWN_MS = 30000; // 30 seconds

  private canSendOtp(): boolean {
    const last = window.lastOtpTimestamp || 0;
    const now = Date.now();
    return now - last > this.OTP_COOLDOWN_MS;
  }

  async setupRecaptcha(
    containerId: string = "recaptcha-container",
    size: "normal" | "invisible" = "invisible"
  ): Promise<void> {
    try {
      // Remove old verifier safely
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // Ignore error
        }
        window.recaptchaVerifier = undefined;
      }

      window.recaptchaVerified = false;

      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size,
        callback: () => {
          window.recaptchaVerified = true;
          console.log("✅ reCAPTCHA solved");
        },
        "expired-callback": () => {
          console.log("⚠️ reCAPTCHA expired");
          window.recaptchaVerified = false;
        },
        "error-callback": (error) => {
          console.error("❌ reCAPTCHA error:", error);
          window.recaptchaVerified = false;
        }
      });

      console.log("🔥 reCAPTCHA initialized");
    } catch (error) {
      console.error("❌ reCAPTCHA setup failed:", error);
      throw error;
    }
  }

  async sendOTP(phoneNumber: string): Promise<boolean> {
    if (!phoneNumber.startsWith("+")) {
      throw new Error(
        "Phone number must be in international format (e.g. +91xxxxxxxxxx)"
      );
    }

    // Prevent spam clicks: COOLDOWN LOGIC
    if (!this.canSendOtp()) {
      throw new Error("Please wait a few seconds before requesting another OTP.");
    }

    try {
      // Create reCAPTCHA only once per OTP attempt
      if (!window.recaptchaVerifier) {
        await this.setupRecaptcha();
      }

      console.log("📱 Sending OTP to:", phoneNumber);

      // Save timestamp to avoid spam / too-many-requests
      window.lastOtpTimestamp = Date.now();

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        window.recaptchaVerifier
      );

      window.confirmationResult = confirmationResult;
      console.log("✅ OTP sent successfully");

      return true;
    } catch (error: any) {
      console.error("❌ Error sending OTP:", error);

      // Reset reCAPTCHA safely
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // Ignore error
        }
        window.recaptchaVerifier = undefined;
      }

      throw new Error(this.getErrorMessage(error));
    }
  }

  async verifyOTP(otp: string): Promise<User> {
    try {
      if (!window.confirmationResult) {
        throw new Error("No active OTP session. Please request OTP again.");
      }

      if (!/^\d{6}$/.test(otp)) {
        throw new Error("OTP must be 6 digits");
      }

      console.log("🔍 Verifying OTP: " + otp);
      const result = await window.confirmationResult.confirm(otp);

      console.log("✅ OTP verified for:", result.user.phoneNumber);
      return result.user;
    } catch (error: any) {
      console.error("❌ OTP verification failed:", error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log("✅ User signed out");
    } catch (error) {
      console.error("❌ Sign-out error:", error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  cleanup(): void {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        // Ignore error
      }
      window.recaptchaVerifier = undefined;
    }
    // DO NOT clear confirmationResult - it must survive navigation
  }

  private getErrorMessage(error: any): string {
    switch (error.code) {
      case "auth/invalid-phone-number":
        return "Invalid phone number format.";
      case "auth/quota-exceeded":
        return "SMS quota exceeded. Try again later.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment.";
      case "auth/invalid-verification-code":
        return "Invalid OTP. Please try again.";
      case "auth/code-expired":
        return "OTP expired. Request a new one.";
      case "auth/captcha-check-failed":
        return "reCAPTCHA failed. Please retry.";
      default:
        return error.message || "Something went wrong.";
    }
  }
}

export const firebasePhoneAuth = FirebasePhoneAuth.getInstance();
