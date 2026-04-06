# FarmCast Mobile Apps

FarmCast is now available as native iOS and Android mobile applications, built with Capacitor.

## What's New

Your web-based FarmCast app has been enhanced with:

- **Native iOS App** - Publish to Apple App Store
- **Native Android App** - Publish to Google Play Store
- **Enhanced Geolocation** - Uses native GPS for better accuracy
- **Mobile Optimizations** - Improved touch interactions and mobile UX
- **App Store Ready** - Complete metadata and setup guides included

## Mobile Features

### Native Capabilities
- **GPS Location** - Native geolocation API for precise weather data
- **Push Notifications** - Weather alerts delivered to device (ready to enable)
- **Local Notifications** - Offline notification support
- **Haptic Feedback** - Touch feedback for better UX (ready to enable)
- **Status Bar** - Themed to match your app
- **Splash Screen** - Professional app launch experience

### Works Offline
- All core features available offline
- Weather data cached locally
- Works without internet connection

### Mobile-Optimized
- Touch-friendly interface
- Optimized for small screens
- Fast performance on mobile devices
- Native scrolling and gestures

## Quick Start

### iOS Development (Mac Required)
```bash
npm run ios:setup
npm run ios:open
```

### Android Development (Any OS)
```bash
npm run android:setup
npm run android:open
```

See `QUICK_START_MOBILE.md` for detailed instructions.

## Documentation

- **QUICK_START_MOBILE.md** - 5-minute setup guide
- **MOBILE_APP_SETUP.md** - Complete technical documentation
- **APP_STORE_METADATA.md** - App store listing information

## File Structure

```
farmcast/
├── android/                 # Android app (created after setup)
├── ios/                     # iOS app (created after setup)
├── capacitor.config.ts      # Capacitor configuration
├── src/
│   └── utils/
│       └── capacitor.ts     # Mobile utilities
└── public/
    ├── icon.svg            # App icon (SVG)
    ├── icon-192.png        # App icon (192x192)
    ├── icon-512.png        # App icon (512x512)
    └── manifest.json       # PWA manifest
```

## Development Workflow

1. **Make changes** to React code
2. **Build**: `npm run build`
3. **Sync**: `npx cap sync`
4. **Run** in Xcode or Android Studio

Or use the shortcut:
```bash
npm run mobile:sync
```

## Mobile-Specific Code

Check if running on mobile:
```typescript
import { isNativePlatform } from './utils/capacitor';

if (isNativePlatform()) {
  // Mobile-specific code
}
```

Use native geolocation:
```typescript
import { getCurrentPosition } from './utils/capacitor';

const location = await getCurrentPosition();
```

Add haptic feedback:
```typescript
import { triggerHaptic } from './utils/capacitor';

await triggerHaptic('medium');
```

## Environment Variables

Your `.env` file is automatically bundled into the mobile apps during build.

**Important**: Never commit `.env` with production keys!

## Publishing

### iOS App Store Requirements
- Mac with Xcode
- Apple Developer Account ($99/year)
- App icons and screenshots
- Privacy policy URL

### Google Play Store Requirements
- Google Play Developer Account ($25 one-time)
- App icons and screenshots
- Privacy policy URL

See `APP_STORE_METADATA.md` for complete publishing guide.

## Platform Support

- **iOS**: 13.0 and later
- **Android**: 5.0 (API level 21) and later

## Testing

Test on real devices for best results:
- iOS: Connect iPhone via USB
- Android: Enable USB debugging and connect

Or use simulators/emulators in Xcode/Android Studio.

## Troubleshooting

### Build fails?
```bash
npm run build
npx cap sync
```

### iOS issues?
```bash
cd ios/App
pod install
cd ../..
npx cap sync ios
```

### Android issues?
In Android Studio:
1. File > Invalidate Caches / Restart
2. Build > Clean Project
3. Build > Rebuild Project

## Next Steps

1. **Customize Icons** - Replace placeholder icons with your branding
2. **Test Features** - Try all features on real devices
3. **Configure Push** - Set up push notifications (optional)
4. **Prepare Metadata** - Write app store descriptions
5. **Create Screenshots** - Capture screenshots for app stores
6. **Submit Apps** - Publish to App Store and Google Play

## Support

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Developer Center](https://developer.apple.com/)
- [Android Developer Center](https://developer.android.com/)

## License

Same license as your FarmCast web application.

---

Built with ❤️ using Capacitor, React, and TypeScript.
