# Club Creation JSON Format - Fix Documentation

## Problem Summary
The club creation endpoint is returning **"Invalid JSON format in request body"** because the payload structure doesn't match the API's expected format.

---

## Functions Involved in the Issue

### 1. **Form Submit Handler** (Admin)
- **File**: [app/admin/new-club/page.tsx](app/admin/new-club/page.tsx#L428)
- **Function**: `handleSubmit()` 
- **Lines**: 428-480
- **Issue**: Building incorrect payload structure before sending to API

### 2. **Form Submit Handler** (Superadmin)
- **File**: [app/superadmin/new-club/page.tsx](app/superadmin/new-club/page.tsx#L363)
- **Function**: `handleSubmit()`
- **Lines**: 363-420
- **Issue**: Same incorrect payload structure

### 3. **Club Service** (Service Layer)
- **File**: [lib/services/club.service.ts](lib/services/club.service.ts#L351)
- **Function**: `ClubService.createClub(clubData: ClubCreateRequest)`
- **Lines**: 351-362
- **Endpoint**: `POST /clubs/create-json-with-images`
- **Status**: ✅ CORRECT - This function correctly sends the payload to the API

---

## Current (INCORRECT) Payload Structure

**Location**: [app/admin/new-club/page.tsx#L443](app/admin/new-club/page.tsx#L443)

```typescript
const clubData: any = {
    "name": formData.clubName.trim(),
    "description": formData.description.trim() || "",
    "logo": logoBase64,  // ❌ WRONG: Should be an object
    "category": formData.category.trim() || "NIGHTCLUB",
    "maxMembers": parseInt(formData.maxMembers) || 100,
    "contactEmail": formData.contactEmail.trim() || adminDetails.email,
    "contactPhone": formData.contactPhone.trim() || adminDetails.phone,
    "images": allImages,  // ❌ WRONG: Should be split into 3 arrays
    "locationText": { ... },
    "locationMap": { ... },
    "foodCuisines": [...],
    "facilities": [...],
    "music": [...],
    "barOptions": [...],
    "entryPricing": { ... }
};
```

### Problems with Current Structure:
1. ❌ **`logo`** is a plain base64 string → Should be an **object**
2. ❌ **`images`** is a generic array → Should be split into three specific arrays:
   - `foodImageData`
   - `ambianceImageData`
   - `menuImageData`
3. ❌ **Missing nested object properties** inside image objects
4. ❌ **Extra properties** like `locationText`, `locationMap`, `foodCuisines`, etc. (not in API schema)

---

## Expected (CORRECT) Payload Structure

**Source**: [lib/services/clubs-apis.json#L155](lib/services/clubs-apis.json#L155)

```json
{
  "name": "string",
  "description": "string",
  "logo": {
    "name": "string",
    "contentType": "string",
    "data": "base64_encoded_string",
    "url": "string (optional)"
  },
  "category": "string",
  "maxMembers": 0,
  "contactEmail": "string",
  "contactPhone": "string",
  "foodImageData": [
    {
      "name": "string",
      "contentType": "string",
      "data": "base64_encoded_string",
      "url": "string (optional)"
    }
  ],
  "ambianceImageData": [
    {
      "name": "string",
      "contentType": "string",
      "data": "base64_encoded_string",
      "url": "string (optional)"
    }
  ],
  "menuImageData": [
    {
      "name": "string",
      "contentType": "string",
      "data": "base64_encoded_string",
      "url": "string (optional)"
    }
  ]
}
```

---

## Code Flow Diagram

```
User fills form (name, logo, images, etc.)
        ↓
Form Submit Handler [NEW-CLUB PAGE]
        ↓
handleSubmit() builds clubData object [❌ CURRENTLY WRONG FORMAT]
        ↓
ClubService.createClub(clubData) [✅ CORRECTLY SENDS TO API]
        ↓
api.post('/clubs/create-json-with-images', clubData)
        ↓
API Server validates JSON schema [❌ FAILS: "Invalid JSON format"]
```

---

## Required Fixes

### Fix #1: Logo Format
**Current**:
```typescript
"logo": logoBase64  // string
```

**Fix to**:
```typescript
"logo": {
    name: "club-logo.jpg",
    contentType: "image/jpeg",
    data: logoBase64,
    url: ""
}
```

### Fix #2: Images Array Split
**Current**:
```typescript
"images": allImages  // Generic array
```

**Fix to**:
```typescript
"foodImageData": foodImages,     // Array of food image objects
"ambianceImageData": ambianceImages,  // Array of ambiance image objects
"menuImageData": menuImages      // Array of menu image objects
```

### Fix #3: Image Object Structure
**Current** (if in allImages):
```typescript
{ type: "food", data: "base64_string" }
```

**Fix to**:
```typescript
{
    name: "food-image-1.jpg",
    contentType: "image/jpeg",
    data: "base64_string",
    url: ""
}
```

### Fix #4: Remove Extra Properties
**Current Payload includes**:
- ❌ `locationText`
- ❌ `locationMap`
- ❌ `foodCuisines`
- ❌ `facilities`
- ❌ `music`
- ❌ `barOptions`
- ❌ `entryPricing`

**Remove all these** - they're not in the API schema!

---

## Files That Need to Be Fixed

| File | Line Range | Function | Status |
|------|-----------|----------|--------|
| `app/admin/new-club/page.tsx` | 428-480 | `handleSubmit()` | ❌ Needs Fix |
| `app/superadmin/new-club/page.tsx` | 363-420 | `handleSubmit()` | ❌ Needs Fix |
| `lib/services/club.service.ts` | 351-362 | `ClubService.createClub()` | ✅ OK |
| `lib/services/clubs-apis.json` | 155-190 | API Schema | ✅ Reference |

---

## Helper Function for Image Conversion

```typescript
// Helper to convert File to image object
async function fileToImageObject(file: File): Promise<{
    name: string;
    contentType: string;
    data: string;
    url: string;
}> {
    const base64 = await fileToBase64(file);
    return {
        name: file.name,
        contentType: file.type,
        data: base64,
        url: ""
    };
}
```

---

## Testing the Fix

After fixing the code:

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Create a club** through the form
4. **Find the POST request** to `/clubs/create-json-with-images`
5. **Check Request Payload** tab
6. **Verify it matches the CORRECT format above**
7. **Should see 200/201 response** ✅

---

## Related Files

- API Schema: [lib/services/clubs-apis.json](lib/services/clubs-apis.json)
- Service: [lib/services/club.service.ts](lib/services/club.service.ts)
- Admin Form: [app/admin/new-club/page.tsx](app/admin/new-club/page.tsx)
- SuperAdmin Form: [app/superadmin/new-club/page.tsx](app/superadmin/new-club/page.tsx)

---

## Summary

**The problem**: Form submit handlers are building incorrect JSON payload with wrong structure.

**The solution**: Restructure the payload in both `app/admin/new-club/page.tsx` and `app/superadmin/new-club/page.tsx` to match the API schema exactly.

**Functions to fix**:
1. Admin new-club form submit handler
2. SuperAdmin new-club form submit handler

**Functions already correct**:
- ✅ `ClubService.createClub()` - sending payload correctly
