import Anthropic from "@anthropic-ai/sdk";
import { CHAT_SYSTEM } from "@/lib/prompt";
import { projects, skills, profile, NOT_YET, SECTIONS } from "@/lib/content";
import { searchProjects, hasWord } from "@/lib/analyze";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
const LIMIT = Number(process.env.AGENT_CHAT_LIMIT) || 20;
const MAX_TURNS = 5; // tool-loop iterations per visitor message
const SECTION_IDS = [...new Set(Object.values(SECTIONS))];

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

/* ------------------------------------------------------------------
   Tools the Concierge can call. "search/get" tools return data to the
   model; "filter_projects" and "navigate" also emit an `action` event so
   the browser can actually do it (filter the grid, scroll the page).
   ------------------------------------------------------------------ */
const TOOLS = [
	{
		name: "search_projects",
		description: "Search Adam's portfolio projects with a natural-language query (e.g. 'games', 'api', 'maps'). Leave query empty to list all projects.",
		strict: true,
		input_schema: { type: "object", properties: { query: { type: "string", description: "Search words" } }, required: ["query"], additionalProperties: false },
	},
	{
		name: "get_skills",
		description: "Look up Adam's skills. Pass a technology name to check one (it reports honestly if he does not have it), or an empty string for the full list.",
		strict: true,
		input_schema: { type: "object", properties: { name: { type: "string", description: "Technology name, or empty for all" } }, required: ["name"], additionalProperties: false },
	},
	{
		name: "filter_projects",
		description: "Filter the project grid on the visitor's screen. Use after search_projects when the visitor asks to see a kind of project. Empty query clears the filter.",
		strict: true,
		input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false },
	},
	{
		name: "navigate",
		description: "Scroll the visitor's page to a section.",
		strict: true,
		input_schema: { type: "object", properties: { section: { type: "string", enum: SECTION_IDS } }, required: ["section"], additionalProperties: false },
	},
];

function runTool(name, input) {
	const str = (v) => (typeof v === "string" ? v.slice(0, 200) : "");
	if (name === "search_projects") {
		const r = searchProjects(str(input?.query));
		return { result: JSON.stringify({ count: r.hits.length, projects: r.hits.map(({ p }) => ({ title: p.title, description: p.desc, tags: p.labels, url: p.url })) }) };
	}
	if (name === "get_skills") {
		const q = str(input?.name).trim();
		if (!q) return { result: JSON.stringify({ skills: skills.map((s) => ({ name: s.name, level: s.level })) }) };
		const hit = skills.filter((s) => s.aliases.some((a) => hasWord(q, a)) || s.aliases.includes(q.toLowerCase()));
		if (hit.length) return { result: JSON.stringify({ found: hit.map((s) => ({ name: s.name, level: s.level })) }) };
		const gap = NOT_YET.find(([label, terms]) => label.toLowerCase() === q.toLowerCase() || terms.some((t) => hasWord(q, t)));
		return { result: JSON.stringify({ found: [], note: gap ? `${gap[0]} is not in Adam's toolkit yet.` : "Not listed in Adam's toolkit." }) };
	}
	if (name === "filter_projects") {
		const q = str(input?.query);
		return { result: JSON.stringify({ ok: true, shown: q ? searchProjects(q).hits.length : projects.length }), action: { name, input: { query: q } } };
	}
	if (name === "navigate") {
		const section = SECTION_IDS.includes(input?.section) ? input.section : null;
		if (!section) return { result: JSON.stringify({ ok: false, error: "unknown section" }), isError: true };
		return { result: JSON.stringify({ ok: true }), action: { name, input: { section } } };
	}
	return { result: JSON.stringify({ error: "unknown tool" }), isError: true };
}

/* ------------------------------------------------------------------ */

export async function GET() {
	return Response.json({ live: !!client }, { headers: { "Cache-Control": "no-store" } });
}

function cleanHistory(raw) {
	if (!Array.isArray(raw)) return null;
	const msgs = raw
		.slice(-12)
		.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
		.map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
	while (msgs.length && msgs[0].role !== "user") msgs.shift();
	if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
	return msgs;
}

export async function POST(req) {
	if (!client) return Response.json({ error: "offline" }, { status: 503 });

	const rl = rateLimit(`chat:${clientIp(req)}`, LIMIT);
	if (!rl.ok) return Response.json({ error: "rate_limited", retryAfter: rl.retryAfter }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

	const body = await req.json().catch(() => null);
	const history = cleanHistory(body?.messages);
	if (!history) return Response.json({ error: "bad_request" }, { status: 400 });

	const enc = new TextEncoder();
	const ac = new AbortController();
	req.signal.addEventListener("abort", () => ac.abort());

	const stream = new ReadableStream({
		async start(controller) {
			const send = (o) => { try { controller.enqueue(enc.encode(JSON.stringify(o) + "\n")); } catch { /* client went away */ } };
			const messages = [...history];
			try {
				for (let turn = 0; turn < MAX_TURNS; turn++) {
					const s = client.messages.stream(
						{
							model: MODEL,
							max_tokens: 1500,
							system: [{ type: "text", text: CHAT_SYSTEM, cache_control: { type: "ephemeral" } }],
							tools: TOOLS,
							output_config: { effort: "low" },
							messages,
						},
						{ signal: ac.signal }
					);
					s.on("text", (d) => send({ t: "text", d }));
					const msg = await s.finalMessage();

					if (msg.stop_reason === "refusal") {
						send({ t: "text", d: "I can't help with that one, but I'm happy to talk about Adam's projects, skills or background." });
						break;
					}
					if (msg.stop_reason === "max_tokens") { send({ t: "text", d: "…" }); break; }
					if (msg.stop_reason !== "tool_use") break;

					// Run every requested tool, then return ALL results in one user message.
					messages.push({ role: "assistant", content: msg.content });
					const results = [];
					for (const block of msg.content) {
						if (block.type !== "tool_use") continue;
						send({ t: "tool", name: block.name, input: block.input });
						const out = runTool(block.name, block.input);
						if (out.action) send({ t: "action", ...out.action });
						results.push({ type: "tool_result", tool_use_id: block.id, content: out.result, ...(out.isError ? { is_error: true } : {}) });
					}
					messages.push({ role: "user", content: results });
				}
				send({ t: "done" });
			} catch (err) {
				if (!ac.signal.aborted) {
					const status = err instanceof Anthropic.APIError ? err.status : 0;
					console.error("[chat] agent error", status, err?.message);
					send({ t: "error", status });
				}
			} finally {
				try { controller.close(); } catch { /* already closed */ }
			}
		},
		cancel() { ac.abort(); },
	});

	return new Response(stream, {
		headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
	});
}
