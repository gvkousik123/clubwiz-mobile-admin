// Temporary Mock Firebase Auth for Development
// This provides a working phone authentication simulation until real Firebase config is available

interface MockConfirmationResult {
  confirm: (code: string) => Promise<{ user: { phoneNumber: string } }>;
}

interface MockRecaptchaVerifier {
  clear: () => void;
}

class MockFirebasePhoneAuth {
  private static instance: MockFirebasePhoneAuth;
  private mockConfirmationResult: MockConfirmationResult | null = null;

  static getInstance(): MockFirebasePhoneAuth {
    if (!MockFirebasePhoneAuth.instance) {
      MockFirebasePhoneAuth.instance = new MockFirebasePhoneAuth();
    }
    return MockFirebasePhoneAuth.instance;
  }

  setupRecaptcha(containerId: string, size: 'invisible' | 'normal' = 'invisible'): void {
    console.log(`Mock reCAPTCHA setup for container: ${containerId}, size: ${size}`);
    
    // Create a mock recaptcha verifier on window
    (window as any).recaptchaVerifier = {
      clear: () => console.log("Mock reCAPTCHA cleared"),
    };
  }

  async sendOTP(phoneNumber: string): Promise<boolean> {
    console.log(`Mock: Sending OTP to ${phoneNumber}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create mock confirmation result
    this.mockConfirmationResult = {
      confirm: async (code: string) => {
        console.log(`Mock: Verifying OTP ${code} for ${phoneNumber}`);
        
        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Accept any 6-digit code for demo
        if (code.length === 6 && /^\d+$/.test(code)) {
          return {
            user: {
              phoneNumber: phoneNumber
            }
          };
        } else {
          throw new Error("Invalid OTP code. Please enter a 6-digit number.");
        }
      }
    };

    // Store in window for access in OTP page
    (window as any).confirmationResult = this.mockConfirmationResult;

    return true;
  }

  async verifyOTP(code: string): Promise<{ user: { phoneNumber: string } }> {
    if (!this.mockConfirmationResult) {
      throw new Error("No OTP verification in progress. Please request a new OTP.");
    }

    return await this.mockConfirmationResult.confirm(code);
  }

  cleanup(): void {
    console.log("Mock: Cleaning up Firebase auth");
    this.mockConfirmationResult = null;
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      delete (window as any).recaptchaVerifier;
    }
    delete (window as any).confirmationResult;
  }

  onAuthStateChanged(callback: (user: any) => void): () => void {
    console.log("Mock: Setting up auth state listener");
    
    // Check if user is already logged in (simulate persistence)
    const savedUser = localStorage.getItem('mockFirebaseUser');
    if (savedUser) {
      setTimeout(() => callback(JSON.parse(savedUser)), 100);
    } else {
      setTimeout(() => callback(null), 100);
    }

    // Return unsubscribe function
    return () => {
      console.log("Mock: Auth state listener unsubscribed");
    };
  }

  async signOut(): Promise<void> {
    console.log("Mock: Signing out user");
    localStorage.removeItem('mockFirebaseUser');
  }

  getCurrentUser(): any {
    const savedUser = localStorage.getItem('mockFirebaseUser');
    return savedUser ? JSON.parse(savedUser) : null;
  }

  // Simulate successful login (for testing)
  simulateLogin(phoneNumber: string): void {
    const mockUser = {
      phoneNumber: phoneNumber,
      uid: 'mock-uid-' + Date.now(),
      displayName: null,
      email: null
    };
    
    localStorage.setItem('mockFirebaseUser', JSON.stringify(mockUser));
    console.log("Mock: User logged in", mockUser);
  }
}

// Export the mock instance
export const mockFirebasePhoneAuth = MockFirebasePhoneAuth.getInstance();

// Instructions for switching to real Firebase
console.log(`
🔧 MOCK FIREBASE AUTH ACTIVE
To switch to real Firebase authentication:
1. Get your Firebase web app config from Firebase Console
2. Update .env.local with real values
3. Import from './phone-auth' instead of './mock-phone-auth'
4. The API is identical, so no code changes needed!

📝 Current behavior:
- Any 6-digit number works as OTP
- No real SMS sent
- User state persisted in localStorage
- Full authentication flow simulation
`);