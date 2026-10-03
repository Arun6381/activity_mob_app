# User Details - React Native app (Expo)

A native app for your Next.js + Supabase backend.
- Anyone: choose a form, fill it in, preview, save.
- Admin: sign in, then use the Admin menu:
  - Records: view and search entries per form, export to Excel (opens the share sheet).
  - Templates: create and edit forms (fields, types, required, dropdown options, order, active/inactive).
  - Monthly archive: back up a finished month to Excel, remove it from the database, and download archived files.

The app talks only to your hosted website. No Supabase keys are stored in the app.

## 1. Update the backend first
Copy the 5 files from the `mobile-backend` folder into your Next.js project (same paths), deploy,
and make sure the site is live on an https address:
- `lib/auth.ts` (also accepts a bearer token)
- `app/api/login/route.ts` (also returns a token)
- `app/api/forms/route.ts` and `app/api/forms/[slug]/route.ts` (new, public form list and definitions)
- `app/api/admin/archive/route.ts` (can return a download link as JSON)
The archive feature also needs `archive.sql` from the website project to have been run in Supabase.

## 2. Set your server address
Edit `src/config.ts` (or copy `.env.example` to `.env`) and replace `https://YOUR-APP.vercel.app`.

## 3. Run it on your phone (fastest way to test)
1. Install the Expo Go app on your phone (Play Store / App Store) and join the same Wi-Fi as your PC.
2. In this folder run:
   ```
   npm install
   npx expo start
   ```
3. Scan the QR code with Expo Go (Android) or the Camera app (iPhone).
Expo Go must support SDK 57; update it from the store if it complains.

## 4. Build an installable APK (no store needed)
Option A, cloud build (easiest, free Expo account):
```
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
When it finishes, open the link it prints on your phone and install the APK.

Option B, on your PC with Android Studio:
```
npx expo prebuild -p android
cd android
gradlew assembleRelease        (Windows: .\gradlew assembleRelease)
```
The APK is in `android/app/build/outputs/apk/release/`. It is signed with a debug key, so it is for your own team only.

## Notes
- Back button: Android's back button goes to the previous screen. Sign-in lasts 7 days, then you sign in again.
- Release builds only allow https addresses. Do not use http://localhost or a PC IP address.
- iPhone installs need an Apple developer account, so this guide covers Android only.
- Archiving deletes the month's entries from the database after the Excel backup is verified. Keep copies of the downloaded files.
- Change the app name, icon and colours in `app.json`, `assets/` and `src/theme.ts`.
