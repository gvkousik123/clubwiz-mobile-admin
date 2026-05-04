# ClubWiz Mobile App Setup Guide (Ionic Appflow + Capacitor)

> Based on what was done in `clubwiz-user-mobile` to produce a working downloadable APK.  
> Follow these steps in order to do the same for `clubwiz-mobile-admin`.

---

## Overview

The app is a **Next.js** web app wrapped as a native Android/iOS app using **Capacitor**, built and distributed via **Ionic Appflow**.

**Build flow:**
```
Next.js code → next build (output: export) → out/ folder → Capacitor copies to android/ → Appflow builds APK
```

---

## Step 1 — Install Capacitor Packages

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/app
```

- `@capacitor/core` — base Capacitor runtime
- `@capacitor/android` — Android native project
- `@capacitor/ios` — iOS native project
- `@capacitor/cli` — CLI tools (`npx cap sync`, `npx cap open`)
- `@capacitor/app` — **Required** for hardware back button handling on Android

---

## Step 2 — Create `capacitor.config.json`

Create this file in the project root:

```json
{
  "appId": "in.clubwiz.admin",
  "appName": "ClubWiz Admin",
  "webDir": "out",
  "server": {
    "androidScheme": "https",
    "cleartext": false
  },
  "android": {
    "allowMixedContent": false
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 3000,
      "backgroundColor": "#021313",
      "spinnerColor": "#ffffff"
    }
  }
}
```

> **Critical:** `"webDir": "out"` — must match where Next.js exports static files.

---

## Step 3 — Update `next.config.mjs`

Enable static export and bake in environment variables:

```js
const nextConfig = {
  // REQUIRED for Capacitor — generates static out/ folder
  output: 'export',

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['storage.googleapis.com'],
  },

  env: {
    // Baked into the static build at compile time — works offline in APK
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clubwiz.in',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_KEY_HERE',
  },
}

export default nextConfig
```

> **Note:** `redirects()` and `rewrites()` are ignored in static export. Navigation is client-side only.

---

## Step 4 — Fix Dynamic Routes for Static Export

Next.js static export only generates HTML for paths explicitly returned by `generateStaticParams`.

### In every `app/.../[id]/page.tsx`:

```tsx
export async function generateStaticParams() {
  return [{ id: '_' }]; // only generates /path/_/index.html
}
```

### In every `app/.../[id]/client-page.tsx`, read the real ID from query string:

```tsx
import { useParams, useSearchParams } from 'next/navigation';

const params = useParams();
const searchParams = useSearchParams();

// Static export: params.id is always '_'; real ID comes from ?id= query param
const itemId = (params.id && params.id !== '_' ? params.id : searchParams.get('id')) as string;
```

### For all navigation links, use `?id=` instead of the ID in the path:

```tsx
// ❌ WRONG — this path doesn't exist in static export
<Link href={`/v1/club/${club.id}`}>

// ✅ CORRECT
<Link href={`/v1/club/_?id=${club.id}`}>
```

---

## Step 5 — Fix Navigation (No `window.location.href`)

In Capacitor WebView, `window.location.href = '/path'` causes a full page reload (blank screen). Replace all navigation with router APIs:

```tsx
// ❌ WRONG
window.location.href = '/v1/auth/intro';

// ✅ CORRECT
import { useRouter } from 'next/navigation';
const router = useRouter();
router.replace('/v1/auth/intro');

// For force-logout / non-component contexts:
window.history.pushState({}, '', '/v1/auth/intro');
window.dispatchEvent(new PopStateEvent('popstate'));
```

---

## Step 6 — Fix `www/index.html`

Capacitor uses `www/index.html` as a fallback entry point. The default template redirects to `localhost:3000` which breaks the APK.

```html
<script>
  // Only redirect to dev server when actually running in browser dev mode
  if (window.location.hostname === 'localhost') {
    window.location.href = 'http://localhost:3000';
  } else {
    // In APK: load the static export
    window.location.href = '/index.html';
  }
</script>
```

---

## Step 7 — Add Android Hardware Back Button Support

Create `components/capacitor-back-button.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function CapacitorBackButton() {
  const router = useRouter();
  const navDepth = useRef(0);

  useEffect(() => {
    const origPushState = window.history.pushState.bind(window.history);
    window.history.pushState = (...args) => {
      navDepth.current++;
      origPushState(...args);
    };

    const handlePopState = () => {
      if (navDepth.current > 0) navDepth.current--;
    };
    window.addEventListener('popstate', handlePopState);

    let listenerHandle: { remove: () => void } | null = null;

    const setupAppListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        listenerHandle = await App.addListener('backButton', () => {
          if (navDepth.current > 0) {
            router.back();
          }
          // At root: Capacitor minimizes the app (correct behaviour)
        });
      } catch {
        const handleBackButton = (e: Event) => {
          e.preventDefault();
          if (navDepth.current > 0) router.back();
        };
        document.addEventListener('backbutton', handleBackButton, false);
        return () => document.removeEventListener('backbutton', handleBackButton, false);
      }
    };

    setupAppListener();

    return () => {
      window.history.pushState = origPushState;
      window.removeEventListener('popstate', handlePopState);
      listenerHandle?.remove();
    };
  }, [router]);

  return null;
}
```

Then add it to `app/layout.tsx`:

```tsx
import { CapacitorBackButton } from '@/components/capacitor-back-button';

