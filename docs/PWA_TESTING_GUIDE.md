# PWA Testing Guide

## Pre-Deployment Testing

Before deploying to production, test the PWA functionality locally.

## Step 1: Build for Production

```bash
npm run build
npm start
```

The app will be available at http://localhost:3000

Note: Service worker is disabled in development mode (`npm run dev`), so you must build for production to test PWA features.

## Step 2: Test Service Worker Registration

### Chrome DevTools Method

1. Open Chrome or Edge
2. Navigate to http://localhost:3000
3. Open DevTools (F12)
4. Go to **Application** tab
5. Click **Service Workers** in the left sidebar

**What to check:**
- ✅ Service worker should be registered
- ✅ Status should be "activated and running"
- ✅ Source should be `/sw.js`

### Console Method

In the browser console, run:

```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service Worker registered:', reg);
  console.log('Scope:', reg.scope);
});
```

Should output the registration details.

## Step 3: Verify Manifest

### DevTools Method

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Manifest** in the left sidebar

**What to check:**
- ✅ Name: "Clarify - Your Personal Notes"
- ✅ Short name: "Clarify"
- ✅ Start URL: "/"
- ✅ Theme color: #E8613A
- ✅ Background color: #000000
- ✅ Display: standalone
- ✅ Icons: 8 icons listed (may show warnings if PNGs not generated yet)

### Direct Method

Navigate to http://localhost:3000/manifest.json

The manifest should load with all the configuration.

## Step 4: Test Installation

### Desktop (Chrome/Edge)

1. Look for install icon (⊕) in the address bar
2. Click it
3. Click "Install"
4. App should open in a standalone window

**What to check:**
- ✅ App opens without browser UI (address bar, tabs)
- ✅ App has its own window
- ✅ Icon appears in Start Menu (Windows) or Applications (Mac/Linux)
- ✅ Can be pinned to taskbar/dock

### Mobile Simulation (Chrome DevTools)

1. Open DevTools (F12)
2. Click device toolbar icon (phone/tablet icon)
3. Select a mobile device (iPhone, Pixel, etc.)
4. Look for install prompt at bottom of screen
5. Click "Install"

Note: Real mobile testing is better, see Step 9.

## Step 5: Test Offline Mode

### Method 1: Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Check **Offline** checkbox
4. Refresh the page

**What to check:**
- ✅ App should still load
- ✅ Static assets served from cache
- ✅ Offline page shows for uncached routes

### Method 2: Service Worker

1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Navigate to different pages

### Method 3: System Offline

1. Disable your network connection
2. Refresh the page
3. Try navigating

**Expected behavior:**
- Home page loads (cached)
- Notes page loads (cached)
- Previously viewed notes load
- New uncached routes show `/offline` page

## Step 6: Test Caching

### Check Cache Storage

1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **Cache Storage**

**Expected caches:**
- `google-fonts` - Google Fonts
- `static-images` - Images
- `static-resources` - CSS/JS
- `firebase-data` - Firebase API responses
- `notes-pages` - App pages
- `workbox-precache-v2-...` - Precached assets

### Verify Cached Files

Click on each cache to see what's stored:

**google-fonts:**
- Fonts from fonts.googleapis.com
- Fonts from fonts.gstatic.com

**static-images:**
- PNG, JPG, SVG files

**static-resources:**
- JavaScript bundles
- CSS files

**notes-pages:**
- /notes routes

## Step 7: Test Offline Functionality

### Create a Note Offline

1. Load the app while online
2. Go offline (Network tab → Offline)
3. Navigate to "New Note"
4. Create a note
5. Save it

**What to check:**
- ✅ Note is saved to localStorage
- ✅ No error messages
- ✅ Note appears in pending sync queue

### Go Back Online

1. Uncheck "Offline" in Network tab
2. Wait a few seconds

**What to check:**
- ✅ Note syncs to Firebase automatically
- ✅ Console shows sync success
- ✅ Pending queue is cleared

Check console for:
```
[Clarify] Synced 1 pending note(s)
```

## Step 8: Run Lighthouse Audit

### Steps

1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Select categories:
   - ✅ Performance
   - ✅ Progressive Web App
   - ✅ Best Practices
   - ✅ Accessibility
   - ✅ SEO
4. Select device: Mobile or Desktop
5. Click "Generate report"

### Target Scores (Production with PNG Icons)

- **PWA**: 100 (with all icons generated)
- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 100

### Common PWA Audit Items

✅ Registers a service worker
✅ Responds with a 200 when offline
✅ Contains a web app manifest
✅ Has a themed application (theme-color meta tag)
✅ Viewport meta tag set
✅ Icons for add to home screen (if PNGs generated)

