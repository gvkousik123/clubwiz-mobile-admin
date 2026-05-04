import { api } from '../api-client';

export interface ContactTicket {
  id: string;
  type: 'SUPPORT' | 'FEEDBACK' | 'BUSINESS';
  name: string;
  message: string;
  contactNumber?: string;
  instagramLink?: string;
  whatsAppLink?: string;
  username: string;
  email?: string;
  createdAt: string;
}

export interface ContactResponse {
  status: string;
  message: string;
  timestamp: string;
}

export class ContactService {
  // Get all support tickets for current user
  static async getUserSupportTickets() {
    try {
      const response = await api.get('/contact-form/contact/tickets/business-admin');
      return {
        success: true,
        data: response.data || []
      };
    } catch (error: any) {
      console.error('Error fetching support tickets:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  // Get single ticket detail
  static async getTicketDetail(ticketId: string) {
    try {
      const response = await api.get(`/contact-form/contact/clubwiz_business/${ticketId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error fetching ticket details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Submit business inquiry
  static async submitBusinessInquiry(data: {
    name: string;
    email: string;
    contactNumber: string;
    instagramLink?: string;
    whatsAppLink?: string;
    message: string;
  }) {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        contactNumber: data.contactNumber,
        instagramLink: data.instagramLink || '',
        whatsAppLink: data.whatsAppLink || '',
        message: data.message
      };

      const response = await api.post('/contact-form/contact/clubwiz_business', payload);
      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Business inquiry submitted successfully'
      };
    } catch (error: any) {
      console.error('Error submitting business inquiry:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to submit inquiry'
      };
    }
  }

  // Submit support request/feedback
  static async submitSupportRequest(data: {
    name: string;
    email: string;
    message: string;
    type?: 'SUPPORT' | 'FEEDBACK';
  }) {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        message: data.message,
        type: data.type || 'SUPPORT'
      };

      const response = await api.post('/contact-form/contact/support', payload);
      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Request submitted successfully'
      };
    } catch (error: any) {
      console.error('Error submitting support request:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to submit request'
      };
    }
  }
}