// Inside body:
<CapacitorBackButton />
```

---

## Step 8 — Hide Scrollbars Globally

In `app/globals.css`:

```css
html::-webkit-scrollbar,
body::-webkit-scrollbar,
*::-webkit-scrollbar {
  display: none;
}

html, body, * {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
```

---

## Step 9 — Add Android Permissions to `AndroidManifest.xml`

File: `android/app/src/main/AndroidManifest.xml`

Add inside `<manifest>` before `<application>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.WRITE_CONTACTS" />
<uses-permission android:name="android.permission.GET_ACCOUNTS" />
```

---

## Step 10 — Set Up App Icons

### Android Icons

Required sizes:

| Folder | Size |
|--------|------|
| `mipmap-mdpi` | 48×48 px |
| `mipmap-hdpi` | 72×72 px |
| `mipmap-xhdpi` | 96×96 px |
| `mipmap-xxhdpi` | 144×144 px |
| `mipmap-xxxhdpi` | 192×192 px |

Replace these files in each `android/app/src/main/res/mipmap-*/` folder:
- `ic_launcher.png`
- `ic_launcher_round.png`
- `ic_launcher_foreground.png`

Use **macOS sips** to resize from a 1024×1024 source:

```bash
sips -z 48 48 icon-1024.png --out mipmap-mdpi/ic_launcher.png
sips -z 72 72 icon-1024.png --out mipmap-hdpi/ic_launcher.png
sips -z 96 96 icon-1024.png --out mipmap-xhdpi/ic_launcher.png
sips -z 144 144 icon-1024.png --out mipmap-xxhdpi/ic_launcher.png
sips -z 192 192 icon-1024.png --out mipmap-xxxhdpi/ic_launcher.png
```

---

## Step 11 — Sync Capacitor

After any native changes (icons, permissions, plugins):

```bash
npx cap sync android
```

This copies the `out/` folder and plugin changes into the Android project.

---

## Step 12 — Set Up Ionic Appflow

1. Go to **https://dashboard.ionicframework.com**
2. Create a new App → connect to your GitHub repo
3. Go to **Builds → Environments** and add:
   ```
   NEXT_PUBLIC_API_BASE_URL = https://clubwiz.in
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = your_key_here
   ```
4. Go to **Build → New Build**
   - Platform: Android
   - Build Type: Debug (for testing) or Release
   - Environment: select the one you created
5. Download the APK once build succeeds

### Appflow Build Requirements

The project root must have:
- `package.json` with a `build` script
- `capacitor.config.json` with `webDir: "out"`
- `android/` folder committed to git
- `next.config.mjs` with `output: 'export'`

---

## Step 13 — Commit `android/` and `ios/` to Git

Appflow needs the native projects in git to build:

```bash
git add android/ ios/ capacitor.config.json
git commit -m "feat: add Capacitor native projects for Appflow build"
git push
```

---

## Summary of Files Changed/Created

| File | What was done |
|------|--------------|
| `next.config.mjs` | Added `output: 'export'`, `images.unoptimized`, env fallbacks |
| `capacitor.config.json` | Created with appId, webDir=out, SplashScreen config |
| `www/index.html` | Fixed localhost redirect condition |
| `app/layout.tsx` | Added `<CapacitorBackButton />` |
| `app/globals.css` | Global scrollbar hide for all elements |
| `app/page.tsx` | Changed `window.location.href` → `router.replace()` |
| `lib/api-client.ts` | Changed force-logout redirect to `history.pushState` |
| `lib/api-client-public.ts` | Changed token expiry redirect to `history.pushState` |
| `components/capacitor-back-button.tsx` | Created — handles Android back button |
| `app/v1/*/[id]/client-page.tsx` | Added `useSearchParams` to read ID from `?id=` query |
| `app/v1/home/page.tsx` | Changed all Links to `/path/_?id=${id}` |
| `components/clubs/club-card.tsx` | Changed navigation to use `?id=` query params |
| `android/app/src/main/AndroidManifest.xml` | Added all required permissions |
| `android/app/src/main/res/mipmap-*/` | Replaced with custom app icons |
| `package.json` | Added `@capacitor/app`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios` |

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| APK stuck on loading screen | `www/index.html` redirecting to localhost | Fix redirect condition to check `hostname === 'localhost'` |
| Appflow "No out found" error | `output: 'export'` disabled | Re-enable it in `next.config.mjs` |
| Club/event detail pages blank | Static export only generates `/_` route | Use `/path/_?id=real-id` navigation pattern |
| Back button closes the app | DOM `backbutton` event unreliable | Use `@capacitor/app` `App.addListener('backButton')` |
| Scrollbar visible in app | CSS only applied to `html`/`body` | Apply `scrollbar-width: none` to `*` |
| Wrong/default app icon | Old Capacitor placeholder icons | Replace all `mipmap-*/ic_launcher*.png` files |
| Google Maps not loading | Env var not baked into static build | Add fallback in `next.config.mjs` `env` section |