Note: Without PNG icons, you'll see warnings but the app still works.

## Step 9: Test on Real Devices

### iOS (Safari)

1. Deploy to a HTTPS server or use ngrok for local testing:
   ```bash
   npx ngrok http 3000
   ```
2. Open the ngrok URL on your iPhone
3. Tap Share → Add to Home Screen
4. Open the app from home screen

**What to check:**
- ✅ App opens in standalone mode (no Safari UI)
- ✅ Status bar is black
- ✅ App splash screen appears (if icons generated)
- ✅ Works offline after initial load

### Android (Chrome)

1. Deploy to HTTPS or use ngrok
2. Open the URL on your Android device
3. Look for install banner
4. Tap "Install" or Menu → Add to Home screen

**What to check:**
- ✅ Install prompt appears
- ✅ App installs like a native app
- ✅ Opens in standalone mode
- ✅ Works offline

## Step 10: Test Security

### CSP Headers

1. Open DevTools → Network tab
2. Load the app
3. Click on the document request
4. Check Response Headers

**Should see:**
- ✅ Content-Security-Policy header
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff

### Private Data Protection

1. Open DevTools → Application → Cache Storage
2. Inspect each cache

**What NOT to see:**
- ❌ User note content
- ❌ Authentication tokens
- ❌ Firebase config secrets

Only static assets and short-lived API responses should be cached.

## Step 11: Test Update Mechanism

### Trigger Service Worker Update

1. Make a change to the app (e.g., edit a page)
2. Rebuild: `npm run build`
3. Restart: `npm start`
4. Refresh the page in the browser

**What should happen:**
- New service worker installs
- Old service worker is replaced
- Page reloads with new content

## Troubleshooting Tests

### Service Worker Not Registering

**Check:**
- Are you on HTTPS or localhost?
- Did you build for production? (`npm run build`)
- Is the app running on `npm start` (not `npm run dev`)?

**Fix:**
```bash
npm run build
npm start
```

### Install Prompt Not Appearing

**Check:**
- Is the app already installed?
- Are you in incognito mode? (won't work)
- Is manifest.json valid?

**Fix:**
1. DevTools → Application → Manifest
2. Look for errors
3. Uninstall existing app
4. Clear cache and refresh

### Offline Mode Not Working

**Check:**
- Did you load the page online first?
- Is service worker activated?
- Are you testing a cached route?

**Fix:**
1. Load app online
2. Wait for service worker to activate
3. Go offline
4. Try cached routes first (/notes, /)

### Lighthouse PWA Score Low

**Common issues:**
- Missing PNG icons (generate them)
- Not HTTPS (deploy to production)
- Service worker not registered

**Fix:**
- Generate icons: See `scripts/generate-icons.md`
- Deploy to HTTPS host (Vercel, Netlify, etc.)
- Rebuild the app

## Automated Testing Script

Create a test script to check PWA readiness:

```bash
# Build
npm run build

# Start server in background
npm start &
SERVER_PID=$!

# Wait for server
sleep 5

# Run Lighthouse CI (if installed)
npx lighthouse http://localhost:3000 \
  --only-categories=pwa \
  --chrome-flags="--headless" \
  --output=html \
  --output-path=./lighthouse-report.html

# Kill server
kill $SERVER_PID

# Open report
echo "Report saved to lighthouse-report.html"
```

## Deployment Testing Checklist

Before going live:

- [ ] Build succeeds without errors
- [ ] Service worker registers correctly
- [ ] Manifest is valid (no errors in DevTools)
- [ ] App installs on desktop
- [ ] App installs on iOS
- [ ] App installs on Android
- [ ] Offline mode works (view cached notes)
- [ ] Offline sync works (create note offline, syncs when online)
- [ ] Lighthouse PWA score is 100 (with icons)
- [ ] No console errors
- [ ] No CSP violations
- [ ] Private data not cached
- [ ] Icons generated (all sizes)
- [ ] App works on HTTPS

## Post-Deployment Verification

After deploying to production:

1. Visit the production URL
2. Install the app
3. Test offline functionality
4. Run Lighthouse audit
5. Check real device installation (iOS, Android)
6. Monitor for errors in production logs

## Success Criteria

PWA is ready when:

✅ Service worker registers successfully
✅ Manifest loads without errors
✅ App installs on all platforms
✅ Offline mode works (cached pages load)
✅ Offline sync works (notes sync when back online)
✅ Lighthouse PWA score is 100
✅ No security issues (CSP enforced, no data leaks)
✅ Performance is good (90+ score)

## Resources

- Chrome DevTools: https://developer.chrome.com/docs/devtools/
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- PWA Builder: https://www.pwabuilder.com/
- Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

**Happy Testing!** 🚀
