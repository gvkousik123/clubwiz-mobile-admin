# Event Create & Edit — Frontend Integration Guide

**Date:** July 2026  
**Audience:** Frontend team (`clubwiz-admin`; `clubwiz-user` only if create/edit with images is added later)  
**Backend service:** `event-management`  
**Production base URL:** `https://clubwiz.in`  
**API context path:** `/event-management`

This document is the **single integration guide** for event create and edit from the browser. It explains the production issue (false CORS / network errors), why create appeared to work while edit failed, and the **correct client implementation** going forward.

**Related docs (field-level detail only — do not duplicate here):**

| Document | Use for |
|----------|---------|
| [EVENT-CREATE-EDIT-FULL-PAYLOADS.md](./EVENT-CREATE-EDIT-FULL-PAYLOADS.md) | Full JSON field reference and sample payloads |
| [EVENT-DETAIL-PRICING-FRONTEND.md](./EVENT-DETAIL-PRICING-FRONTEND.md) | Read contract (`GET /details`) — nested pricing in responses |
| [CLUBWIZ-ADMIN-CLUB-IMAGE-CHANGES.md](./CLUBWIZ-ADMIN-CLUB-IMAGE-CHANGES.md) | Working reference for multipart + club edit (mirror this pattern) |

---

## 1. Problem summary

### Symptom

- **Edit event** from the admin UI failed with a browser **CORS error** or **network error**.
- The **same API worked in Swagger** (often tested as multipart).
- Other APIs from the same app worked fine (club update, list events, get event details).

### Root cause (not CORS)

The failure was **not** a missing CORS header on the server. Nginx and `event-management` already allow `PUT`/`POST` from `localhost` and `clubwiz.in` with `Authorization`.

The real cause was sending **large base64 image blobs inside a JSON body**:

```text
Browser → JSON.stringify huge payload → connection reset / timeout / tab freeze
         → DevTools shows "(failed)" or CORS-like error with no HTTP status
```

Base64 inflates file size by ~33%. Poster + reel + logo together can easily exceed what is safe for a single JSON request from the browser, even when nginx allows 500 MB.

### Why create seemed fine but edit broke

Create and edit used a **similar-looking** payload, but behavior differed in practice:

| Factor | Create (`POST`) | Edit (`PUT`) — old client |
|--------|-----------------|---------------------------|
| Typical files uploaded | Often poster only | Often poster **and** reel when user changes media |
| Payload logging | `console.log(eventData)` (object) | `JSON.stringify(eventData)` — **can OOM / freeze tab** before request is sent |
| Retained images | N/A (new event) | Must send existing HTTPS URLs when not replacing files |
| Backend response | `EventCreateResponse` (201, lighter) | `EventDetailResponse` (200, heavier — includes club hydration) |
| Swagger testing | May have used JSON with small test images | Successful Swagger tests often used **multipart**, not the frontend JSON path |

**Conclusion:** Create was equally fragile with poster + reel as base64 JSON; edit hit the failure mode more often. Both must use **multipart** when uploading new files.

---

## 2. Golden rule

```text
┌─────────────────────────────────────────────────────────────────┐
│  Uploading NEW image or reel files?                             │
│    → multipart/form-data (File objects in FormData)             │
│    → metadata in JSON `data` part only — NO base64              │
│                                                                 │
│  Text-only change, no new files?                                │
│    → application/json (small body)                              │
│    → edit: include existing image HTTPS URLs if keeping them    │
└─────────────────────────────────────────────────────────────────┘
```

**Never** call `fileToBase64()` on submit for create or edit.  
**Never** `JSON.stringify()` a payload that contains base64 or files.

---

## 3. API endpoints

All paths below are relative to `https://clubwiz.in`.

| Action | Method | URL | JSON body | Multipart body |
|--------|--------|-----|-----------|----------------|
| **Load form (edit)** | `GET` | `/event-management/events/{id}/admin` | — | — |
| **Read-only / mobile** | `GET` | `/event-management/events/{id}/details` | — | — |
| **Create event** | `POST` | `/event-management/events/create-json-with-images` | Text / URLs only, no new files | **Recommended when any file is selected** |
| **Update event** | `PUT` | `/event-management/events/{id}` | Text + retained HTTPS URLs only | **Recommended when any new file is selected** |

