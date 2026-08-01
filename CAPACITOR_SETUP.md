# Capacitor Mobile Setup Guide - ClubWiz Admin

## Project Status ✅

ClubWiz Admin mobile app has been successfully configured with Capacitor for cross-platform Android and iOS development from a single Next.js codebase.

### Installed Components:
- ✅ Capacitor core and CLI
- ✅ Android platform (`android/` directory)
- ✅ iOS platform (`ios/` directory)  
- ✅ Next.js build configured for Capacitor
- ✅ `capacitor.config.json` configured
- ✅ Web app synced to native projects

---

## Development Workflow

### 1. **Start Development Server**

In the project root (`clubwiz-mobile-admin`):

```bash
npm run dev
```

This starts the Next.js dev server on `http://localhost:3000`.

### 2. **Run on Android**

#### Prerequisites:
- Android Studio installed
- Android SDK configured
- Java Development Kit (JDK) installed
- Android device connected via USB or emulator running

#### Steps:

```bash
# Open Android project in Android Studio
npm run cap:open
```

Or build and run from command line:

```bash
# Build Next.js first
npm run build

# Sync latest changes to Android
npm run cap:sync

# Or manually build
cd android && ./gradlew clean && ./gradlew build && cd ..
```

### 3. **Run on iOS**

#### Prerequisites:
- Xcode installed (on macOS)
- iOS 14+ device or simulator
- CocoaPods installed
- Ruby (usually comes with macOS)

#### Initial Setup (First Time Only)

```bash
# Set up iOS dependencies with CocoaPods
chmod +x setup-ios.sh
./setup-ios.sh
```

This script:
- Installs CocoaPods dependencies
- Generates the `.xcworkspace` file
- Verifies everything is set up correctly

#### Steps to Run:

```bash
# Sync web assets to native project
npx cap sync ios

# Open iOS project in Xcode
npx cap open ios
```

Or from Xcode:
1. Open `ios/App/App.xcworkspace` (not .xcodeproj!)
   - **Important**: Use `.xcworkspace`, not `.xcodeproj`
2. Select your target device/simulator
3. Press ▶ Run button

---

## Ionic Appflow Build Configuration

### iOS Build Fix

If you're building iOS through **Ionic Appflow**, you may encounter:
```
No .xcworkspace found at '.../ios/App/App.xcworkspace'
```

**Solution:** Set this environment variable in Ionic Appflow Dashboard:

Go to **Build → Production → Environments → APIs** and add:

```
ENABLE_SPM_SUPPORT=true
```

**Why:** This enables Swift Package Manager (SPM) which doesn't require CocoaPods or `.xcworkspace`.

For detailed instructions, see [IOS_BUILD_SETUP.md](IOS_BUILD_SETUP.md)

---

## Architecture Details

### Configuration: `capacitor.config.json`

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

**Key Points:**
- `webDir`: Points to Next.js static export directory (`out`)
- `androidScheme`: HTTPS only in production
- `cleartext`: Disabled in production
- Splash screen configured with ClubWiz branding

### Build for Production

#### Android APK

```bash
# Build Next.js
npm run build

# Sync to Android
npm run cap:sync

# Open in Android Studio and build APK
npm run cap:open
# Then: Build > Generate Signed APK/Bundle
```

#### iOS IPA

```bash
# Build Next.js
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode and build
npx cap open ios
# Then: Product > Archive
```

---

## Important Notes

### Next.js Configuration

The `next.config.mjs` has been configured for Capacitor:
- Static export enabled (`output: 'export'`) for production builds
- Creates `out/` directory with all static assets
- Image optimization disabled (`unoptimized: true`)

### Build Scripts

```json
"scripts": {
  "build": "next build",
  "build:mobile": "next build && npx cap sync android",
  "dev": "next dev",
  "cap:sync": "npx cap sync android",
  "cap:open": "npx cap open android"
}
```

Use `npm run build:mobile` for quick Android sync after building.

### Android/iOS Directories

These are native project files:
- `android/` - Gradle-based Android project
- `ios/` - Xcode Swift project

Never commit generated native code (already in `.gitignore`).

---

## Troubleshooting

### Issue: "Connection refused" on Android Emulator

**Solution:** Use the correct localhost IP for emulator testing
```bash
# The Android emulator sees host as 10.0.2.2
# This is typically already configured in capacitor.config.json
```

### Issue: iOS simulator shows blank page

**Solution:** 
1. Verify Next.js build: `npm run build`
2. Sync to iOS: `npx cap sync ios`
3. Rebuild in Xcode: `Cmd + Shift + K` (clean build folder)

### Issue: "Capacitor not found" in web app

**Solution:** Ensure Capacitor.js is properly loaded and Capacitor plugin is installed in `package.json`

### Issue: CocoaPods installation fails on M1/M2 Mac

**Solution:**
```bash
# Use native architecture
arch -native zsh
pod install
```

---

## Running Both Platforms Simultaneously

### Terminal 1 (Web Dev Server)
```bash
npm run dev
```

### Terminal 2 (Android)
```bash
npm run cap:open
# Then run from Android Studio
```

### Terminal 3 (iOS)
```bash
npx cap open ios
# Then run from Xcode
```

---

## File Structure

```
clubwiz-mobile-admin/
├── app/                          # Next.js app directory (server+client)
│   └── bz/                       # Admin routes
├── android/                      # Android native project (Gradle)
├── ios/                          # iOS native project (Xcode)
├── www/                          # Capacitor web entry point
│   └── index.html               # Bootstrap HTML
├── .next/                        # Next.js build output
├── out/                          # Static export for Capacitor
├── capacitor.config.json         # Capacitor configuration
├── next.config.mjs              # Next.js configuration
├── package.json                 # Dependencies (Next.js + Capacitor)
└── node_modules/                # Installed packages
```

---

## Environment Variables

The admin panel uses environment variables for configuration:

```bash
# API endpoints
NEXT_PUBLIC_API_BASE_URL=https://clubwiz.in

# Socket for real-time updates
NEXT_PUBLIC_SOCKET_URL=https://clubwiz.in

# Maps integration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key

# Environment mode
NEXT_PUBLIC_APP_ENV=production
```

These are set during build time and cannot be changed after build.

---

## Next Steps

1. **First Time Setup**:
   ```bash
   npm install
   chmod +x setup-ios.sh
   ./setup-ios.sh
   npm run build
   npx cap sync ios
   ```

2. **Local Testing**:
   - Android: `npm run cap:open`
   - iOS: `npx cap open ios`

3. **Production Build**:
   ```bash
   npm run build
   npx cap sync
   ```

4. **Ionic Appflow Deployment**:
   - Set `ENABLE_SPM_SUPPORT=true` in environment
   - Push to GitHub
   - Monitor build in Appflow dashboard

---

## Support

For issues:
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Ionic Appflow Guide](https://ionicframework.com/docs/appflow)
- [iOS Build Setup](IOS_BUILD_SETUP.md)
