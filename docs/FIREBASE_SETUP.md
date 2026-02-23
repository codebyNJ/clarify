# Firebase Setup Instructions

## 1. Firebase Console Setup

### Enable Authentication
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **clarify-v1**
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Google** provider
5. Add authorized domains if needed

### Enable Firestore Database
1. Navigate to **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (we'll deploy rules separately)
4. Select your preferred region (e.g., `us-central1`)

### Deploy Security Rules
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init firestore` (select existing project)
4. Deploy rules: `firebase deploy --only firestore:rules`

Or manually copy the rules from `firestore.rules` to Firebase Console:
- Go to **Firestore Database** > **Rules**
- Paste the content of `firestore.rules`
- Click **Publish**

## 2. Required Firestore Indexes

Create these composite indexes in Firebase Console:

### Index 1: Notes by User (Pinned First)
- Collection: `users/{userId}/notes`
- Fields:
  - `isPinned` (Descending)
  - `updatedAt` (Descending)
- Query scope: Collection

### Index 2: Notes by Workspace
- Collection: `users/{userId}/notes`
- Fields:
  - `workspaceId` (Ascending)
  - `updatedAt` (Descending)
- Query scope: Collection

### Index 3: Notes - Not Archived
- Collection: `users/{userId}/notes`
- Fields:
  - `isArchived` (Ascending)
  - `isPinned` (Descending)
  - `updatedAt` (Descending)
- Query scope: Collection

### Index 4: Search by Tags
- Collection: `users/{userId}/notes`
- Fields:
  - `tags` (Array-contains)
  - `updatedAt` (Descending)
- Query scope: Collection

### Index 5: Activity Timeline
- Collection: `users/{userId}/activity`
- Fields:
  - `timestamp` (Descending)
- Query scope: Collection

**Note:** Firebase will prompt you with a link to create indexes when you first run queries that require them.

## 3. Environment Variables (Optional)

If you want to use environment variables instead of hardcoded config:

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCGsVtI_8gOz9Kr_AM02tWPmz6fJNQ5048
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=clarify-v1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=clarify-v1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=clarify-v1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=253283358803
NEXT_PUBLIC_FIREBASE_APP_ID=1:253283358803:web:e4ff9cace15bc777edcea6
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-KH915W9PYJ
```

Then update `lib/firebase.ts` to use `process.env.NEXT_PUBLIC_*` instead of hardcoded values.

## 4. Testing

### Test Authentication
1. Run dev server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Get Started"
4. Sign in with Google
5. Should redirect to `/notes`

### Test Firestore
1. Create a new note in the app
2. Check Firestore Console to see the data
3. Verify the document structure matches the schema

## 5. Production Deployment

### Vercel (Recommended)
1. Connect your GitHub repo to Vercel
2. Add environment variables (if using .env)
3. Deploy
4. Add Vercel domain to Firebase authorized domains:
   - Firebase Console > Authentication > Settings > Authorized domains
   - Add: `your-app.vercel.app`

### Firebase Hosting (Alternative)
```bash
firebase init hosting
firebase deploy --only hosting
```

## 6. Data Migration (If Needed)

If you have existing notes in localStorage:

```typescript
// Run this once in browser console on the notes page
const notes = JSON.parse(localStorage.getItem('notes') || '[]');
notes.forEach(async (note) => {
  await saveNoteToFirestore(currentUser.uid, {
    ...note,
    id: String(note.id),
  });
});
```

## 7. Monitoring & Analytics

### Enable Analytics
- Already configured in `lib/firebase.ts`
- View analytics in Firebase Console > Analytics

### Enable Crashlytics (Optional)
```bash
npm install firebase
```

Add to `lib/firebase.ts`:
```typescript
import { getAnalytics } from "firebase/analytics"
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
```

## 8. Backup Strategy

### Automated Backups
1. Go to Firebase Console > Firestore Database
2. Click on **Backups** tab
3. Set up automated daily backups
4. Choose backup location (Cloud Storage bucket)

### Manual Export
```bash
gcloud firestore export gs://clarify-v1-backups/$(date +%Y%m%d)
```

## Schema Documentation

See `lib/firestore-schema.ts` for complete schema documentation including:
- User profiles
- Notes with rich metadata
- Workspaces
- Activity logs
- Shared notes (future feature)

The schema is designed to be:
- ✅ Production-ready
- ✅ Scalable (uses subcollections)
- ✅ Secure (proper rules)
- ✅ Adaptable (feature flags, extensible)
- ✅ Searchable (keywords, indexes)
