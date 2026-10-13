# Salah Streak (Android)

Prayer times for Dhaka, a live countdown for the current prayer, streaks / XP / badges,
and **real reminders that fire even when the app is closed** (scheduled on the phone for the next 14 days).

## Get the APK (no Android Studio needed)

1. Create a free account at https://github.com and make a **new repository** (Private is fine).
2. Click **uploading an existing file** and drag in **everything from this folder**,
   including the hidden `.github` folder. Commit to the `main` branch.
   - If `.github/workflows/build-apk.yml` did not upload (macOS hides dot-folders; press Cmd+Shift+. in Finder),
     click **Add file → Create new file**, type the name `.github/workflows/build-apk.yml`,
     and paste the contents of that file.
3. Open the repo's **Actions** tab. The "Build Android APK" job starts by itself (about 5 to 8 minutes).
   If it doesn't, open it and press **Run workflow**.
4. When it turns green, open the run and download **salah-streak-apk** from *Artifacts*. Unzip it to get `app-debug.apk`.
5. Send the APK to your phone and install it. Android will ask you to allow "install unknown apps" for your browser or file manager.

## First launch on the phone

1. Reminders → **Turn on** (allow notifications).
2. Reminders → **Exact timing → Allow** (Android 12+ "Alarms & reminders"), so reminders arrive on the minute.
3. Tap **Test** and close the app. A notification should arrive in 3 seconds.
4. Set battery for the app to **Unrestricted** and allow auto-start (Xiaomi, Oppo, Vivo, Realme, some Samsung),
   otherwise the phone may cancel reminders when it cleans up background apps.

Open the app at least once every two weeks so it can schedule the next 14 days.

## Notes
- Times: Karachi method (Fajr and Isha 18°), Hanafi Asr, for Dhaka. Compare with your local mosque for the first few days.
- Progress is stored on the phone only.
- To change the location, edit `LAT`, `LNG`, `TZ` in `src/index.html`.
- Using Android Studio instead: `npm ci && npm run build && npx cap add android && python tools/make_icons.py android/app/src/main/res && npx cap sync android && npx cap open android`
