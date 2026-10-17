# Salah Streak (Android)

## How releases work
Every time you push a change to GitHub, the "Build and release APK" workflow builds a signed APK
and publishes it as a numbered release (v1, v2, v3...). The app checks for a newer release when opened
(at most every 6 hours) and shows an "Update available" card with a Download button.

To describe an update, edit `whatsnew.txt` before you push. Its text is shown in the update card.

## Updating the app
1. Change the files (or replace them with a new zip's files) and upload them to the repo. Commit.
2. Wait for the green check in the Actions tab, then check Releases for the new version.
3. Open the app: the update card appears. Tap Download update, then Install.
The signing key stays the same, so the update installs over the old app and keeps your progress.

Keep the repository Public: the app reads releases without a login.

## What is generated at build time
`tools/make_icons.py` creates the app icon, splash screens, the two notification sounds
and adds the approximate-location permission to the Android manifest.

## Store builds
Google Play does not allow apps to download updates from outside the store. Store builds are made with
STORE_BUILD=1, which switches the update card off (handled in the store-submission step).
