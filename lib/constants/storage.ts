export const STORAGE_KEYS = {
  accessToken: 'clubviz-accessToken',
  refreshToken: 'clubviz-refreshToken',
  user: 'clubviz-user',
  pendingPhone: 'clubviz-pendingPhone',
  userDetails: 'clubviz-userDetails',
  ownedClubId: 'clubviz-ownedClubId',
  // Club registration form data
  clubFormData: 'clubviz-form-data',
  clubLogoPreview: 'clubviz-logo-preview',
  clubFoodDrinksPreview: 'clubviz-food-drinks-preview',
  clubAmbiencePreview: 'clubviz-ambience-preview',
  clubMenuPreview: 'clubviz-menu-preview',
  clubSelectedLocation: 'clubviz-selected-location',
  clubSelectedMusicGenres: 'clubviz-selected-music-genres',
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;
