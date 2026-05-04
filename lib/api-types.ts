// Common API Response Structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Authentication Types
export interface LoginRequest {
  usernameOrEmail?: string;
  phone?: string;
  email?: string;
  password?: string;
  otp?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface OTPRequest {
  phone: string;
  type: 'login' | 'register' | 'forgot_password';
}

export interface OTPVerifyRequest {
  phone: string;
  otp: string;
  type: 'login' | 'register' | 'forgot_password';
}

export interface AuthResponse {
  user?: User;
  token: string;
  refreshToken: string;
  expiresIn?: number;
  [key: string]: any;
}

// User Types
export interface User {
  id: string;
  username?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age?: number;
  avatar?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  roles?: string[];
}

export interface UserPreferences {
  favoriteClubs: string[];
  favoriteEvents: string[];
  musicGenres: string[];
  drinkPreferences: string[];
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  eventReminders: boolean;
  promotions: boolean;
}

// Club Types
export interface Club {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website?: string;
  images: string[];
  logo?: string;
  rating: number;
  reviewCount: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  categories: string[];
  amenities: string[];
  openingHours: OpeningHours[];
  socialMedia: SocialMedia;
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OpeningHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
  openTime: string; // "18:00"
  closeTime: string; // "02:00"
  isClosed: boolean;
}

export interface SocialMedia {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
}

export interface ClubsFilter {
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in km
  };
  priceRange?: ('$' | '$$' | '$$$' | '$$$$')[];
  categories?: string[];
  amenities?: string[];
  rating?: number;
  sortBy?: 'name' | 'rating' | 'distance' | 'popularity' | 'price';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Event Types
export interface Event {
  id: string;
  title: string;
  description: string;
  clubId: string;
  club?: Club;
  coverImage?: string;
  imageUrl?: string;
  images?: string[];
  location: string;
  locationText?: string;
  locationMap?: {
    lat: number;
    lng: number;
  };
  startDateTime: string;
  endDateTime: string;
  formattedTime?: string;
  timeUntilEvent?: string;
  ticketPrice?: {
    min: number;
    max: number;
    currency: string;
  };
  ticketTypes?: TicketType[];
  maxAttendees?: number;
  capacity?: number;
  attendedCount?: number;
  soldTickets?: number;
  maxAttended?: number;
  isRegistered?: boolean;
  rsvpStatus?: 'NOT_REGISTERED' | 'REGISTERED';
  ageRestriction?: number;
  dressCode?: string;
  musicGenres?: string[];
  performers?: Performer[];
  isPublic: boolean;
  requiresApproval: boolean;
  isActive?: boolean;
  featured?: boolean;
  tags?: string[];
  organizer?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string;
    displayName: string;
    fullName: string;
  };
  recentAttendees?: Array<{
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string;
    displayName: string;
    fullName: string;
    rsvpStatus: string;
    registeredAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Attending Event with additional details
export interface AttendingEvent {
  id: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  imageUrl?: string;
  images?: string[];
  locationMap?: {
    lat: number;
    lng: number;
  };
  clubId?: string;
  club: {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    images?: string[];
  };
  locationTypes?: string[];
  foodCuisines?: string[];
  facilities?: string[];
  music?: string[];
  ambiance?: string[];
  entryPricing?: {
    completeEntryPrice?: number;
    maleEntryPrice?: number;
    femaleEntryPrice?: number;
    coupleEntryPrice?: number;
    priceDetails?: string;
    hasTimeRestrictions?: boolean;
    lastTimeRestrictions?: string;
    inclusions?: string[];
  };
  roles?: Array<{
    role: string;
  }>;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  description?: string;
  quantity: number;
  sold: number;
  isActive: boolean;
}

export interface Performer {
  id: string;
  name: string;
  type: 'dj' | 'band' | 'artist' | 'performer';
  image?: string;
  bio?: string;
  socialMedia: SocialMedia;
}

export interface EventsFilter {
  clubId?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  musicGenres?: string[];
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  sortBy?: 'date' | 'price' | 'popularity' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Booking Types
export interface BookingRequest {
  eventId?: string;
  clubId?: string;
  bookingType: 'event' | 'table' | 'general';
  dateTime: string;
  guestCount: number;
  tableId?: string;
  ticketTypeId?: string;
  quantity?: number;
  contactInfo: ContactInfo;
  specialRequests?: string;
  promoCode?: string;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  userId: string;
  user: User;
  eventId?: string;
  event?: Event;
  clubId: string;
  club: Club;
  bookingType: 'event' | 'table' | 'general';
  dateTime: string;
  guestCount: number;
  tableId?: string;
  table?: Table;
  ticketTypeId?: string;
  ticketType?: TicketType;
  quantity: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  contactInfo: ContactInfo;
  specialRequests?: string;
  promoCode?: string;
  qrCode: string;
  ticket?: TicketInfo;
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  floor: string;
  section: string;
  isVip: boolean;
  minimumSpend: number;
  position: {
    x: number;
    y: number;
  };
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
}

export interface TicketInfo {
  ticketNumber: string;
  qrCode: string;
  downloadUrl: string;
  isValid: boolean;
  usedAt?: string;
}

// Payment Types
export interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'upi' | 'wallet' | 'netbanking';
  paymentDetails: any; // Payment gateway specific data
}

export interface PaymentResponse {
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  gatewayResponse: any;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  user: User;
  clubId?: string;
  eventId?: string;
  rating: number;
  title: string;
  content: string;
  images: string[];
  isVerified: boolean;
  helpfulCount: number;
  reportCount: number;
  response?: ClubResponse;
  createdAt: string;
  updatedAt: string;
}

export interface ClubResponse {
  content: string;
  respondedAt: string;
  respondedBy: string;
}

export interface ReviewRequest {
  clubId?: string;
  eventId?: string;
  rating: number;
  title: string;
  content: string;
  images?: File[];
}

export interface ReviewsFilter {
  clubId?: string;
  eventId?: string;
  rating?: number;
  sortBy?: 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful';
  page?: number;
  limit?: number;
}

// Story Types
export interface Story {
  id: string;
  clubId: string;
  club: Club;
  mediaUrl?: string;
  mediaUrl1?: string;
  mediaUrl2?: string;
  mediaBase64?: string;
  mediaType: 'image' | 'video';
  duration: number; // in seconds
  title?: string;
  description?: string;
  caption?: string;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
  userId?: string;
  userFullName?: string;
  userProfilePicture?: string;
  fileName?: string;
  fileSize?: number;
}

export interface StoryView {
  storyId: string;
  userId: string;
  viewedAt: string;
}

// Location Types
export interface LocationSearchRequest {
  query?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in km
  type?: 'club' | 'event' | 'all';
}

export interface LocationResult {
  id: string;
  name: string;
  type: 'club' | 'event';
  address: string;
  latitude: number;
  longitude: number;
  distance?: number; // in km
  rating: number;
  image: string;
}

// Analytics Types
export interface Analytics {
  clubViews: number;
  eventViews: number;
  bookings: number;
  revenue: number;
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'booking' | 'event' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

// Upload Types
export interface UploadRequest {
  file: File;
  type: 'avatar' | 'club_image' | 'event_image' | 'review_image' | 'story';
  metadata?: any;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

// ============================================================================
// NEW API TYPES - BASED ON SCREENSHOT INTEGRATIONS
// ============================================================================

// Smart Search API Types
export interface SmartSearchResult {
  id: string;
  type: 'club' | 'event';
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  location: string;
  relevanceScore: number;
  clubId?: string;
  clubName?: string;
}

export interface SmartSearchResponse {
  query: string;
  totalResults: number;
  results: SmartSearchResult[];
  suggestedQueries: string[];
}

// Firebase Authentication Types
export interface FirebaseTokenRequest {
  token: string;
}

export interface FirebaseTokenResponse {
  existingUser: boolean;
  jwtTokens: {
    accessToken: string;
    refreshToken: string;
  };
  id: string;
  email: string;
  username: string;
  mobileNumber: string;
  roles: string[];
  verified: boolean;
  type?: string;
}

// Mobile OTP Types
export interface MobileOTPRequest {
  mobileNumber: string;
}

export interface MobileOTPResponse {
  message: string;
  sessionId: string;
  expiryTime: string;
}

export interface EmailOTPRequest {
  email: string;
}

export interface EmailOTPResponse {
  message: string;
  sessionId: string;
  expiryTime: string;
}

// Password Reset Types
export interface PasswordResetRequest {
  email: string;
  mobileNumber?: string;
}

export interface PasswordResetVerifyRequest {
  token: string;
  otp: string;
}

export interface PasswordResetCompleteRequest {
  email: string;
  otp: string;
  newPassword: string;
}

// Role Management Types
export interface AddRoleRequest {
  username: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

export interface RemoveRoleRequest {
  username: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

export interface AddRoleToUserRequest {
  username: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

export interface RoleOperationResponse {
  message: string;
  success: boolean;
}

// User Management Types
export interface ActivateUserRequest {
  username: string;
}

export interface DeactivateUserRequest {
  username: string;
}

export interface UserStatusResponse {
  message: string;
  isActive: boolean;
}

// Session Management Types
export interface SessionInfo {
  sessionId: string;
  userId: string;
  username: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
}

export interface CORSOriginsResponse {
  origins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge: number;
}

// Google Authentication Types
export interface GoogleSignInRequest {
  idToken: string;
}

export interface GoogleSignInResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    profilePicture?: string;
    isEmailVerified: boolean;
  };
}
// ============================================================================
// TICKET TYPES
// ============================================================================

export interface CreateTicketRequest {
  orderId: string;
}

export interface GenerateTicketRequest {
  orderId: string;
}

export interface TicketResponse {
  ticketId: string;
  orderId: string;
  ticketNumber?: string;
  qrCode?: string;
  downloadUrl?: string;
  isValid?: boolean;
  status?: 'ACTIVE' | 'USED' | 'CANCELLED' | 'EXPIRED';
  eventId?: string;
  clubId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Payment related
  paymentStatus?: 'PENDING' | 'SUCCESS' | 'FAILED';
  paymentId?: string;
  amount?: number;
  currency?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  sessionId: string; // Cashfree session ID
  amount: number;
  currency: string;
  paymentUrl?: string;
}
