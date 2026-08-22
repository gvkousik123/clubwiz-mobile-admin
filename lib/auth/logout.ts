import { STORAGE_KEYS } from '../constants/storage';

export function logoutUser() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.userDetails);
  localStorage.removeItem('userRoles');

  localStorage.removeItem(STORAGE_KEYS.clubFormData);
  localStorage.removeItem(STORAGE_KEYS.clubLogoPreview);
  localStorage.removeItem(STORAGE_KEYS.clubFoodDrinksPreview);
  localStorage.removeItem(STORAGE_KEYS.clubAmbiencePreview);
  localStorage.removeItem(STORAGE_KEYS.clubMenuPreview);
  localStorage.removeItem(STORAGE_KEYS.clubSelectedLocation);
  localStorage.removeItem(STORAGE_KEYS.clubSelectedMusicGenres);
  localStorage.removeItem(STORAGE_KEYS.ownedClubId);

  window.location.replace('/bz/auth/login');
}
