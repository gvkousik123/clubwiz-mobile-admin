/**
 * Event Pricing Utilities
 * Shared helper functions for ticket pricing and cover charge logic
 */

/**
 * Determines if a ticket type supports redeemable cover
 * Cover only applies to stag/couple and guest-list tickets, NOT general admission
 */
export function ticketSupportsCover(name: string): boolean {
  if (!name) return false;
  
  const lowerName = name.toLowerCase();
  
  // Stag/couple tickets support cover
  if (lowerName.includes('stag') || lowerName.includes('couple')) {
    return true;
  }
  
  // Guest list tickets support cover
  if (lowerName.includes('guest list')) {
    return true;
  }
  
  // General admission tickets do NOT support cover
  if (lowerName.includes('general')) {
    return false;
  }
  
  // Custom names (VIP, Early Bird, etc.) do not support cover by default
  return false;
}

/**
 * Detects if a ticket name is a guest-list ticket
 */
export function isGuestListName(name: string): boolean {
  if (!name) return false;
  return name.toLowerCase().includes('guest list');
}

/**
 * Detects if a ticket name is a standalone general admission ticket
 */
export function isStandaloneGeneralName(name: string): boolean {
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return lowerName === 'general entry' || lowerName === 'general admission';
}

/**
 * Detects if a ticket name is a general-tier ticket (post-guest-list)
 */
export function isGeneralTierTicketName(name: string): boolean {
  if (!name) return false;
  return name.toLowerCase().startsWith('general -');
}

/**
 * Normalizes ticket types for API submission
 * Maps redeemCover -> coverCharge and strips cover for general tickets
 */
export function normalizeTicketTypesForApi(tickets: any[]): any[] {
  return tickets.map(ticket => {
    const normalized: any = {
      name: ticket.name,
      price: ticket.price,
      currency: ticket.currency || 'INR',
      isActive: ticket.isActive ?? true,
    };
    
    // Only include coverCharge if the ticket type supports it
    if (ticketSupportsCover(ticket.name) && ticket.redeemCover > 0) {
      normalized.coverCharge = ticket.redeemCover;
    }
    
    if (ticket.remark) {
      normalized.remark = ticket.remark;
    }
    
    return normalized;
  });
}

/**
 * Builds generalPricing object from ticket types
 * Maps ticket names to general pricing fields
 * Returns { generalPricing, customTickets } where customTickets are tickets that don't map to standard categories
 */
export function buildGeneralPricingFromTickets(tickets: any[], includeAbsentStandardCategoriesAsNull: boolean = false): any {
  const pricing: any = {};
  
  const customTickets: any[] = [];
  let hasPricing = false;
  
  const standardCategories = {
    maleStagEntry: false,
    femaleStagEntry: false,
    coupleEntry: false,
  };
  
  tickets.forEach(ticket => {
    const lowerName = ticket.name.toLowerCase();
    
    // Skip guest list tickets - they belong in guestListPricing
    if (lowerName.includes('guest list')) {
      return;
    }
    
    // Skip inactive tickets - set to null for standard categories
    if (ticket.isActive === false) {
      let isStandardCategory = false;
      
      if (lowerName.includes('male stag') || lowerName === 'male stag entry') {
        pricing.maleStagEntry = null;
        standardCategories.maleStagEntry = true;
        hasPricing = true;
        isStandardCategory = true;
      }
      
      if (lowerName.includes('female stag') || lowerName === 'female stag entry') {
        pricing.femaleStagEntry = null;
        standardCategories.femaleStagEntry = true;
        hasPricing = true;
        isStandardCategory = true;
      }
      
      if (lowerName.includes('couple') || lowerName === 'couple entry') {
        pricing.coupleEntry = null;
        standardCategories.coupleEntry = true;
        hasPricing = true;
        isStandardCategory = true;
      }
      
      // Don't add inactive custom tickets to the array
      if (!isStandardCategory) {
        return;
      }
    }
    
    let isStandardCategory = false;
    
    // Map to stag/couple fields
    if (lowerName.includes('male stag') || lowerName === 'male stag entry') {
      pricing.maleStagEntry = {
        price: ticket.price,
        ...(ticket.redeemCover > 0 ? { fee: ticket.redeemCover } : {}),
        ...(ticket.remark ? { description: ticket.remark } : {}),
      };
      standardCategories.maleStagEntry = true;
      hasPricing = true;
      isStandardCategory = true;
    }
    
    if (lowerName.includes('female stag') || lowerName === 'female stag entry') {
      pricing.femaleStagEntry = {
        price: ticket.price,
        ...(ticket.redeemCover > 0 ? { fee: ticket.redeemCover } : {}),
        ...(ticket.remark ? { description: ticket.remark } : {}),
      };
      standardCategories.femaleStagEntry = true;
      hasPricing = true;
      isStandardCategory = true;
    }
    
    if (lowerName.includes('couple') || lowerName === 'couple entry') {
      pricing.coupleEntry = {
        price: ticket.price,
        ...(ticket.redeemCover > 0 ? { fee: ticket.redeemCover } : {}),
        ...(ticket.remark ? { description: ticket.remark } : {}),
      };
      standardCategories.coupleEntry = true;
      hasPricing = true;
      isStandardCategory = true;
    }
    
    // General Entry maps to all three categories (price only, no cover)
    if (isStandaloneGeneralName(ticket.name)) {
      const entry = {
        price: ticket.price,
        ...(ticket.remark ? { description: ticket.remark } : {}),
      };
      pricing.maleStagEntry = entry;
      pricing.femaleStagEntry = entry;
      pricing.coupleEntry = entry;
      standardCategories.maleStagEntry = true;
      standardCategories.femaleStagEntry = true;
      standardCategories.coupleEntry = true;
      hasPricing = true;
      isStandardCategory = true;
    }
    
    // If not a standard category, add to custom tickets
    if (!isStandardCategory) {
      customTickets.push(ticket);
    }
  });
  
  if (includeAbsentStandardCategoriesAsNull) {
    if (!standardCategories.maleStagEntry) {
      pricing.maleStagEntry = null;
      hasPricing = true;
    }
    if (!standardCategories.femaleStagEntry) {
      pricing.femaleStagEntry = null;
      hasPricing = true;
    }
    if (!standardCategories.coupleEntry) {
      pricing.coupleEntry = null;
      hasPricing = true;
    }
  }
  
  // Only set enabled: true if we have pricing entries
  if (hasPricing) {
    pricing.enabled = true;
  }
  
  return {
    generalPricing: hasPricing ? pricing : null,
    customTickets
  };
}

