/**
 * Image utilities for handling fallbacks and static assets
 */

// Default static images for clubs
export const DEFAULT_CLUB_IMAGES = [
  '/venue/Screenshot 2024-12-10 195651.png',
  '/venue/Screenshot 2024-12-10 195852.png',
  '/venue/Screenshot 2024-12-10 200154.png',
];

// Default static images for events
export const DEFAULT_EVENT_IMAGES = [
  '/event page going people/Screenshot 2024-12-10 162542.png',
  '/event page going people/Screenshot 2024-12-10 162604.png',
  '/event page going people/Screenshot 2024-12-10 162623.png',
];

/**
 * Get a fallback club image when the provided image URL is invalid or placeholder
 * @param originalUrl - The original image URL from API
 * @param clubId - Optional club ID to ensure consistent fallback
 * @returns Valid image URL (static fallback if original is invalid)
 */
export function getClubImageWithFallback(originalUrl?: string, clubId?: string): string {
  // Check if originalUrl is empty, null, placeholder, or invalid
  if (!originalUrl ||
    originalUrl.includes('placeholder') ||
    originalUrl.includes('example.com') ||
    originalUrl === 'string' ||
    originalUrl.trim() === '') {

    // Use club ID to get consistent fallback image
    if (clubId) {
      const index = parseInt(clubId.slice(-1)) % DEFAULT_CLUB_IMAGES.length;
      return DEFAULT_CLUB_IMAGES[index] || DEFAULT_CLUB_IMAGES[0];
    }

    // Random fallback if no club ID
    return DEFAULT_CLUB_IMAGES[Math.floor(Math.random() * DEFAULT_CLUB_IMAGES.length)];
  }

  return originalUrl;
}

/**
 * Get a fallback event image when the provided image URL is invalid or placeholder
 * @param originalUrl - The original image URL from API
 * @param eventId - Optional event ID to ensure consistent fallback
 * @returns Valid image URL (static fallback if original is invalid)
 */
export function getEventImageWithFallback(originalUrl?: string, eventId?: string): string {
  // Check if originalUrl is empty, null, placeholder, or invalid
  if (!originalUrl ||
    originalUrl.includes('placeholder') ||
    originalUrl.includes('example.com') ||
    originalUrl === 'string' ||
    originalUrl.trim() === '') {

    // Use event ID to get consistent fallback image
    if (eventId) {
      const index = parseInt(eventId.slice(-1)) % DEFAULT_EVENT_IMAGES.length;
      return DEFAULT_EVENT_IMAGES[index] || DEFAULT_EVENT_IMAGES[0];
    }

    // Random fallback if no event ID
    return DEFAULT_EVENT_IMAGES[Math.floor(Math.random() * DEFAULT_EVENT_IMAGES.length)];
  }

  return originalUrl;
}

/**
 * Get multiple club images with fallbacks
 * @param images - Array of image objects from API
 * @param clubId - Optional club ID for consistent fallbacks
 * @returns Array of valid image URLs
 */
export function getClubImagesWithFallback(images?: Array<{ type: string, url: string }>, clubId?: string): string[] {
  if (!images || images.length === 0) {
    return [getClubImageWithFallback(undefined, clubId)];
  }

  return images.map((img, index) =>
    getClubImageWithFallback(img.url, `${clubId}-${index}`)
  );
}

/**
 * Handle image load error by setting fallback
 * @param event - Image error event
 * @param fallbackUrl - Fallback image URL
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>, fallbackUrl: string) {
  const target = event.target as HTMLImageElement;
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
}

/**
 * Get club logo with fallback
 * @param logoUrl - Original logo URL
 * @param clubId - Club ID for consistent fallback
 * @returns Valid logo URL
 */
export function getClubLogoWithFallback(logoUrl?: string, clubId?: string): string {
  return getClubImageWithFallback(logoUrl, clubId);
}

/**
 * Convert a File object to base64 string
 * @param file - File object to convert
 * @returns Promise resolving to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract only the base64 part (remove data:image/...;base64, prefix)
      const base64String = result.split(',')[1] || result;
      resolve(base64String);
    };
    reader.onerror = (error) => {
      reject(new Error(`Failed to convert file to base64: ${error}`));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convert multiple File objects to base64 strings
 * @param files - Array of File objects to convert
 * @returns Promise resolving to array of base64 strings
 */
export async function filesToBase64Array(files: File[]): Promise<string[]> {
  return Promise.all(files.map(file => fileToBase64(file)));
}