**Auth:** `Authorization: Bearer <JWT>`  
**Roles:** `BUSINESS_ADMIN`, `ADMIN`, or `SUPERADMIN` for create, update, and `/admin` load.

**Optional header (update):**

| Header | Value | Effect |
|--------|-------|--------|
| `X-Response-Format` | `admin` | Response body is `EventCreateResponse` (same shape as create + `/admin` load) instead of `EventDetailResponse` |

**Legacy aliases (still work, deprecated):**

- `POST /event-management/events/create-multipart`
- `PUT /event-management/events/{id}/multipart`
- `POST /event-management/events/{id}/update-json-with-images` (JSON update alias)

---

## 4. Multipart contract (create and edit)

Same URL as JSON. Content-Type must be `multipart/form-data` with a **boundary** set by the client (axios does this automatically if you do not force `Content-Type`).

### Form parts

| Part name | Type | Required | Description |
|-----------|------|----------|-------------|
| `data` | JSON blob (`application/json`) | Yes | Event metadata + pricing. **No base64.** On edit, include retained HTTPS URLs for images not being replaced. |
| `eventImage` | File | No | Event poster / main image |
| `eventReel` | File | No | Short video reel (`mp4`, `mov`, `webm`; max 50 MB per file on server) |
| `eventOrganizerLogo` | File | No | Organizer logo |
| `galleryImages` | File (repeat part name) | No | One part per gallery file |
| `performerImages` | File (repeat part name) | No | One part per performer photo |

### Example: building FormData (TypeScript)

```typescript
const formData = new FormData();
formData.append(
  'data',
  new Blob([JSON.stringify(metadataOnly)], { type: 'application/json' })
);
if (posterFile) formData.append('eventImage', posterFile);
if (reelFile) formData.append('eventReel', reelFile);
if (logoFile) formData.append('eventOrganizerLogo', logoFile);
galleryFiles.forEach((f) => formData.append('galleryImages', f));
performerFiles.forEach((f) => formData.append('performerImages', f));

// Create
await api.post('/event-management/events/create-json-with-images', formData, {
  timeout: 600_000,
});

// Edit
await api.put(`/event-management/events/${eventId}`, formData, {
  timeout: 600_000,
  headers: { 'X-Response-Format': 'admin' }, // optional, recommended for admin UI
});
```

### Axios rules (critical)

| Rule | Detail |
|------|--------|
| **Do not set** `Content-Type: multipart/form-data` manually | Omit boundary → server cannot parse parts. Let axios set it when `data` is `FormData`. |
| **Strip JSON Content-Type on FormData** | If default client headers include `application/json`, delete `Content-Type` for FormData requests (see `lib/api-client.ts`). |
| **Timeout** | Use **600_000 ms (10 minutes)** for create/update with media. |
| **Body size** | `maxBodyLength: Infinity`, `maxContentLength: Infinity` on axios instance. |
| **Client compression** | Optional but recommended: `compressImageFile()` on poster/logo before append. **Do not** compress video reels. Server compresses images again. |

---

## 5. Create event flow

### 5.1 Decision

```text
hasNewFiles = posterFile || reelFile || organizerLogoFile || galleryFiles.length || performerFiles.length

if (hasNewFiles)
  → POST multipart to /event-management/events/create-json-with-images
else
  → POST application/json to same URL (metadata only)
```

### 5.2 JSON `data` part (multipart) or full JSON body (no files)

Include create metadata: `title`, `description`, `clubId`, `startDateTime`, `endDateTime`, location fields, artist fields, pricing (`maleStagEntry`, `femaleStagEntry`, `coupleEntry`, early bird fields, `generalPricing` / `guestListPricing` as per your form), `hasLimitedTickets`, `totalTickets`, etc.

**Do not** include `eventImage.data`, `eventReel.data`, or base64 in the `data` part when files are sent as separate parts.

**Image field names (create):**