/**
 * Builds guestListPricing object from ticket types
 * Maps guest list ticket names to guest list pricing fields
 * @param tickets - Array of ticket types
 * @param cutoffTime - Optional cutoff time string (e.g., "21:00:00")
 */
export function buildGuestListPricingFromTickets(tickets: any[], cutoffTime?: string, includeAbsentStandardCategoriesAsNull: boolean = false): any | null {
  const pricing: any = {};
  
  let hasPricing = false;
  const standardCategories = {
    maleStagEntry: false,
    femaleStagEntry: false,
    coupleEntry: false,
  };
  
  tickets.forEach(ticket => {
    const lowerName = ticket.name.toLowerCase();
    
    // Only process guest list tickets
    if (!lowerName.includes('guest list')) {
      return;
    }
    
    // Skip inactive tickets - set to null
    if (ticket.isActive === false) {
      if (lowerName.includes('male stag')) {
        pricing.maleStagEntry = null;
        standardCategories.maleStagEntry = true;
        hasPricing = true;
      }
      
      if (lowerName.includes('female stag')) {
        pricing.femaleStagEntry = null;
        standardCategories.femaleStagEntry = true;
        hasPricing = true;
      }
      
      if (lowerName.includes('couple')) {
        pricing.coupleEntry = null;
        standardCategories.coupleEntry = true;
        hasPricing = true;
      }
      return;
    }
    
    if (lowerName.includes('male stag')) {
      pricing.maleStagEntry = {
        price: ticket.price,
        ...(ticket.redeemCover > 0 ? { fee: ticket.redeemCover } : {}),
        ...(ticket.remark ? { description: ticket.remark } : {}),
      };
      standardCategories.maleStagEntry = true;
      hasPricing = true;
    }
    
    if (lowerName.includes('female stag')) {
      pricing.femaleStagEntry = {
        price: ticket.price,
        ...(ticket.redeemCover > 0 ? { fee: ticket.redeemCover } : {}),
        ...(ticket.remark ? { description: ticket.remark } : {}),
      };
      standardCategories.femaleStagEntry = true;
      hasPricing = true;
    }
    
    if (lowerName.includes('couple')) {
      pricing.coupleEntry = {
        price: ticket.price,
        ...(ticket.redeemCover > 0 ? { fee: ticket.redeemCover } : {}),
        ...(ticket.remark ? { description: ticket.remark } : {}),
      };
      standardCategories.coupleEntry = true;
      hasPricing = true;
    }
  });
  
  if (includeAbsentStandardCategoriesAsNull) {
    if (!standardCategories.maleStagEntry) {
      pricing.maleStagEntry = null;
      hasPricing = true;
    }
    if (!standardCategories.femaleStagEntry) {
      pricing.femaleStagEntry = null;
      hasPricing = true;
    }
    if (!standardCategories.coupleEntry) {
      pricing.coupleEntry = null;
      hasPricing = true;
    }
  }
  
  // Only set enabled: true if we have pricing entries
  if (hasPricing) {
    pricing.enabled = true;
    // Add cutoff time if provided
    if (cutoffTime) {
      pricing.cutoffTime = cutoffTime;
    }
  }
  
  return hasPricing ? pricing : null;
}
