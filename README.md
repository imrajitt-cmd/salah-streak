# Salah Streak (Android)

## How releases work
Every time you push a change to GitHub, the "Build and release APK" workflow builds a signed APK
and publishes it as a numbered release (v1, v2, v3...). The app checks for a newer release when opened
and shows an "Update available" card with a Download button.

To describe an update, edit `whatsnew.txt` before you push. Its text is shown in the update card.

## One-time setup
1. Repo > Settings > Secrets and variables > Actions > New repository secret. Add three secrets from
   KEEP-PRIVATE-signing-secrets.txt: KEY_ALIAS, KEYSTORE_PASSWORD, KEYSTORE_BASE64.
2. Upload these files to the repo (drag them in, overwriting the old ones).
3. Edit `.github/workflows/build-apk.yml` on GitHub and paste in the new contents.
4. Open the Actions tab, wait for the green check, then open the repo's Releases section on the right
   and download the APK from Assets.
5. Uninstall the old app once, then install this APK. Updates install over it from now on.

Keep the repository Public: the app reads releases without a login.

## Store builds
Google Play does not allow apps to download updates from outside the store. Store builds are made with
STORE_BUILD=1, which switches the update card off (handled in the store-submission step).
