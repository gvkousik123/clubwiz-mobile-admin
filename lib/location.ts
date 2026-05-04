export type LocationSource = 'default' | 'list' | 'map' | 'geo' | 'manual';

export type SavedLocation = {
  name: string;
  label?: string;
  lat: number;
  lng: number;
  /**
   * Legacy fields we still populate for existing consumers that expect latitude/longitude.
   */
  latitude?: number;
  longitude?: number;
  radius?: number;
  city?: string;
  address?: string;
  timestamp: string;
  source?: LocationSource;
};

export type LocationOption = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city?: string;
  address?: string;
  radius?: number;
};

const STORAGE_KEY = 'clubviz.userLocation';
export const DEFAULT_RADIUS = 5000; // meters

export const POPULAR_LOCATIONS: LocationOption[] = [
  {
    id: 'dabo',
    name: 'DABO',
    city: 'Nagpur',
    address: 'Tiwari Compound, Sitabuldi, Nagpur',
    lat: 21.1498,
    lng: 79.0806,
  },
  {
    id: 'raasta',
    name: 'RAASTA',
    city: 'Nagpur',
    address: 'Sitabuldi Square, Nagpur',
    lat: 21.1307,
    lng: 79.0669,
  },
  {
    id: 'warehouse',
    name: 'WAREHOUSE',
    city: 'Nagpur',
    address: 'Fountain Square, Nagpur',
    lat: 21.0645,
    lng: 79.0193,
  },
];

export const DEFAULT_LOCATION: SavedLocation = {
  name: POPULAR_LOCATIONS[0].name,
  label: POPULAR_LOCATIONS[0].name,
  lat: POPULAR_LOCATIONS[0].lat,
  lng: POPULAR_LOCATIONS[0].lng,
  latitude: POPULAR_LOCATIONS[0].lat,
  longitude: POPULAR_LOCATIONS[0].lng,
  city: POPULAR_LOCATIONS[0].city,
  address: POPULAR_LOCATIONS[0].address,
  radius: POPULAR_LOCATIONS[0].radius ?? DEFAULT_RADIUS,
  timestamp: new Date(0).toISOString(),
  source: 'default',
};

const normalizeLocationPayload = (location: Partial<SavedLocation>): SavedLocation | null => {
  const lat = location.lat ?? location.latitude;
  const lng = location.lng ?? location.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  const timestamp = location.timestamp || new Date().toISOString();
  const name = location.name || location.label || 'Saved Location';

  return {
    name,
    label: location.label || name,
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    radius: location.radius ?? DEFAULT_RADIUS,
    city: location.city,
    address: location.address,
    timestamp,
    source: location.source || 'manual',
  };
};

export const getStoredLocation = (): SavedLocation | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SavedLocation;
    return normalizeLocationPayload(parsed);
  } catch (error) {
    console.warn('Failed to parse stored location:', error);
    return null;
  }
};

const buildLocationFromOption = (
  option: LocationOption,
  source: LocationSource = 'default'
): SavedLocation => ({
  name: option.name,
  label: option.name,
  lat: option.lat,
  lng: option.lng,
  latitude: option.lat,
  longitude: option.lng,
  city: option.city,
  address: option.address,
  radius: option.radius ?? DEFAULT_RADIUS,
  timestamp: new Date().toISOString(),
  source,
});

export const setStoredLocation = (
  location: Omit<SavedLocation, 'timestamp'> & { timestamp?: string }
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const normalized = normalizeLocationPayload({ ...location, timestamp: location.timestamp });
    if (!normalized) {
      throw new Error('Invalid location payload');
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.warn('Failed to persist location:', error);
  }
};

export const resolveLocation = (): SavedLocation => {
  const stored = getStoredLocation();
  if (stored) {
    return stored;
  }

  const fallback = buildLocationFromOption(POPULAR_LOCATIONS[0]);
  setStoredLocation(fallback);
  return fallback;
};

export const selectLocationFromOption = (
  optionId: string,
  source: LocationSource = 'list'
): SavedLocation => {
  const option = POPULAR_LOCATIONS.find((loc) => loc.id === optionId) || POPULAR_LOCATIONS[0];
  const payload = buildLocationFromOption(option, source);
  setStoredLocation(payload);
  return payload;
};

export const persistCustomLocation = (
  location: { name: string; lat: number; lng: number; address?: string; city?: string },
  source: LocationSource = 'manual'
): SavedLocation => {
  const payload: SavedLocation = {
    name: location.name,
    label: location.name,
    lat: location.lat,
    lng: location.lng,
    latitude: location.lat,
    longitude: location.lng,
    city: location.city,
    address: location.address,
    radius: DEFAULT_RADIUS,
    timestamp: new Date().toISOString(),
    source,
  };
  setStoredLocation(payload);
  return payload;
};