| JSON field (JSON-only legacy) | Multipart file part |
|------------------------------|---------------------|
| `eventImage` | `eventImage` |
| `eventReel` | `eventReel` |
| `eventOrganizerLogo` | `eventOrganizerLogo` |
| `galleryImages[]` | `galleryImages` (repeated) |
| `performerImages[]` | `performerImages` (repeated) |

### 5.3 Success response

- **Status:** `201 Created`
- **Body:** `EventCreateResponse` with `id`, `imageUrl`, `reelUrl`, `ticketTypes` / pricing fields, etc.
- **Check success:** `response.data.id` or wrapped `response.data` depending on your `handleApiResponse` helper.

### 5.4 Minimal JSON-only create (no files)

Only when the user does not select any media:

```http
POST /event-management/events/create-json-with-images
Content-Type: application/json

{
  "title": "Saturday Night Live",
  "description": "...",
  "startDateTime": "2026-07-12T20:00:00",
  "endDateTime": "2026-07-13T02:00:00",
  "clubId": "6a44162cc2ba2f0f83a722a3",
  "location": "Main Hall",
  "isPublic": true,
  "requiresApproval": false,
  "eventArtistName": "DJ Aakash",
  "aboutEventArtist": "...",
  "musicGenre": "Hip Hop",
  "maleStagEntry": { "price": 500, "fee": 300 },
  "femaleStagEntry": { "price": 500, "fee": 300 },
  "coupleEntry": { "price": 1000, "fee": 600 }
}
```

Full field list: [EVENT-CREATE-EDIT-FULL-PAYLOADS.md](./EVENT-CREATE-EDIT-FULL-PAYLOADS.md).

---

## 6. Edit event flow

### 6.1 Load the form

Use the **admin** endpoint, not `/details`:

```http
GET /event-management/events/{id}/admin
Authorization: Bearer <token>
```

**Why:** `/admin` returns `EventCreateResponse` — same contract as create/update (`imageUrl`, `reelUrl`, `eventOrganizerLogo`, `ticketTypes`, pricing). `/details` is for mobile/read-only display and is a poor source for building a save payload.

Store existing media URLs in state:

```typescript
existingImageUrl      // from event.imageUrl
existingReelUrl         // from event.reelUrl
existingOrganizerLogoUrl // from event.eventOrganizerLogo
```

Keep new picks as `File` objects (`newPosterFile`, etc.). Use `URL.createObjectURL(file)` for preview only.

### 6.2 Decision

```text
hasNewFiles = newPosterFile || newReelFile || newOrganizerLogoFile
              || newGalleryFiles.length || newPerformerFiles.length

if (hasNewFiles)
  → PUT multipart to /event-management/events/{id}
else
  → PUT application/json (metadata + retained HTTPS URLs)
```

### 6.3 JSON `data` part — field mapping (edit)

Edit is a **partial update**: send fields you want to change.

**Retained images (when NOT uploading a new file for that slot):**

| Purpose | JSON field in `data` part | Type |
|---------|---------------------------|------|
| Keep existing poster | `imageUrl` | HTTPS string |
| Keep existing reel | `reelUrl` | HTTPS string |
| Keep existing organizer logo | `eventOrganizerLogo` | HTTPS string |
| Keep gallery photos | `galleryImages` | Array of HTTPS strings |
| Keep performer photos | `performerImages` | Array of HTTPS strings |

**When replacing** a slot with a new `File`, **omit** that URL from JSON and send the file as the matching multipart part.

**Do not send on multipart edit:**

- `eventImage` / `eventReel` objects with `data` (base64)
- `eventOrganizerLogoImage`, `galleryImageData`, `performerImageData` with base64

### 6.4 Example: edit metadata for multipart `data` part

