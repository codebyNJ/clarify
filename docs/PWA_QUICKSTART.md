# PWA Quick Start Guide

## What is PWA?

Clarify is now a Progressive Web App (PWA). This means you can:
- Install it on your phone/desktop like a native app
- Use it offline to view and edit notes
- Get a fast, app-like experience

## Installation

### On Your Phone (iOS)

1. Open Clarify in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. The Clarify icon appears on your home screen!

### On Your Phone (Android)

1. Open Clarify in Chrome
2. Tap the menu (3 dots)
3. Select "Add to Home screen" or "Install app"
4. Tap "Install"
5. The app is now installed!

### On Your Computer

1. Open Clarify in Chrome or Edge
2. Look for the install icon (⊕) in the address bar
3. Click "Install"
4. Clarify opens as a standalone app!

## Using Offline

### What Works Offline?

✅ View previously loaded notes
✅ Create new notes
✅ Edit existing notes
✅ Navigate the app

### What Requires Internet?

❌ Syncing notes to the cloud
❌ Google Sign In
❌ Loading new notes

### How It Works

When you're offline:
1. Your edits are saved locally
2. A sync queue tracks pending changes
3. When back online, changes sync automatically
4. No data is lost!

## Icon Generation (For Developers)

The app works without PNG icons in development, but for production you should generate them:

### Quick Method (5 minutes)

1. Visit https://www.pwabuilder.com/imageGenerator
2. Upload `public/icons/icon.svg`
3. Download the generated icons
4. Extract to `public/icons/` folder
5. Done!

### Manual Method

See `scripts/generate-icons.md` for detailed instructions using ImageMagick or Sharp.

## Security

Your notes are private:
- Notes are NOT cached by the service worker
- Only static assets (CSS, JS, fonts) are cached
- All security headers remain enforced
- Firebase authentication is required
- Data syncs only when you're logged in

## Troubleshooting

**App won't install?**
- Make sure you're using HTTPS (required)
- Check if you're in private/incognito mode (won't work)
- Try a different browser (Chrome/Edge recommended)

**Offline mode not working?**
- Visit the app while online first
- Let it fully load before going offline
- Check if service worker is registered (DevTools → Application)

**Need help?**
- See full documentation in `PWA_SETUP.md`
- Check browser console for errors
- Open an issue in the repository

## More Information

For detailed documentation, see `PWA_SETUP.md`.

---

**Enjoy using Clarify offline!** 📝
