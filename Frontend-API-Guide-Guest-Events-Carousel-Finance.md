# Frontend API Guide — Guest Events, Carousel, Commission, Payouts, Refunds & Disputes

**Audience:** Frontend (User app + Platform Admin)  
**Status:** Backend complete (additive; existing APIs unchanged)  
**Auth:** Bearer JWT unless marked **Public**  
**Content-Type:** `application/json`

---

## 1. Base URLs (local / direct service)

| Service | Context path | Typical port | Use for |
|--------|--------------|--------------|---------|
| Event-management | `/event-management` | `8087` | Public events, carousel |
| Club-management | `/clubs` | `8088` | Commission |
| PaymentService | `/payment` | `7272` | Payouts, refunds, disputes |

If your environment uses an API gateway, keep the same path suffixes after the gateway host (e.g. `https://api…/event-management/events/...`).

**Roles used below**

| Role | Meaning |
|------|---------|
| Public / Guest | No JWT |
| `ADMIN` / `SUPERADMIN` | Platform admin |
| `BUSINESS_ADMIN` | Club partner / BA |

---

## 2. Public events (Guest login / no login)

Mirror of Club public browse. Past and private events are excluded.

### 2.1 List public events

`GET /event-management/events/public/list`  
**Auth:** Public

| Query | Default | Notes |
|-------|---------|--------|
| `page` | `0` | 0-based |
| `size` | `10` | |
| `sortBy` | `startDateTime` | |
| `sortDirection` | `asc` | `asc` \| `desc` |
| `category` | — | Music genre filter |
| `location` | — | |
| `query` / `search` | — | Either works |
| `clubId` | — | |
| `status` | — | Event status if needed |
| `startDate` / `endDate` | — | Date range strings |

**Response `200` — `EventListResponse`**

```json
{
  "content": [ /* EventCardResponse[] */ ],
  "totalElements": 42,
  "totalPages": 5,
  "currentPage": 0,
  "size": 10,
  "hasNext": true,
  "hasPrevious": false,
  "first": true,
  "last": false
}
```

**FE notes**

- Use for guest home / explore / search.
- Each card includes `id`, `title`, images, dates, club info, capacity flags, etc.
- Navigate to detail with card `id`.

### 2.2 Public event by id

`GET /event-management/events/public/{id}`  
**Auth:** Public

| Status | When |
|--------|------|
| `200` | Public, non-past event → `EventDetailResponse` |
| `404` | Missing, private, or past |

**FE notes**

- Guest event detail / booking entry page.
- Do **not** use authenticated-only detail endpoints for guests.