```json
{
  "title": "Saturday Night Live (Updated)",
  "description": "Updated description",
  "startDateTime": "2026-07-12T20:00:00",
  "endDateTime": "2026-07-13T02:00:00",
  "clubId": "6a44162cc2ba2f0f83a722a3",
  "eventArtistName": "DJ Aakash",
  "musicGenre": "Hip Hop",
  "maleStagEntry": { "price": 600, "fee": 350 },
  "femaleStagEntry": { "price": 600, "fee": 350 },
  "coupleEntry": { "price": 1200, "fee": 700 },
  "imageUrl": "https://clubwiz-images.s3.../poster-existing.jpg",
  "reelUrl": "https://clubwiz-images.s3.../reel-existing.mp4",
  "eventOrganizerLogo": "https://clubwiz-images.s3.../logo-existing.jpg"
}
```

If the user picks a **new poster**, remove `imageUrl` from JSON and append `eventImage` file part instead.

### 6.5 Success response

- **Status:** `200 OK`
- **Default body:** `EventDetailResponse` (includes `club`, `organizer`, nested pricing for display)
- **With `X-Response-Format: admin`:** `EventCreateResponse` (preferred for admin edit UI)

**Check success:**

```typescript
// Response may be { id, ... } directly or { success, data }
if (response?.id || response?.success || response?.data) { /* ok */ }
```

### 6.6 Text-only edit (no new files)

```http
PUT /event-management/events/{id}
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "imageUrl": "https://...existing-poster...",
  "reelUrl": "https://...existing-reel...",
  "eventOrganizerLogo": "https://...existing-logo..."
}
```

Small JSON body — safe, no multipart required.

---

## 7. HTTP status codes and errors

| Status | Meaning | Frontend action |
|--------|---------|-----------------|
| `201` | Create succeeded | Navigate / show success |
| `200` | Update succeeded | Navigate / show success |
| `400` | Validation, club not found, permission message in body | Show `message` from response |
| `401` / `403` | Auth or role | Re-login; ensure `BUSINESS_ADMIN` |
| `404` | Event or endpoint not found | Check URL and `eventId` |
| `504` | Image upload to S3 failed or timed out on server | Retry with multipart; fewer/smaller files |
| `(failed)` / no status in DevTools | Body too large, connection reset, client timeout | **Use multipart**; do not treat as CORS config bug |

### False “CORS error” troubleshooting

| DevTools symptom | Real cause | Fix |
|------------------|------------|-----|
| `OPTIONS` 204, then PUT/POST `(failed)` | Payload too large or connection dropped during upload | Multipart + 10 min timeout |
| `net::ERR_CONNECTION_RESET` | Same as above | Multipart |
| `403` with response body | JWT expired or wrong role | Refresh token / re-login |
| `504` with JSON body | Server-side S3 timeout | Retry; compress images client-side |
| Swagger works, browser fails | Swagger used multipart or smaller payload | Match Swagger: multipart from browser |

### Timeout UX (recommended)

If `error.code === 'ECONNABORTED'` or message contains `timeout`:

> Browser timed out — check if save completed. The server may still be processing images (1–2 minutes). Refresh the page to verify.

Do not assume failure; large uploads can outlast impatient UI feedback.

---

## 8. Client implementation reference (`clubwiz-admin`)

These are the intended service methods (mirror `ClubService.updateClubMultipart`):

| Method | When to use |
|--------|-------------|
| `EventService.getEventForAdmin(id)` | Load edit form |
| `EventService.createEventWithImages(data)` | Create, **no** new files |
| `EventService.createEventMultipart(data, files)` | Create **with** new files |
| `EventService.updateEvent(id, data)` | Edit, **no** new files |
| `EventService.updateEventMultipart(id, data, files, { responseFormat: 'admin' })` | Edit **with** new files |

**Pages:**

| Page | Pattern |
|------|---------|
| `app/business/new-event/page.tsx` | Multipart when `poster \|\| reel \|\| organizerLogo` files exist |
| `app/business/edit-event/[id]/page.tsx` | Load `/admin`; multipart when new files; retain HTTPS URLs in `data` when not replacing |
| `app/business/event-preview/page.tsx` | JSON `updateEvent` only (no file upload today) |
| `app/business/update-live-details/page.tsx` | JSON `updateEvent` only (no file upload today) |

**`lib/api-client.ts`:**

