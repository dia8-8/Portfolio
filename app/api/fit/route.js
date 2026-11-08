import Anthropic from "@anthropic-ai/sdk";
import { FIT_SYSTEM } from "@/lib/prompt";
import { analyzeJob, analysisFacts } from "@/lib/analyze";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
const LIMIT = Number(process.env.AGENT_FIT_LIMIT) || 6;
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

/**
 * Fit-Check summary agent. The matching itself is deterministic (lib/analyze.js);
 * the model only turns those verified facts into a short honest paragraph.
 * Streams plain text.
 */
export async function POST(req) {
	if (!client) return Response.json({ error: "offline" }, { status: 503 });

	const rl = rateLimit(`fit:${clientIp(req)}`, LIMIT);
	if (!rl.ok) return Response.json({ error: "rate_limited", retryAfter: rl.retryAfter }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

	const body = await req.json().catch(() => null);
	const jd = typeof body?.jd === "string" ? body.jd.trim().slice(0, 6000) : "";
	if (jd.length < 20) return Response.json({ error: "bad_request" }, { status: 400 });

	// Recomputed on the server so the client can't feed the model fake "facts".
	const facts = analysisFacts(analyzeJob(jd));

	const enc = new TextEncoder();
	const ac = new AbortController();
	req.signal.addEventListener("abort", () => ac.abort());

	const stream = new ReadableStream({
		async start(controller) {
			try {
				const s = client.messages.stream(
					{
						model: MODEL,
						max_tokens: 700,
						system: FIT_SYSTEM,
						output_config: { effort: "low" },
						messages: [{
							role: "user",
							content: `<analysis>\n${JSON.stringify(facts, null, 2)}\n</analysis>\n\n<job_description>\n${jd}\n</job_description>`,
						}],
					},
					{ signal: ac.signal }
				);
				s.on("text", (d) => { try { controller.enqueue(enc.encode(d)); } catch { /* client went away */ } });
				await s.finalMessage();
			} catch (err) {
				if (!ac.signal.aborted) console.error("[fit] agent error", err instanceof Anthropic.APIError ? err.status : "", err?.message);
			} finally {
				try { controller.close(); } catch { /* already closed */ }
			}
		},
		cancel() { ac.abort(); },
	});

	return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}
