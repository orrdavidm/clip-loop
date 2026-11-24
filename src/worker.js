// Clip Loop Worker
//   /            player page (public)
//   /clips.js    current clip list as `window.CLIPS = [...]` (public, read from KV)
//   /admin       parent page (behind Cloudflare Access; JWT verified here too)
//   /admin/api/clips   GET / PUT the clip list
//   /admin/api/title   look up a video's title via YouTube oEmbed

import PLAYER from "./index.html";
import ADMIN from "./admin.html";

const TEAM = "https://jolly-snowflake-6744.cloudflareaccess.com";
const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const SEED = [{ title: "Shaun the Sheep - Pizza", videoId: "nEbcZtoZNR8", start: 0, end: null }];

const html = body => new Response(body, {
  headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" },
});
const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { "content-type": "application/json", "cache-control": "no-store" },
});

async function getClips(env) {
  return (await env.CLIPS.get("clips", "json")) ?? SEED;
}

function validate(list) {
  if (!Array.isArray(list) || list.length > 200) throw new Error("Expected a list of up to 200 clips");
  return list.map((c, i) => {
    if (!c || typeof c !== "object") throw new Error(`Clip ${i + 1} is malformed`);
    const videoId = String(c.videoId ?? "");
    if (!ID_RE.test(videoId)) throw new Error(`Clip ${i + 1}: bad video ID`);
    const title = String(c.title ?? "").slice(0, 100);
    const start = Number(c.start ?? 0);
    if (!Number.isFinite(start) || start < 0) throw new Error(`Clip ${i + 1}: bad start time`);
    const end = c.end == null || c.end === "" ? null : Number(c.end);
    if (end !== null && (!Number.isFinite(end) || end <= start)) throw new Error(`Clip ${i + 1}: end must be after start`);
    return { title, videoId, start, end };
  });
}

// ---- Cloudflare Access JWT verification (defense in depth behind the Access app) ----
let certCache = { keys: null, at: 0 };
async function accessKeys(force = false) {
  if (!force && certCache.keys && Date.now() - certCache.at < 3600e3) return certCache.keys;
  const r = await fetch(TEAM + "/cdn-cgi/access/certs");
  const j = await r.json();
  certCache = { keys: j.keys || [], at: Date.now() };
  return certCache.keys;
}
const b64u = s => Uint8Array.from(
  atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")),
  ch => ch.charCodeAt(0),
);
const decodePart = s => JSON.parse(new TextDecoder().decode(b64u(s)));

async function verifyAccess(request, env) {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || !env.ACCESS_AUD) return null;
  const [h, p, s] = token.split(".");
  if (!s) return null;
  const header = decodePart(h), payload = decodePart(p);
  if (header.alg !== "RS256") return null;
  let jwk = (await accessKeys()).find(k => k.kid === header.kid);
  if (!jwk) jwk = (await accessKeys(true)).find(k => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey(
    "jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"],
  );
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64u(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) return null;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(env.ACCESS_AUD) || payload.iss !== TEAM || payload.exp * 1000 < Date.now()) return null;
  return payload;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/" || path === "/index.html") return html(PLAYER);

    if (path === "/clips.js") {
      const clips = await getClips(env);
      const body = "window.CLIPS = " + JSON.stringify(clips).replace(/</g, "\\u003c") + ";\n";
      return new Response(body, {
        headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-cache" },
      });
    }

    if (path === "/admin" || path.startsWith("/admin/")) {
      const user = await verifyAccess(request, env).catch(() => null);
      if (!user) return new Response("Sign-in required", { status: 403 });

      if (path === "/admin" || path === "/admin/") return html(ADMIN);

      if (path === "/admin/api/clips") {
        if (request.method === "GET") return json(await getClips(env));
        if (request.method === "PUT") {
          let list;
          try { list = validate(await request.json()); }
          catch (e) { return json({ error: e.message }, 400); }
          await env.CLIPS.put("clips", JSON.stringify(list));
          return json(list);
        }
        return json({ error: "Method not allowed" }, 405);
      }

      if (path === "/admin/api/title") {
        const id = url.searchParams.get("id") || "";
        if (!ID_RE.test(id)) return json({ error: "Bad video ID" }, 400);
        const r = await fetch("https://www.youtube.com/oembed?format=json&url=" +
          encodeURIComponent("https://www.youtube.com/watch?v=" + id));
        if (!r.ok) return json({ title: "" });
        const j = await r.json();
        return json({ title: j.title || "", author: j.author_name || "" });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};
