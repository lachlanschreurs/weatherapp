# FarmCast Mobile App Setup Guide

Your FarmCast weather app is now ready to be built as native iOS and Android mobile apps using Capacitor!

## What's Been Set Up

✅ **Capacitor Integration** - Native mobile wrapper for iOS and Android
✅ **Mobile Plugins Installed**:
- Geolocation - Native GPS location access
- Push Notifications - Weather alerts on mobile
- Local Notifications - Offline notifications
- Haptics - Touch feedback
- Status Bar - Native status bar styling
- Splash Screen - Professional app launch screen

✅ **Mobile-Optimized Features**:
- Native geolocation with automatic fallback to web
- Haptic feedback for better UX
- Status bar theming
- Splash screen configuration

## Prerequisites

### For iOS Development
1. **Mac computer** (required for iOS)
2. **Xcode** (free from Mac App Store)
3. **CocoaPods** - Install with: `sudo gem install cocoapods`
4. **Apple Developer Account** ($99/year to publish to App Store)

### For Android Development
1. **Android Studio** (free download)
2. **Java Development Kit (JDK)** - Android Studio includes this
3. **Google Play Developer Account** ($25 one-time fee to publish)

## Quick Start

### Step 1: Build Your Web App
```bash
npm run build
```

### Step 2: Set Up iOS (Mac Only)
```bash
npm run ios:setup
npm run ios:open
```
This will:
- Create the iOS project
- Sync your web app
- Open Xcode

In Xcode:
1. Select a development team (your Apple ID)
2. Connect your iPhone or select a simulator
3. Click the Play button to run

### Step 3: Set Up Android
```bash
npm run android:setup
npm run android:open
```
This will:
- Create the Android project
- Sync your web app
- Open Android Studio

In Android Studio:
1. Wait for Gradle sync to complete
2. Connect your Android device or start an emulator
3. Click the Run button

## Development Workflow

### Making Changes
1. Edit your React code as normal
2. Build and sync to mobile:
```bash
npm run mobile:sync
```
3. Reload the app in Xcode/Android Studio

### Testing on Real Devices
- **iOS**: Connect iPhone via USB, trust computer, select device in Xcode
- **Android**: Enable Developer Mode and USB Debugging, connect via USB

## App Configuration

### Update App Icons
1. Create icons (1024x1024 PNG)
2. iOS: Place in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
3. Android: Place in `android/app/src/main/res/mipmap-*/`

Or use: https://www.appicon.co/ to generate all sizes

### Update Splash Screen
1. Create splash image (2732x2732 PNG)
2. iOS: Add to Xcode Assets
3. Android: Place in `android/app/src/main/res/drawable/`

### Change App ID/Name
Edit `capacitor.config.ts`:
```typescript
appId: 'com.yourcompany.farmcast',
appName: 'FarmCast'
```

## Environment Variables

Your `.env` file works automatically! The Supabase and Stripe keys are bundled into the app during build.

⚠️ **Security Note**: Never commit `.env` with production keys to git.

## Publishing

### iOS App Store
1. Open project in Xcode
2. Set version and build number
3. Archive the app (Product > Archive)
4. Upload to App Store Connect
5. Submit for review

Full guide: https://capacitorjs.com/docs/ios/deploying-to-app-store

### Google Play Store
1. Open project in Android Studio
2. Build > Generate Signed Bundle/APK
3. Create upload key and build release AAB
4. Upload to Google Play Console
5. Submit for review

Full guide: https://capacitorjs.com/docs/android/deploying-to-google-play

## Mobile-Specific Features

### Geolocation
Uses native GPS on mobile for better accuracy and battery life:
```typescript
import { getCurrentPosition } from './utils/capacitor';
const location = await getCurrentPosition();
```

### Haptic Feedback
Add touch feedback anywhere:
```typescript
import { triggerHaptic } from './utils/capacitor';
await triggerHaptic('medium'); // 'light', 'medium', or 'heavy'
```

### Push Notifications
Already configured! To enable:
```typescript
import { setupPushNotifications } from './utils/capacitor';
await setupPushNotifications();
```

### Local Notifications
Show notifications even when offline:
```typescript
import { scheduleLocalNotification } from './utils/capacitor';
await scheduleLocalNotification('Rain Alert', 'Heavy rain expected in 2 hours');
```

## Troubleshooting

### iOS Build Errors
- Run `npx cap sync ios` after any web changes
- Clean build: In Xcode, Product > Clean Build Folder
- Update pods: `cd ios/App && pod install && cd ../..`

### Android Build Errors
- Invalidate caches: File > Invalidate Caches / Restart
- Clean project: Build > Clean Project
- Sync Gradle: File > Sync Project with Gradle Files

### App Not Updating
```bash
npm run build
npx cap sync
```
Then reload in Xcode/Android Studio

## Live Reload (Optional)

For faster development, run your dev server and point the app to it:

1. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac)
2. Edit `capacitor.config.ts`:
```typescript
server: {
  url: 'http://YOUR_IP:5173',
  cleartext: true
}
```
3. Run `npm run dev`
4. Sync and rebuild the app

⚠️ Remove this before publishing!

## Next Steps

1. **Customize Icons & Splash** - Make it look professional
2. **Test on Real Devices** - Try all features
3. **Set Up Push Notifications** - Connect to a service like Firebase
4. **Add Mobile Analytics** - Track usage with Firebase Analytics
5. **Prepare Store Listings** - Screenshots, descriptions, keywords

## Useful Commands

```bash
npm run build              # Build web app
npm run mobile:sync        # Sync changes to mobile apps
npm run ios:open          # Open Xcode
npm run android:open      # Open Android Studio
npx cap sync              # Sync all platforms
npx cap update            # Update Capacitor dependencies
```

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)

## Support

Need help? Check the Capacitor community:
- [Capacitor Discord](https://discord.com/invite/UPYYRhtyzp)
- [Capacitor Forums](https://forum.ionicframework.com/c/capacitor/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/capacitor)

---

**Ready to launch your FarmCast mobile apps!** 🚀📱
