# iOS Build Fix - Ionic Appflow Configuration

## Problem
```
No .xcworkspace found at '/Users/ionic-cloud-team/builds/gvkousik123/clubwiz-mobile-admin/ios/App/App.xcworkspace'
Detected IOS_PACKAGE_MANAGER=:cocoapods. CocoaPods builds require a .xcworkspace
```

The iOS build fails because:
- CocoaPods is the package manager but `.xcworkspace` doesn't exist
- `.xcworkspace` is created by running `pod install`
- The build system can't find the workspace file needed to build the app

---

## Solution: Configure Ionic Appflow

### Option 1: Enable Swift Package Manager (Recommended for Capacitor 8)

Set this environment variable in **Ionic Appflow Dashboard → Build → Environments → Production (iOS)**:

```
ENABLE_SPM_SUPPORT=true
```

**Why this works:**
- Capacitor 8 supports Swift Package Manager (SPM)
- SPM is simpler and doesn't require `pod install`
- No `.xcworkspace` dependency

**Steps:**
1. Log in to [Ionic Appflow Dashboard](https://dashboard.ionicframework.com)
2. Go to **Build → Production**
3. Click **Environments → APIs** (or create if doesn't exist)
4. Add new variable:
   - Key: `ENABLE_SPM_SUPPORT`
   - Value: `true`
5. Save and re-trigger build

---

### Option 2: Use CocoaPods (Alternative)

If SPM doesn't work, use CocoaPods with proper setup.

#### 1. Verify Podfile Exists

A `Podfile` has been created at `ios/App/Podfile`. It contains:

```ruby
require_relative '../../node_modules/@capacitor/ios/scripts/podfile_pre'
require_relative '../../node_modules/@capacitor/ios/scripts/podfile_capacitor'
require_relative '../../node_modules/@capacitor/ios/scripts/podfile_post'

platform :ios, '14.0'

post_install do |installer|
  assertDeploymentTarget(installer)
end
```

#### 2. Local Setup (for testing)

Run this to set up iOS locally:

```bash
# Make script executable
chmod +x setup-ios.sh

# Run setup
./setup-ios.sh
```

This will:
- Run `pod install` in `ios/App/`
- Generate `App.xcworkspace/`
- Verify the setup

#### 3. Configure Ionic Appflow for CocoaPods

Add these environment variables in Ionic Appflow:

**Environments → APIs:**
```
IOS_PACKAGE_MANAGER=cocoapods
```

**Build settings:**
- Keep `PROJECT_WEB_DIR=out` (already correct)
- Add `IOS_PACKAGE_MANAGER=cocoapods`

---

## Complete Ionic Appflow Environment Variables

For the **Production (APIs)** environment, set all of these:

```
NEXT_PUBLIC_API_BASE_URL=https://clubwiz.in
NEXT_PUBLIC_SOCKET_URL=https://clubwiz.in
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDsVMRh9hZJV2gj0x8uDvuIrAAyWS-V2WY
NEXT_PUBLIC_APP_ENV=production
ENABLE_SPM_SUPPORT=true
```

Or if using CocoaPods:
```
NEXT_PUBLIC_API_BASE_URL=https://clubwiz.in
NEXT_PUBLIC_SOCKET_URL=https://clubwiz.in
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDsVMRh9hZJV2gj0x8uDvuIrAAyWS-V2WY
NEXT_PUBLIC_APP_ENV=production
IOS_PACKAGE_MANAGER=cocoapods
```

---

## Build Order (Ionic Appflow Pipeline)

```
GitHub Push
    ↓
Ionic Appflow Build Triggered
    ↓
Install Node Dependencies
    ↓
Run: npm run build
    ↓ (creates 'out/' directory)
Capacitor Sync
    ↓
🍎 iOS Build:
    If ENABLE_SPM_SUPPORT=true:
        ├─ Use Swift Package Manager
        └─ No xcworkspace needed ✅
    
    If IOS_PACKAGE_MANAGER=cocoapods:
        ├─ Pod Install (generates xcworkspace)
        └─ Build with xcworkspace ✅
    ↓
Generate IPA
    ↓
Ready for download
```

---

## Troubleshooting

### If Build Still Fails

1. **Check CocoaPods Version**
   ```bash
   pod --version  # Should be 1.11+
   ```

2. **Update CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

3. **Clear Pod Cache**
   ```bash
   cd ios/App
   pod deintegrate
   rm -rf Pods Podfile.lock
   pod install
   ```

4. **Verify Podfile**
   ```bash
   cd ios/App
   pod repo update
   pod install
   ```

### Local Testing Before Appflow

```bash
# Build the web app
npm run build

# Sync to Capacitor
npx cap sync ios

# Verify setup
./setup-ios.sh

# Open in Xcode
open ios/App/App.xcworkspace
```

---

## Recommended: Use SPM (Easiest)

**Action Items:**
1. ✅ Podfile created
2. ✅ setup-ios.sh created for local testing
3. ⏳ Set `ENABLE_SPM_SUPPORT=true` in Ionic Appflow
4. ⏳ Re-trigger build in Appflow

---

## Files Changed

- ✅ Created: `ios/App/Podfile`
- ✅ Created: `setup-ios.sh`
- ✅ Created: `IOS_BUILD_SETUP.md` (this file)

---

## Next Steps

### Immediate: For Next Build Attempt
1. Go to [Ionic Appflow Dashboard](https://dashboard.ionicframework.com)
2. Navigate to **Build → Production → Environments → APIs**
3. Add: `ENABLE_SPM_SUPPORT=true`
4. Click **Save**
5. Re-run the build

### For Local Testing
```bash
chmod +x setup-ios.sh
./setup-ios.sh
npx cap open ios
```

---

## Support

If issues persist:
- Check [Capacitor iOS Troubleshooting](https://capacitorjs.com/docs/ios)
- Review [Ionic Appflow Docs](https://ionicframework.com/docs/appflow)
- Verify `capacitor.config.json` has `"webDir": "out"`
