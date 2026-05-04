import { useState } from 'react';
import { ContactService } from '@/lib/services/contact.service';
import { useToast } from './use-toast';

export function useContact() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submitBusinessEnquiry = async (data: {
    name: string;
    email?: string;
    contactNumber: string;
    instagramLink?: string;
    whatsAppLink?: string;
    message: string;
  }) => {
    setLoading(true);
    try {
      const result = await ContactService.submitBusinessInquiry({
        name: data.name,
        email: data.email || '',
        contactNumber: data.contactNumber,
        instagramLink: data.instagramLink,
        whatsAppLink: data.whatsAppLink,
        message: data.message
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Business inquiry submitted successfully',
          variant: 'success'
        });
        return true;
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit inquiry',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error submitting business enquiry:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while submitting your inquiry',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitSupportRequest = async (data: {
    name: string;
    email: string;
    message: string;
    type?: 'SUPPORT' | 'FEEDBACK';
  }) => {
    setLoading(true);
    try {
      const result = await ContactService.submitSupportRequest({
        name: data.name,
        email: data.email,
        message: data.message,
        type: data.type || 'SUPPORT'
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Request submitted successfully',
          variant: 'success'
        });
        return true;
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit request',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error submitting support request:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while submitting your request',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    submitBusinessEnquiry,
    submitSupportRequest
  };
}
