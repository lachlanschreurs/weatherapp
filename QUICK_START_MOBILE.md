# FarmCast Mobile App - Quick Start Guide

Your FarmCast app is now mobile-ready! Follow these simple steps to build iOS and Android apps.

## What You Need

### For iOS (requires Mac):
1. Mac computer running macOS
2. Xcode (free from Mac App Store)
3. CocoaPods: `sudo gem install cocoapods`

### For Android (Windows, Mac, or Linux):
1. Android Studio (free download)
2. Java Development Kit (included with Android Studio)

## 5-Minute Setup

### Build iOS App (Mac only)

```bash
# Step 1: Build and setup iOS
npm run ios:setup

# Step 2: Open in Xcode
npm run ios:open

# Step 3: In Xcode
# - Select your development team (sign in with Apple ID)
# - Choose a device or simulator
# - Click the Play button ▶️
```

Your app is now running on iOS!

### Build Android App

```bash
# Step 1: Build and setup Android
npm run android:setup

# Step 2: Open in Android Studio
npm run android:open

# Step 3: In Android Studio
# - Wait for Gradle sync to finish
# - Choose a device or create emulator
# - Click the Run button ▶️
```

Your app is now running on Android!

## Making Updates

After changing your React code:

```bash
# Rebuild and sync to mobile
npm run mobile:sync

# Then reload the app in Xcode/Android Studio
```

## Testing on Your Phone

### iOS:
1. Connect iPhone with USB cable
2. Trust computer on phone
3. Select your iPhone in Xcode
4. Click Run

### Android:
1. Enable Developer Options on phone (tap Build Number 7 times)
2. Enable USB Debugging
3. Connect with USB cable
4. Allow USB debugging on phone
5. Select your device in Android Studio
6. Click Run

## Customization Before Publishing

### 1. Change App ID
Edit `capacitor.config.ts`:
```typescript
appId: 'com.yourcompany.farmcast'
```

### 2. Add App Icons
Use https://www.appicon.co/ to generate icons, then:
- iOS: Add to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Android: Add to `android/app/src/main/res/mipmap-*/`

### 3. Update Environment Variables
Your `.env` file is automatically included in the build!

## Publishing

### iOS App Store
1. In Xcode: Product > Archive
2. Upload to App Store Connect
3. Submit for review
4. Approval typically takes 24-48 hours

### Google Play Store
1. In Android Studio: Build > Generate Signed Bundle
2. Upload to Google Play Console
3. Submit for review
4. Approval typically takes a few hours

## Need Help?

See the detailed guide: `MOBILE_APP_SETUP.md`
App Store metadata: `APP_STORE_METADATA.md`

## Useful Commands

```bash
npm run build              # Build web app
npm run mobile:sync        # Sync to iOS & Android
npm run ios:open          # Open in Xcode
npm run android:open      # Open in Android Studio
```

## Troubleshooting

**App won't build?**
```bash
npm run build
npx cap sync
```

**iOS pod errors?**
```bash
cd ios/App
pod install
cd ../..
```

**Android Gradle issues?**
In Android Studio: File > Invalidate Caches / Restart

---

That's it! Your FarmCast app is ready for mobile. 📱🚀
