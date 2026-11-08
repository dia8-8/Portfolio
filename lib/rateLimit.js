/**
 * Tiny in-memory sliding-window limiter, keyed by IP.
 * On serverless this is per instance, so it is a best-effort brake, not a guarantee.
 * The hard cap on spend is a monthly limit set in the Anthropic Console (see README).
 */
const buckets = new Map();
const WINDOW_MS = 10 * 60 * 1000;

export function clientIp(req) {
	const fwd = req.headers.get("x-forwarded-for");
	return (fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip")) || "anon";
}

export function rateLimit(key, limit) {
	const now = Date.now();
	const hits = (buckets.get(key) || []).filter((t) => now - t < WINDOW_MS);
	if (hits.length >= limit) {
		buckets.set(key, hits);
		return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - hits[0])) / 1000) };
	}
	hits.push(now);
	buckets.set(key, hits);
	if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.some((t) => now - t < WINDOW_MS)) buckets.delete(k);
	return { ok: true };
}
