# ClubWiz Location Screen and API Flow

## Purpose

This document explains how the ClubWiz location selection screen works, how location data is fetched and saved, and which APIs are called.

It covers:

- the location select screen UI
- the `useUserLocation` hook
- the `UserLocationService` API client
- location persistence and selection behavior
- the location picker modal and map flow

## Location Screen

### File

- `app/v1/location/select/page.tsx`

### What it does

- Displays the current saved location if available
- Allows the user to use browser geolocation
- Shows a `GoogleMapPicker` map to choose a location
- Reverse geocodes the selected coordinates into city/state/country
- Calculates distance from the existing saved location if present
- Saves or updates the user location via API

### Key UI states

- Saved location display at top
- "Use Current Location" button
- Google Maps picker with current location + selected location markers
- Distance info card if the selected location differs from the saved location
- Confirm/Save button at bottom

### Main functions

#### `handleMapSelect(coords)`

- Triggered when the map selection changes
- Stores `selectedCoords`
- Calls `getLocationName(lat, lng)` to reverse geocode
- Calls `calculateDistance()` when a saved location already exists
- Displays distance in kilometers and miles

#### `handleUseCurrentLocation()`

- Uses `navigator.geolocation.getCurrentPosition`
- Saves the detected coordinates in `selectedCoords`
- Calls reverse geocoding and distance calculation
- Shows toast messages for success or failures

#### `handleConfirmLocation()`

- Runs when the user confirms the selected location
- Calls `updateUserLocation()` from `useUserLocation`
- Redirects to `/v1/home` on success

## Reverse Geocoding

### Implementation

- `getLocationName(lat, lng)` in `app/v1/location/select/page.tsx`
- Uses OpenStreetMap Nominatim:
  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`

### Output fields

- `locationName` (road/suburb or fallback display name)
- `locationCity`
- `locationState`
- `locationCountry`
- `locationPincode`

These values are passed into the API when updating user location.

## Location Hook

### File

- `hooks/use-user-location.ts`

### What it manages

- `userLocation` state loaded from the server
- `hasLocation` boolean
- `loading` and `error` states
- toasts for success and error

### Exposed methods

- `fetchUserLocation(showToast)`
- `updateUserLocation(latitude, longitude, address, city, state, country, pincode)`
- `calculateDistance(targetLatitude, targetLongitude)`
- `clearUserLocation()`

### Behavior

- Automatically fetches saved user location on mount
- Shows toast messages for load/update success or failure
- Throws errors from service methods so calling pages can handle them

## Location API Service

### File

- `lib/services/user-location.service.ts`

### Base path

- `UserLocationService.BASE_PATH` = `/search/api/user/location`

### Endpoints

- `GET /search/api/user/location`

  - Returns saved user location
  - If the API returns `404`, the service treats it as "no location saved yet"
- `PUT /search/api/user/location`

  - Updates or creates the user location
  - Request body accepts coordinates plus optional address details
- `GET /search/api/user/location/distance`

  - Calculates distance between saved location and a target coordinate
  - Accepts `targetLatitude` and `targetLongitude` as query params
- `DELETE /search/api/user/location`

  - Clears saved location if supported by the backend

### Request payload for update

```json
{
  "latitude": 19.0760,
  "longitude": 72.8777,
  "address": "Marine Drive, Mumbai",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400001"
}
```

### Response expectations

- Successful responses return location objects with numeric `latitude` and `longitude`
- The service wraps raw API responses into a common `ApiResponse<T>` shape
- Distance API responses must include `distanceKm` and `distanceMiles`

## Location Picker Modal

### File

- `components/common/location-picker-modal.tsx`

### What it does

- Shows a modal for manual location selection
- Allows search through `POPULAR_LOCATIONS`
- Supports "Use Current Location" via browser geolocation
- Selects a location and returns it via `onSelectLocation`

### Main props

- `isOpen`: whether modal is visible
- `onClose()`: close callback
- `onSelectLocation(coords, locationName)`: selection callback

### Selection flow

- User can choose a predefined popular location
- or detect current browser location
- Pressing confirm calls `onSelectLocation`

## Location persistence and defaults

### Storage helpers

- `lib/location.ts` contains utility functions for local storage persistence
- `getStoredLocation()` reads saved location from `localStorage`
- `setStoredLocation()` writes normalized location data
- `resolveLocation()` returns stored location or fallback default

### Default location

- `DEFAULT_LOCATION` is Mumbai:
  - `lat: 19.0760`
  - `lng: 72.8777`
  - `city: Mumbai`
  - `address: Mumbai, India`

### Popular location list

- `POPULAR_LOCATIONS` is a runtime list of location presets
- It can be updated from club data via `updatePopularLocationsFromClubs()`

## Home page integration

### File

- `app/v1/home/page.tsx`

### What it does related to location

- Loads saved user location for authenticated users
- Saves a preset location when a user selects a location option from the home page dropdown
- Uses `UserLocationService.getUserLocation()` and `updateUserLocation()` directly in some cases
- Shows the active location label on the home screen

## Call graph summary

1. User opens `/v1/location/select`
2. `useUserLocation` loads saved location from `GET /search/api/user/location`
3. User selects location on map or uses geolocation
4. App reverse geocodes coordinates with OpenStreetMap
5. App optionally calls `GET /search/api/user/location/distance`
6. User confirms location
7. App calls `PUT /search/api/user/location` with full details
8. On success, the user is redirected to `/v1/home`

## Notes

- The location screen is client-side only (`'use client'`)
- Google Maps UI is provided by `components/common/google-map-picker.tsx`
- Reverse geocoding is handled via OpenStreetMap Nominatim, not the backend
- Distance calculation is handled by the backend endpoint
- The saved location API path is under `/search/api/user/location`
