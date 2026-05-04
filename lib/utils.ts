import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if an event is past/expired using actual date/time comparison
 * Uses IST (UTC+5:30) timezone for comparison
 */
export function isPastEvent(event: any): boolean {
  if (!event || !event.startDateTime) return false;
  
  try {
    const eventDate = new Date(event.startDateTime);
    if (isNaN(eventDate.getTime())) return false;
    
    // Get current time in IST (UTC+5:30)
    const utcDate = new Date();
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    
    return eventDate < istDate; // Event is past if start time is before current IST time
  } catch {
    return false;
  }
}

/**
 * Filter events to remove all past/expired events
 * Keeps only upcoming/future events
 */
export function filterUpcomingEvents(events: any[]): any[] {
  if (!Array.isArray(events)) return [];
  return events.filter(event => !isPastEvent(event));
}

/**
 * Format event pricing with different entry types and ticket types
 * Includes stag entries, couple entries, early bird offers, and ticket types
 */
export interface FormattedEventPrice {
  title: string;
  price: number;
  description?: string;
  remark?: string;
  isEarlyBird?: boolean;
}

export function formatEventPricing(event: any): FormattedEventPrice[] {
  const prices: FormattedEventPrice[] = [];

  // Regular entry prices
  if (event?.maleStagEntry?.price !== undefined && event.maleStagEntry.price !== null) {
    prices.push({
      title: 'Male Stag Entry',
      price: event.maleStagEntry.price,
      description: event.maleStagEntry.description,
      remark: event.maleStagEntry.remark,
      isEarlyBird: false
    });
  }

  if (event?.femaleStagEntry?.price !== undefined && event.femaleStagEntry.price !== null) {
    prices.push({
      title: 'Female Stag Entry',
      price: event.femaleStagEntry.price,
      description: event.femaleStagEntry.description,
      remark: event.femaleStagEntry.remark,
      isEarlyBird: false
    });
  }

  if (event?.coupleEntry?.price !== undefined && event.coupleEntry.price !== null) {
    prices.push({
      title: 'Couple Entry',
      price: event.coupleEntry.price,
      description: event.coupleEntry.description,
      remark: event.coupleEntry.remark,
      isEarlyBird: false
    });
  }

  // Early bird prices
  if (event?.earlyBirdMaleStagEntry?.price !== undefined && event.earlyBirdMaleStagEntry.price !== null) {
    prices.push({
      title: 'Early Bird Male Stag',
      price: event.earlyBirdMaleStagEntry.price,
      description: event.earlyBirdMaleStagEntry.description,
      remark: event.earlyBirdMaleStagEntry.remark,
      isEarlyBird: true
    });
  }

  if (event?.earlyBirdFemaleStagEntry?.price !== undefined && event.earlyBirdFemaleStagEntry.price !== null) {
    prices.push({
      title: 'Early Bird Female Stag',
      price: event.earlyBirdFemaleStagEntry.price,
      description: event.earlyBirdFemaleStagEntry.description,
      remark: event.earlyBirdFemaleStagEntry.remark,
      isEarlyBird: true
    });
  }

  if (event?.earlyBirdCoupleEntry?.price !== undefined && event.earlyBirdCoupleEntry.price !== null) {
    prices.push({
      title: 'Early Bird Couple',
      price: event.earlyBirdCoupleEntry.price,
      description: event.earlyBirdCoupleEntry.description,
      remark: event.earlyBirdCoupleEntry.remark,
      isEarlyBird: true
    });
  }

  // Ticket types with remarks
  if (Array.isArray(event?.ticketTypes)) {
    event.ticketTypes.forEach((ticket: any) => {
      if (ticket?.isActive !== false) {
        prices.push({
          title: ticket.name || 'Ticket',
          price: ticket.price || 0,
          description: `Qty: ${ticket.quantity || 0}`,
          remark: ticket.remark,
          isEarlyBird: false
        });
      }
    });
  }

  return prices;
}

/**
 * Get the lowest price from event pricing options
 */
export function getEventLowestPrice(event: any): number {
  const prices = formatEventPricing(event);
  if (prices.length === 0) return 0;
  return Math.min(...prices.map(p => p.price));
}

/**
 * Get event/club logo - prioritize logo field over imageUrl
 */
export function getEventOrClubLogo(entity: any): string | null {
  if (!entity) return null;
  
  // Try logo field first (for clubs/events)
  if (entity.logo) return entity.logo;
  if (entity.clubLogo) return entity.clubLogo;
  if (entity.venueLogo) return entity.venueLogo;
  if (entity.eventOrganizerLogo) return entity.eventOrganizerLogo;
  
  // Fallback to imageUrl
  if (entity.imageUrl) return entity.imageUrl;
  if (entity.logoUrl) return entity.logoUrl;
  
  return null;
}
