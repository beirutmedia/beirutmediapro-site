// Cloudflare Worker: serves the static site, plus /api/reels which pulls the
// latest Instagram reels for @beirut.media.pro via the Instagram Graph API.
//
// Secrets (set with `npx wrangler secret put <NAME>`, never commit them):
//   IG_TOKEN    long-lived Instagram access token
//   IG_USER_ID  Instagram professional account id (optional; defaults to "me")
//
// Token refresh: a daily cron (see wrangler.jsonc) refreshes the long-lived
// token and stores it in KV (binding REELS_KV) so it never expires.

const GRAPH = 'https://graph.instagram.com';
const CACHE_SECONDS = 3600;
const LIMIT = 12;

async function getToken(env) {
  if (env.REELS_KV) {
    const t = await env.REELS_KV.get('ig_token');
    if (t) return t;
  }
  return env.IG_TOKEN;
}

async function fetchReels(env) {
  const token = await getToken(env);
  if (!token) return { error: 'not_configured', reels: [] };
  const user = env.IG_USER_ID || 'me';
  const fields = 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp';
  const url = `${GRAPH}/${user}/media?fields=${fields}&limit=50&access_token=${encodeURIComponent(token)}`;
  const r = await fetch(url);
  if (!r.ok) return { error: 'upstream_' + r.status, reels: [] };
  const j = await r.json();
  const reels = (j.data || [])
    .filter(m => m.media_type === 'VIDEO' && (m.media_product_type === 'REELS' || !m.media_product_type))
    .slice(0, LIMIT)
    .map(m => ({
      id: m.id,
      caption: (m.caption || '').slice(0, 220),
      video: m.media_url,
      thumb: m.thumbnail_url,
      link: m.permalink,
      date: m.timestamp,
    }));
  return { reels };
}

async function handleReels(request, env, ctx) {
  const cache = caches.default;
  const key = new Request(new URL('/api/reels', request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  let body;
  try { body = await fetchReels(env); } catch (e) { body = { error: 'fetch_failed', reels: [] }; }
  const res = new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${body.error ? 60 : CACHE_SECONDS}`,
    },
  });
  if (!body.error) ctx.waitUntil(cache.put(key, res.clone()));
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/reels') return handleReels(request, env, ctx);
    return env.ASSETS.fetch(request);
  },
  async scheduled(event, env) {
    const token = await getToken(env);
    if (!token || !env.REELS_KV) return;
    const r = await fetch(`${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`);
    if (r.ok) {
      const j = await r.json();
      if (j.access_token) await env.REELS_KV.put('ig_token', j.access_token);
    }
  },
};
