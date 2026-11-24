# Clip Loop for Android TV

A tiny full-screen app that opens https://clip-loop.wuorr.com/ so it gets its own
tile on the Google TV home screen. The web page does everything else.

- No browser bars; the page's own full-screen button is hidden.
- Remote: arrows move between clips, center plays, Back returns to the clip grid
  (and exits the app from the grid).
- Coming back to the app reloads the clip list, unless a video is playing.
- The screen stays awake while the app is open.

## Build
GitHub Actions (`.github/workflows/android-tv.yml`) builds a signed APK on every
push that touches `android/` and publishes it to the `tv-latest` release.
Run it by hand from the Actions tab with "Run workflow".

Short download link (handy to type on the TV): **clip-loop.wuorr.com/tv**

## Install on Google TV
1. Install **Downloader** (by AFTVnews) from the Play Store.
2. Settings → Apps → Security & restrictions → Unknown sources → turn on for Downloader.
3. Open Downloader, enter `clip-loop.wuorr.com/tv`, and install when prompted.

New builds install over the old one (same signing key, higher version number).

## About the signing key
`cliploop-tv.keystore` is committed on purpose so CI can sign every build with
the same key without any secret setup. Android only allows an update if it's
signed with the same key, so this keeps updates seamless. The tradeoff: anyone
could sign an APK that Android would accept as an update to this app. That only
matters if someone gets a rogue APK onto the TV, which is not a realistic risk
for a sideloaded kid's app. To lock it down, move the keystore into a repository
secret and decode it in the workflow.
