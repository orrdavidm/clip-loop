# Clip Loop

Big-button page that plays chosen segments of YouTube videos full-screen on repeat.

## Files
- `public/index.html` – the app (no build step)
- `public/clips.js` – the clip list; edit this to add/change clips
- `wrangler.jsonc` – Cloudflare Worker config (static assets, custom domain)

## Deploy
Live at https://clip-loop.wuorr.com (Cloudflare Worker `clip-loop`).

    npx wrangler deploy

Or connect this repo to the Worker in the Cloudflare dashboard (Workers Builds)
so every push to `main` deploys automatically. It must be served over https;
the YouTube player won't work reliably from a local `file://` open.

No Cloudflare Access in front of it (nothing private), so the TV browser
doesn't need an email-code login.

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
