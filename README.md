# Clip Loop

Big-button page that plays chosen segments of YouTube videos full-screen on repeat.

## Files
- `src/index.html` – the player page (big buttons, full screen, play/pause + slider)
- `src/admin.html` – the parent page at `/admin` for adding, editing, reordering and removing clips
- `src/worker.js` – Cloudflare Worker: serves both pages, stores the clip list in KV,
  and serves it to the player as `/clips.js`
- `wrangler.jsonc` – Worker config (KV binding, Access audience, custom domain)

## Deploy
Live at https://clip-loop.wuorr.com (Cloudflare Worker `clip-loop`).

    npx wrangler deploy

Or connect this repo to the Worker in the Cloudflare dashboard (Workers Builds)
so every push to `main` deploys automatically.

## Parent page and sign-in
`/admin` sits behind a Cloudflare Access app (email one-time code), and the Worker
also verifies the Access token itself, so the page and its API return 403 to anyone
who isn't signed in. The player page and `/clips.js` stay public so the TV and iPad
never need to log in.

## iPad
1. Open the URL in Safari → Share → **Add to Home Screen** (launches full-screen).
2. Optional: Settings → Accessibility → **Guided Access**, then triple-click to lock
   him into the app.

## Google TV
Google TV has no built-in web browser, so install a TV browser (e.g. TV Bro) from the
Play Store or via the Downloader app, open the URL, and bookmark it. The remote's
D-pad moves between clips, center/OK plays, Back returns to the grid.

## Notes
- A card that turns faded means that video's owner disabled embedding; pick a
  different upload of the same clip.
- Looping checks the time 5×/sec and jumps back ~0.15 s before `end`, so the
  YouTube end-screen and suggestions never appear.
- Taps on the video are blocked so he can't wander into YouTube; tapping
  resumes playback if it ever pauses.
