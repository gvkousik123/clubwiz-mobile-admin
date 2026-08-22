import { api, handleApiError } from '../api-client';

// ============================================================================
// HOME CAROUSEL — ADMIN SERVICE
//
// Backs the app home-screen carousel: promoted partner EVENT slides plus
// admin-authored non-event PROMO slides. All mutate endpoints require
// ADMIN or SUPERADMIN.
//
// Base path: /event-management/events/carousel
// ============================================================================

export type SlideStatus = 'live' | 'scheduled' | 'paused';
export type PosterSource = 'club' | 'custom';
export type SlideType = 'EVENT' | 'PROMO';

/** Subset of EventCardResponse the carousel screen renders. Extra fields tolerated. */
export interface CarouselEventCard {
  id: string;
  title: string;
  clubId?: string;
  clubName?: string;
  clubLogo?: string;
  imageUrl?: string;
  location?: string;
  formattedDate?: string;
  formattedTime?: string;
  startDateTime?: string;
  [key: string]: unknown;
}

/** The render entity shared by event and promo slides (HomeCarouselSlideResponse). */
export interface HomeCarouselSlide {
  id?: string;
  slideType?: SlideType;
  title?: string;
  subtitle?: string;
  venueLabel?: string;
  dateLabel?: string;
  imageUrl?: string;
  linkUrl?: string;
  badgeLabel?: string;
  /** Display order across the merged carousel — used to build the hero preview. */
  carouselOrder?: number;
  displayOrder?: number;
  status?: SlideStatus;
  isActive?: boolean;
  [key: string]: unknown;
}

/** The stored PROMO entity (non-event slide). */
export interface PromoCarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  venueLabel?: string;
  dateLabel?: string;
  imageUrl?: string;
  linkUrl?: string;
  badgeLabel?: string;
  displayOrder?: number;
  status?: SlideStatus;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface CarouselEventItem {
  slideType: 'EVENT';
  event: CarouselEventCard;
  slide: HomeCarouselSlide;
  posterSource: PosterSource;
  status: SlideStatus;
}

export interface CarouselPromoItem {
  slideType: 'PROMO';
  promo: PromoCarouselSlide;
  slide: HomeCarouselSlide;
  posterSource: PosterSource;
  status: SlideStatus;
}

export interface CarouselManageResponse {
  carousel: CarouselEventItem[];
  promos: CarouselPromoItem[];
  partners: CarouselEventCard[];
  carouselCount: number;
  promoCount: number;
  partnerCount: number;
}

export interface CreatePromoRequest {
  title: string;
  subtitle?: string;
  venueLabel?: string;
  dateLabel?: string;
  imageUrl?: string;
  linkUrl?: string;
  badgeLabel?: string;
  displayOrder?: number;
  status?: SlideStatus;
  isActive?: boolean;
}

export type UpdatePromoRequest = Partial<CreatePromoRequest>;

const BASE = '/event-management/events/carousel';

/**
 * Endpoints in the doc return the entity directly, but a gateway may wrap it in
 * the standard `{ success, data }` envelope. Accept either so a change in
 * wrapping does not silently break the screen.
 */
const unwrap = <T>(body: any): T =>
  body && typeof body === 'object' && 'data' in body && !('carousel' in body)
    ? (body.data as T)
    : (body as T);

const EMPTY_MANAGE: CarouselManageResponse = {
  carousel: [],
  promos: [],
  partners: [],
  carouselCount: 0,
  promoCount: 0,
  partnerCount: 0,
};

export class CarouselService {
  /** 4.1 — admin page bootstrap. */
  static async getManage(search = '', partnerLimit = 40): Promise<CarouselManageResponse> {
    try {
      const res = await api.get<CarouselManageResponse>(`${BASE}/manage`, {
        params: { search, partnerLimit },
      });
      const data = unwrap<CarouselManageResponse>(res.data);
      // Defend the render code against any missing collection.
      return { ...EMPTY_MANAGE, ...data };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ---- 4.2 event slides ----

  /** Promote a partner event onto the carousel. */
  static async promoteEvent(eventId: string): Promise<HomeCarouselSlide> {
    try {
      const res = await api.post<HomeCarouselSlide>(
        `/event-management/events/${eventId}/carousel/promote`,
      );
      return unwrap<HomeCarouselSlide>(res.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** Remove an event from the carousel; returns it to the partner pool. */
  static async removeEvent(eventId: string): Promise<CarouselEventCard> {
    try {
      const res = await api.delete<CarouselEventCard>(
        `/event-management/events/${eventId}/carousel/promote`,
      );
      return unwrap<CarouselEventCard>(res.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /** 4.3 — reorder event slides; array index is display order. */
  static async reorderEvents(eventIds: string[]): Promise<void> {
    try {
      await api.put(`${BASE}/reorder`, { eventIds });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  // ---- 4.4 promo (non-event) slides ----

  static async createPromo(body: CreatePromoRequest): Promise<HomeCarouselSlide> {
    try {
      const res = await api.post<HomeCarouselSlide>(`${BASE}/promos`, body);
      return unwrap<HomeCarouselSlide>(res.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async updatePromo(promoId: string, body: UpdatePromoRequest): Promise<HomeCarouselSlide> {
    try {
      const res = await api.put<HomeCarouselSlide>(`${BASE}/promos/${promoId}`, body);
      return unwrap<HomeCarouselSlide>(res.data);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  static async deletePromo(promoId: string): Promise<void> {
    try {
      await api.delete(`${BASE}/promos/${promoId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Reorder promo slides. The body key is `eventIds` for historical reasons —
   * pass promo ids in the desired order.
   */
  static async reorderPromos(promoIds: string[]): Promise<void> {
    try {
      await api.put(`${BASE}/promos/reorder`, { eventIds: promoIds });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}