- Global timeout: `600_000` ms
- `maxBodyLength` / `maxContentLength`: `Infinity`
- On `FormData` requests: remove default `Content-Type: application/json`
- Do not log full `FormData` or base64 payloads

---

## 9. Server limits (reference)

| Limit | Value |
|-------|--------|
| Per image (server decode) | 50 MB |
| Per video reel (multipart) | 50 MB |
| HTTP body (nginx + Spring) | 500 MB |
| Nginx proxy read/send timeout | 600 s (production config) |
| Backend S3 upload wait | 15 min |
| Typical compressed output per photo | ~500 KB – 2 MB |

---

## 10. Pricing notes (create & edit)

- Prefer **flat pricing fields** on write: `maleStagEntry`, `femaleStagEntry`, `coupleEntry`, `earlyBird*`, `freeMaleStagPerCoupleEnabled`, `earlyBirdFreeMaleStagPerCoupleEnabled`, or nested `generalPricing` / `guestListPricing` as documented in [EVENT-CREATE-EDIT-FULL-PAYLOADS.md](./EVENT-CREATE-EDIT-FULL-PAYLOADS.md).
- **Read** responses use nested `earlyBirdPricing` / `generalPricing` on `GET /details` — see [EVENT-DETAIL-PRICING-FRONTEND.md](./EVENT-DETAIL-PRICING-FRONTEND.md).
- `ticketTypes` in create/edit requests may be sent by the admin UI for catalog display; backend normalizes from tier pricing. Do not rely on `ticketTypes` alone without pricing fields.

---

## 11. Checklist before shipping

- [ ] New media uploads use **multipart**, not base64 JSON
- [ ] Edit form loads from **`GET .../admin`**, not `/details`
- [ ] Retained images sent as **HTTPS URL strings** in `data` part when not replacing
- [ ] No `fileToBase64()` on submit
- [ ] No `JSON.stringify()` on payloads containing images
- [ ] Axios timeout **600 s** on create/update with media
- [ ] `Content-Type` not manually set for multipart
- [ ] Timeout toast if browser aborts long upload
- [ ] Success handling accepts both `{ id }` and `{ success, data }` response shapes
- [ ] Optional: `compressImageFile()` on images before multipart (not on reel video)

---

## 12. Quick comparison: wrong vs right

### Wrong (causes network / false CORS errors)

```typescript
const base64 = await fileToBase64(posterFile);
await api.put(`/event-management/events/${id}`, {
  title: '...',
  eventImage: { name: 'x.jpg', contentType: 'image/jpeg', data: base64 },
});
```

### Right

```typescript
const formData = new FormData();
formData.append('data', new Blob([JSON.stringify({
  title: '...',
  imageUrl: existingPosterUrl, // only if keeping old poster
})], { type: 'application/json' }));
formData.append('eventImage', posterFile);

await api.put(`/event-management/events/${id}`, formData, {
  timeout: 600_000,
  headers: { 'X-Response-Format': 'admin' },
});
```

---

## 13. FAQ

**Q: Swagger works from the server; why not the browser?**  
A: Swagger UI on the same host often sends multipart or small test files. The browser was sending multi-megabyte base64 JSON from `localhost` or `business.clubwiz.in`.

**Q: Do we need a backend CORS change?**  
A: No, if club update and GET events already work from the same admin app. Fix the upload transport (multipart).

**Q: Can we still use JSON with base64 for tiny images?**  
A: Technically supported for very small images, but **not recommended**. Multipart is the supported path for all new file uploads.

**Q: Create and edit use the same payload shape?**  
A: Similar metadata, but **edit** uses `imageUrl` / `reelUrl` / `eventOrganizerLogo` strings for retained media, while **create** uses `eventImage` / `eventReel` object keys in legacy JSON mode. In multipart mode, both put metadata in `data` and files in named parts.

**Q: What if the user only changes the event title?**  
A: Small JSON `PUT` with `{ "title": "..." }` only. No multipart needed.

---

*End of guide. For exhaustive JSON examples of every field, see [EVENT-CREATE-EDIT-FULL-PAYLOADS.md](./EVENT-CREATE-EDIT-FULL-PAYLOADS.md).*
