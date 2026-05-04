import { useState, useCallback } from 'react';
import { PasswordService, PasswordResetResponse } from '@/lib/services/password.service';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// PASSWORD HOOK INTERFACE
// ============================================================================

interface UsePasswordReturn {
  // Loading states
  isLoading: boolean;
  isInitiatingReset: boolean;
  isResettingPassword: boolean;
  
  // Password reset operations
  initiatePasswordReset: (contact: string) => Promise<boolean>;
  resetPasswordWithMobile: (mobileNumber: string, newPassword: string) => Promise<boolean>;
  
  // Utility functions
  validatePassword: (password: string) => { isValid: boolean; errors: string[] };
  getPasswordStrength: (password: string) => 'weak' | 'medium' | 'strong';
  getPasswordStrengthColor: (level: 'weak' | 'medium' | 'strong') => string;
  isValidEmail: (email: string) => boolean;
  isValidMobile: (mobile: string) => boolean;
  getContactType: (contact: string) => 'email' | 'mobile' | 'unknown';
}

// ============================================================================
// PASSWORD HOOK
// ============================================================================

export const usePassword = (): UsePasswordReturn => {
  const { toast } = useToast();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isInitiatingReset, setIsInitiatingReset] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const showSuccessToast = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  }, [toast]);

  const showErrorToast = useCallback((title: string, description?: string) => {
    toast({
      title,
      description: description || "An unexpected error occurred",
      variant: "destructive",
    });
  }, [toast]);

  // ============================================================================
  // PASSWORD RESET OPERATIONS
  // ============================================================================

  const initiatePasswordReset = useCallback(async (contact: string): Promise<boolean> => {
    if (!contact.trim()) {
      showErrorToast('Invalid Input', 'Please enter your email or mobile number');
      return false;
    }

    const contactType = PasswordService.getContactType(contact.trim());
    
    if (contactType === 'unknown') {
      showErrorToast('Invalid Format', 'Please enter a valid email or mobile number');
      return false;
    }

    setIsInitiatingReset(true);
    setIsLoading(true);
    
    try {
      let result: PasswordResetResponse;
      
      if (contactType === 'email') {
        result = await PasswordService.initiatePasswordResetWithEmail(contact.trim());
        showSuccessToast(
          'Reset Link Sent',
          'A password reset link has been sent to your email address'
        );
      } else {
        const formattedMobile = PasswordService.prepareMobileForAPI(contact.trim());
        result = await PasswordService.initiatePasswordResetWithMobile(formattedMobile);
        showSuccessToast(
          'OTP Sent',
          'An OTP has been sent to your mobile number for password reset'
        );
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate password reset';
      showErrorToast('Reset Failed', errorMessage);
      return false;
    } finally {
      setIsInitiatingReset(false);
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  const resetPasswordWithMobile = useCallback(async (
    mobileNumber: string, 
    newPassword: string
  ): Promise<boolean> => {
    if (!mobileNumber.trim()) {
      showErrorToast('Invalid Input', 'Please enter your mobile number');
      return false;
    }

    if (!PasswordService.isValidMobileNumber(mobileNumber)) {
      showErrorToast('Invalid Mobile', 'Please enter a valid mobile number');
      return false;
    }

    const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      showErrorToast('Weak Password', passwordValidation.errors.join('. '));
      return false;
    }

    setIsResettingPassword(true);
    setIsLoading(true);
    
    try {
      const formattedMobile = PasswordService.prepareMobileForAPI(mobileNumber.trim());
      const result = await PasswordService.resetPasswordWithMobile(formattedMobile, newPassword);
      
      showSuccessToast(
        'Password Reset Successful',
        'Your password has been reset successfully. You can now login with your new password.'
      );
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      showErrorToast('Reset Failed', errorMessage);
      return false;
    } finally {
      setIsResettingPassword(false);
      setIsLoading(false);
    }
  }, [showSuccessToast, showErrorToast]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const validatePassword = useCallback((password: string) => {
    return PasswordService.validatePasswordStrength(password);
  }, []);

  const getPasswordStrength = useCallback((password: string) => {
    return PasswordService.getPasswordStrengthLevel(password);
  }, []);

  const getPasswordStrengthColor = useCallback((level: 'weak' | 'medium' | 'strong') => {
    return PasswordService.getPasswordStrengthColor(level);
  }, []);

  const isValidEmail = useCallback((email: string) => {
    return PasswordService.isValidEmail(email);
  }, []);

  const isValidMobile = useCallback((mobile: string) => {
    return PasswordService.isValidMobileNumber(mobile);
  }, []);

  const getContactType = useCallback((contact: string) => {
    return PasswordService.getContactType(contact);
  }, []);

  return {
    // Loading states
    isLoading,
    isInitiatingReset,
    isResettingPassword,
    
    // Password reset operations
    initiatePasswordReset,
    resetPasswordWithMobile,
    
    // Utility functions
    validatePassword,
    getPasswordStrength,
    getPasswordStrengthColor,
    isValidEmail,
    isValidMobile,
    getContactType,
  };
};