### 2.3 Helpers (optional filters UI)

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/event-management/events/public/locations` | Public → `string[]` |
| `GET` | `/event-management/events/public/categories` | Public → `string[]` |

---

## 3. Home carousel (User app + Admin)

Slides can be **EVENT** (promoted partner events) or **PROMO** (admin non-event creatives).

### 3.1 Featured slides (User home hero)

`GET /event-management/events/public/featured?limit=10`  
`GET /event-management/events/featured?limit=10`  
**Auth:** Public (both aliases)

| Query | Default | Notes |
|-------|---------|--------|
| `limit` | `10` | Clamped 1–50 |

**Response `200`**

```json
{
  "slides": [ /* HomeCarouselSlideResponse[] */ ],
  "data": [ /* same as slides */ ],
  "total": 3
}
```

**`HomeCarouselSlideResponse`**

| Field | Type | Notes |
|-------|------|--------|
| `slideType` | `EVENT` \| `PROMO` | **Required for FE branching** |
| `slideId` | string | Stable id for the slide |
| `eventId` | string \| null | Set for EVENT |
| `promoId` | string \| null | Set for PROMO |
| `title` | string | |
| `clubName` / `clubId` | string | EVENT: real club; PROMO: may use venue label |
| `imageUrl` | string | Poster |
| `posterSource` | `club` \| `custom` | EVENT posters |
| `categoryBadge` | string | e.g. `FEATURED` |
| `carouselOrder` | number | Sort key (already sorted ascending) |
| `formattedDate` / `startDateTime` | | EVENT dates; PROMO may use labels |
| `carouselCategories` | string[] | |
| `bookingLink` | string | EVENT deep link (e.g. `/event/{id}`); PROMO may use `linkUrl` mapping |
| `status` | string | `live` \| `scheduled` \| `paused` (esp. promos) |

**FE rules**

1. Prefer `slides` (fallback to `data`).
2. If `slideType === "EVENT"` → CTA opens event page (`eventId` / `bookingLink`).
3. If `slideType === "PROMO"` → CTA opens `linkUrl` / promo destination (from slide fields / manage payload).
4. Empty list → show existing static fallback if product requires it.

---

## 4. Admin — Event + non-event carousel

**Auth for all manage/mutate APIs:** `ADMIN` or `SUPERADMIN`  
Header: `Authorization: Bearer <token>`

### 4.1 Manage payload (admin page bootstrap)

`GET /event-management/events/carousel/manage?search=&partnerLimit=40`

**Response `200`**

```json
{
  "carousel": [
    {
      "slideType": "EVENT",
      "event": { /* EventCardResponse */ },
      "slide": { /* HomeCarouselSlideResponse */ },
      "posterSource": "club",
      "status": "live"
    }
  ],
  "promos": [
    {
      "slideType": "PROMO",
      "promo": { /* PromoCarouselSlide entity */ },
      "slide": { /* HomeCarouselSlideResponse */ },
      "posterSource": "custom",
      "status": "scheduled"
    }
  ],
  "partners": [ /* EventCardResponse[] — not yet on carousel */ ],
  "carouselCount": 1,
  "promoCount": 1,
  "partnerCount": 12
}
```

**FE mapping to Platform Admin UI**

| UI block | Source |
|----------|--------|
| Current carousel (events) | `carousel` |
| Non-event / promo slides | `promos` |
| “Add partner event” search list | `partners` filtered by `search` |
| Hero preview | Combine `carousel[].slide` + `promos[].slide` by `carouselOrder` if needed |

### 4.2 Promote / remove event slides

| Action | Method | Path | Body |
|--------|--------|------|------|
| Promote partner event | `POST` | `/event-management/events/{eventId}/carousel/promote` | none |
| Remove from carousel | `DELETE` | `/event-management/events/{eventId}/carousel/promote` | none |

- Promote → `HomeCarouselSlideResponse`
- Remove → `EventCardResponse`
- `404` → `{ "message": "..." }`

### 4.3 Reorder event slides

`PUT /event-management/events/carousel/reorder`

```json
{ "eventIds": ["evt-3", "evt-1", "evt-2"] }
```

Order in array = display order (index `0` first).

### 4.4 Non-event (PROMO) CRUD

| Action | Method | Path |
|--------|--------|------|
| Create | `POST` | `/event-management/events/carousel/promos` |
| Update | `PUT` | `/event-management/events/carousel/promos/{promoId}` |
| Delete | `DELETE` | `/event-management/events/carousel/promos/{promoId}` |
| Reorder | `PUT` | `/event-management/events/carousel/promos/reorder` |

**Create body**

```json
{
  "title": "Clubwiz Festival",
  "subtitle": "City-wide weekend",
  "venueLabel": "Bengaluru",
  "dateLabel": "Sat · 20 Jul",
  "imageUrl": "https://cdn…/promo.jpg",
  "linkUrl": "https://clubwiz.in/promo",
  "badgeLabel": "FEATURED",
  "displayOrder": 0,
  "status": "scheduled",
  "isActive": true
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `title` | Yes | |
| `subtitle`, `venueLabel`, `dateLabel` | No | Display copy |
| `imageUrl` | Recommended | Hero art |
| `linkUrl` | Recommended | CTA target |
| `badgeLabel` | No | Default `FEATURED` |
| `displayOrder` | No | Auto-assigned if omitted |
| `status` | No | `live` \| `scheduled` \| `paused` (default `scheduled`) |
| `isActive` | No | Default `true`; inactive excluded from public featured |

**Update body:** same fields, all optional (partial).

**Reorder promos**

```json
{ "eventIds": ["promoId-2", "promoId-1"] }
```

> Field name is `eventIds` for historical reasons — for promo reorder, pass **promo ids** in desired order.

**Create/Update response:** `HomeCarouselSlideResponse` (`slideType: "PROMO"`).

### 4.5 Suggested admin UI flows

1. Load `GET …/carousel/manage`.
2. Search partners → `POST …/{id}/carousel/promote`.
3. Create promo modal → `POST …/carousel/promos`.
4. Up/down arrows → call event reorder and/or promo reorder with full ordered id lists.
5. User home uses `GET …/public/featured` (no admin token).

---

## 5. Commission (Business Admin + Platform Admin)

**Service:** Club-management  
**Base:** `/clubs`

| Who | Can |
|-----|-----|
| `ADMIN` / `SUPERADMIN` | List all, get any, **update** rate/status |
| `BUSINESS_ADMIN` | List/get **own** clubs only (created by their email) |

### 5.1 List commissions

`GET /clubs/commissions`  
**Auth:** `BUSINESS_ADMIN` \| `ADMIN` \| `SUPERADMIN`

**Response `200`**

```json
{
  "commissions": [
    {
      "clubId": "…",
      "clubName": "NEON Indiranagar",
      "createdBy": "ba@example.com",
      "isActive": true,
      "commissionRate": 10.0,
      "commissionStatus": "queued"
    }
  ],
  "total": 6,
  "averageRate": 12.17
}
```

**FE:** Platform Admin “Partnership commission rates” table; BA dashboard read-only rate view. Show `averageRate` as KPI.

### 5.2 Get one club

`GET /clubs/{id}/commission`  
**Auth:** BA (own) or Admin  
`403` if BA tries another club · `404` if missing

### 5.3 Update commission (Admin only)

`PUT /clubs/{id}/commission`  
**Auth:** `ADMIN` \| `SUPERADMIN`

```json
{
  "commissionRate": 12.5,
  "commissionStatus": "queued"
}
```

| Field | Rules |
|-------|--------|
| `commissionRate` | Required, `0`–`100` |
| `commissionStatus` | Optional: `paid` \| `queued` \| `hold` |

**Response:** `ClubCommissionResponse`.

**Also:** Club detail responses may include `commissionRate` / `commissionStatus` for authenticated detail views.

**FE note:** Edits here are the source of truth for partnership % used when building payout rows.

---

## 6. Payouts information (money to club partners / BA)

**Service:** PaymentService  
**Base:** `/payment/finance/payouts`  
**Scope:** Settlement **information** APIs (queue / mark paid / hold). Not automatic bank transfer.

| Who | Can |
|-----|-----|
| `ADMIN` / `SUPERADMIN` | Full list, create, update status |
| `BUSINESS_ADMIN` | List/summary filtered to their `businessAdminEmail` |

### 6.1 List payouts (+ embedded summary)

`GET /payment/finance/payouts?status=&clubId=&filterByBa=true`

| Query | Notes |
|-------|--------|
| `status` | `queued` \| `paid` \| `hold` |
| `clubId` | Filter one club |
| `filterByBa` | Default `true` — BA sees own rows |

**Response `200`**

```json
{
  "payouts": [
    {
      "id": "…",
      "clubId": "…",
      "clubName": "Skybar",
      "businessAdminEmail": "ba@example.com",
      "periodLabel": "Weekend of 12–14 Jul",
      "grossAmount": 1280000,
      "feeAmount": 153600,
      "refundsAmount": 8400,
      "netPayout": 1118000,
      "commissionRate": 12,
      "status": "queued",
      "notes": null,
      "paidAt": null,
      "createdAt": "…",
      "updatedAt": "…"
    }
  ],
  "total": 6,
  "summary": {
    "pendingSettlement": 1118000,
    "settledPaid": 0,
    "platformCommission": 153600,
    "onHold": 0,
    "totalRows": 6
  }
}
```

**FE columns (Platform Admin Payouts tab)**

| Column | Field |
|--------|--------|
| Club | `clubName` |
| Gross | `grossAmount` |
| Fee | `feeAmount` |
| Refunds | `refundsAmount` |
| Net payout | `netPayout` |
| Status | `status` (`queued` / `paid` / `hold`) |

**KPI cards** ← `summary` (or dedicated endpoint below).

### 6.2 Summary only

`GET /payment/finance/payouts/summary`  
Same KPIs as `summary` object above.

### 6.3 Create payout row (Admin)

`POST /payment/finance/payouts`

```json
{
  "clubId": "club-1",
  "clubName": "NEON Indiranagar",
  "businessAdminEmail": "ba@example.com",
  "periodLabel": "Weekend of 12–14 Jul",
  "grossAmount": 1420000,
  "refundsAmount": 0,
  "commissionRate": 10,
  "feeAmount": null,
  "status": "queued",
  "notes": null
}
```

| Field | Notes |
|-------|--------|
| `clubId`, `grossAmount` | Required |
| `feeAmount` | Optional; if omitted, fee = `gross * commissionRate / 100` |
| `netPayout` | Computed server-side: `gross - fee - refunds` |
| `status` | Default `queued` |

### 6.4 Update status (Admin) — “Run payouts” / Hold

`PUT /payment/finance/payouts/{id}/status`

```json
{ "status": "paid", "notes": "Settled Tue T+2" }
```

Setting `paid` also sets `paidAt`.

---

## 7. Refunds & Disputes (money back to end user — case workflow)

**Service:** PaymentService  
**Base:** `/payment/finance/refunds`  
**Auth:** `ADMIN` \| `SUPERADMIN`  
**Scope:** Admin case management (approve / deny / mark dispute). Not automatic Cashfree refund execution.

### 7.1 List (tabs: Pending / Disputes / All)

`GET /payment/finance/refunds?status=&tab=`

| Query | Behavior |
|-------|----------|
| `tab=pending` | `status=pending` |
| `tab=dispute` or `disputes` | `status=dispute` |
| `tab=all` / omit | All cases |
| `status=` | Direct filter: `pending` \| `approved` \| `denied` \| `dispute` |

**Response `200`**

```json
{
  "refunds": [
    {
      "id": "…",
      "referenceId": "RF-2839",
      "userName": "Aditya M.",
      "userEmail": "user@example.com",
      "clubId": "…",
      "clubName": "NEON",
      "reason": "Double charged",
      "amount": 1200,
      "currency": "INR",
      "orderId": "clubwiz-…",
      "ticketId": "…",
      "status": "dispute",
      "notes": null,
      "resolvedBy": null,
      "resolvedAt": null,
      "createdAt": "…",
      "updatedAt": "…"
    }
  ],
  "total": 5,
  "pendingCount": 2,
  "disputeCount": 2
}
```

**FE card layout**

| UI | Field |
|----|--------|
| User | `userName` |
| Ref | `referenceId` |
| Subtitle | `reason` · `clubName` · relative `createdAt` |
| Amount | `amount` (+ `currency`) |
| Badge | `status` |
| Actions | Approve / Deny (and Dispute if needed) |

### 7.2 Get one

`GET /payment/finance/refunds/{id}`

### 7.3 Create case

`POST /payment/finance/refunds`

```json
{
  "referenceId": "RF-2839",
  "userName": "Aditya M.",
  "userEmail": "user@example.com",
  "clubId": "…",
  "clubName": "NEON",
  "reason": "Double charged",
  "amount": 1200,
  "currency": "INR",
  "orderId": "…",
  "ticketId": "…",
  "status": "pending",
  "notes": null
}
```

| Field | Notes |
|-------|--------|
| `reason`, `amount` | Required (`amount` ≥ 0.01) |
| `referenceId` | Optional; server generates `RF-####` if omitted |
| `status` | Default `pending`; use `dispute` for chargebacks |
| `currency` | Default `INR` |

### 7.4 Resolve actions

| Action | Method | Path | Body (optional) |
|--------|--------|------|-----------------|
| Approve | `PUT` | `/payment/finance/refunds/{id}/approve` | `{ "notes": "…" }` |
| Deny | `PUT` | `/payment/finance/refunds/{id}/deny` | `{ "notes": "…" }` |
| Mark dispute | `PUT` | `/payment/finance/refunds/{id}/dispute` | `{ "notes": "…" }` |

Approve/Deny set `resolvedBy` (JWT subject) + `resolvedAt`.

---

## 8. Auth & error handling (FE checklist)

1. **Guest events / featured:** never send JWT (or ignore expired token); endpoints are permitAll.
2. **Admin carousel / finance mutate:** require Platform Admin JWT; expect `401`/`403` if wrong role.
3. **BA commission / payouts:** BA JWT; only own clubs / own payout rows.
4. Error bodies often look like `{ "message": "…" }` — show toast from `message`.
5. Amounts are **numeric INR major units** (not paise) unless your UI formats otherwise.
6. Do not break existing booking / create-order / webhook flows; these APIs are additive.

---

## 9. Recommended FE ownership

| App | Features |
|-----|----------|
| **clubwiz-user** | Public list, public detail, featured hero (`slideType` EVENT/PROMO) |
| **clubwiz-admin** (Platform Admin) | Carousel manage, commission rates, payouts table + KPIs, refunds/disputes tabs |
| **BA portal** (if separate) | Read commission; read own payouts/summary |

---

## 10. Quick endpoint index

### Guest / User
- `GET /event-management/events/public/list`
- `GET /event-management/events/public/{id}`
- `GET /event-management/events/public/featured`
- `GET /event-management/events/featured`

### Admin carousel
- `GET /event-management/events/carousel/manage`
- `POST|DELETE /event-management/events/{eventId}/carousel/promote`
- `PUT /event-management/events/carousel/reorder`
- `POST|PUT|DELETE /event-management/events/carousel/promos[/{promoId}]`
- `PUT /event-management/events/carousel/promos/reorder`

### Commission
- `GET /clubs/commissions`
- `GET /clubs/{id}/commission`
- `PUT /clubs/{id}/commission` (Admin)

### Payouts
- `GET /payment/finance/payouts`
- `GET /payment/finance/payouts/summary`
- `POST /payment/finance/payouts` (Admin)
- `PUT /payment/finance/payouts/{id}/status` (Admin)

### Refunds & disputes
- `GET /payment/finance/refunds`
- `GET /payment/finance/refunds/{id}`
- `POST /payment/finance/refunds`
- `PUT /payment/finance/refunds/{id}/approve|deny|dispute`

---

## 11. Out of scope for current backend (do not block FE)

- Automatic Cashfree **bank payout** to partners
- Automatic Cashfree **refund** to payment instrument
- Frontend screens themselves (this doc is the contract)

For settlement/refund UX, FE should drive **status workflows** via the APIs above; payment-provider execution can be a later backend phase.
