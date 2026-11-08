/**
 * Local, rule-based Concierge. Used when no ANTHROPIC_API_KEY is configured, when the
 * visitor is rate limited, or when the live agent errors, so the site never breaks.
 * Returns { html, trace, actions[] } where `actions` are things the browser should do.
 */
import { projects, skills, profile, NOT_YET, SECTIONS } from "./content";
import { searchProjects, hasWord } from "./analyze";

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const link = (href, label, ext) => `<a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(label)}</a>`;
const projList = (hits) => `<ul>${hits.map(({ p }) => `<li>${link(p.url, p.title, true)}: ${esc(p.desc)}</li>`).join("")}</ul>`;

export function localAnswer(text) {
	const t = text.toLowerCase().trim().replace(/full[- ]stack/g, "fullstack");
	const trace = [];

	// 1. a pasted job description -> hand off to Fit-Check
	const techHits = skills.filter((s) => s.aliases.some((a) => hasWord(t, a))).length + NOT_YET.filter(([, ts]) => ts.some((x) => hasWord(t, x))).length;
	if (text.length > 280 || (text.includes("\n") && techHits >= 3) || /^job description/i.test(t)) {
		return {
			trace: ["handoff(fit-check)"],
			html: "That looks like a job description, so I've handed it to <b>Fit-Check</b>. It will show how my real skills line up (and where they don't). " + link("#fit", "See the result"),
			actions: [{ type: "fit", text }],
		};
	}

	// 2. navigation
	if (/\b(go to|take me|jump to|navigate|scroll to|open the)\b/.test(t)) {
		const key = Object.keys(SECTIONS).find((k) => hasWord(t, k));
		if (key) {
			return { trace: [`navigate("#${SECTIONS[key]}")`], html: `Taking you to ${link("#" + SECTIONS[key], key)}.`, actions: [{ type: "navigate", section: SECTIONS[key] }] };
		}
	}

	// 3. meta: how does this work
	if (/(how (does|do|is) (this|you|it|that)|are you (an? )?(ai|bot|real|human|llm|chatgpt|claude)|this (site|page|agent|chat)|under the hood|who made you|powered by)/.test(t)) {
		return { trace: ["get_site_info()"], html: "I'm the offline version of the Concierge: <b>local and rule-based</b>. I route your question to tools that read this site's own content (projects, skills, education), so I can't invent experience. When the live Claude agent is switched on, I'm replaced by a real language model that uses the same tools." };
	}

	// 4. a specific technology
	const known = skills.filter((s) => s.aliases.some((a) => hasWord(t, a)));
	const unknown = NOT_YET.filter(([, ts]) => ts.some((x) => hasWord(t, x)));
	if ((known.length || unknown.length) && !/\b(skills?|stack|tools?|toolkit|languages?)\b/.test(t)) {
		const out = [];
		known.forEach((s) => {
			trace.push(`get_skills("${s.name}")`);
			const r = searchProjects(s.aliases[0]);
			const rel = r.all ? [] : r.hits;
			out.push(
				s.level === "Exploring"
					? `<b>${esc(s.name)}</b>: I'm actively exploring this. This site's agents are part of that. It isn't a professional skill yet.`
					: `<b>${esc(s.name)}</b>: yes, it's in my toolkit at a <b>${esc(s.level)}</b> level.${rel.length ? ` Related: ${rel.slice(0, 2).map((h) => link(h.p.url, h.p.title, true)).join(", ")}.` : ""}`
			);
		});
		unknown.forEach(([label]) => {
			trace.push(`get_skills("${label}")`);
			out.push(`<b>${esc(label)}</b>: not yet. It isn't in my toolkit and I won't claim it. I'd be glad to learn it on the job.`);
		});
		return { trace, html: out.join("<br><br>") };
	}

	// 5. contact / resume
	if (/(contact|e-?mail|reach|hire|hiring|available|availability|linkedin|github|resume|résumé|\bcv\b|get in touch)/.test(t)) {
		return {
			trace: ["get_contact()"],
			html: `You can reach Adam at ${link("mailto:" + profile.email, profile.email)}. He's looking for ${esc(profile.looking)}.<ul><li>${link(profile.linkedin, "LinkedIn", true)}</li><li>${link(profile.github, "GitHub", true)}</li><li>${link(profile.resume, "Résumé (PDF)")}</li></ul>`,
		};
	}

	// 6. education
	if (/(educat|study|studied|universit|degree|school|graduat|college|major|antonine|lebanese|sherbrooke|bachelor)/.test(t)) {
		return {
			trace: ["get_education()"],
			html: "Adam graduated from the <b>Université de Sherbrooke</b> in April 2025 with a Bachelor's degree in Computer Science. Earlier, he started Computer Science at the <b>Lebanese University</b> in September 2018, then added a double major in Systems Engineering at <b>Antonine University</b> in September 2019.",
		};
	}

	// 7. skills overview
	if (/\b(skills?|stack|tech|technologies|languages?|tools?|toolkit|proficien\w*|good at|know)\b/.test(t)) {
		const groups = {};
		skills.forEach((s) => (groups[s.group] = groups[s.group] || []).push(`${s.name}${s.level === "Exploring" ? " (exploring)" : ""}`));
		return {
			trace: ["get_skills()"],
			html: `Everything is at a <b>Basic</b> level for now. I'm early in my career and I'd rather be accurate:<ul>${Object.entries(groups).map(([g, v]) => `<li><b>${esc(g)}:</b> ${esc(v.join(", "))}</li>`).join("")}</ul>See the full ${link("#skills", "toolkit")}.`,
		};
	}

	// 8. experience
	if (/(experience|years|intern|professional|employ|job history|worked)/.test(t)) {
		return { trace: ["get_experience()"], html: `I'm a recent graduate looking for a first role, so there's no professional job history yet. What I can show is real, working code: ${projects.length} projects, with live demos or code on GitHub. Ask me to "show me apps" or "show me games".` };
	}

	// 9. projects
	const projWords = /\b(projects?|built|build|made|portfolio|demos?|apps?|games?|examples?|show|list|work|samples?|ui|api|maps?|weather|todo|timer|maze|fitness|shop|cart|form|tic)\b/;
	const sr = searchProjects(t);
	if (projWords.test(t) || (sr.hits.length && !sr.all)) {
		trace.push(sr.all ? "search_projects()" : `search_projects("${sr.toks.join(" ")}")`);
		if (!sr.all && !sr.hits.length) {
			return { trace: [...trace, "→ 0 results"], html: `Nothing in my portfolio matches that. Here's what I do have: ${projects.map((p) => esc(p.title)).join(", ")}.` };
		}
		trace.push(`→ ${sr.hits.length} result${sr.hits.length === 1 ? "" : "s"}`);
		return {
			trace,
			html: `${sr.all ? `Here are all ${sr.hits.length} projects` : `Found ${sr.hits.length} matching project${sr.hits.length === 1 ? "" : "s"}`}:${projList(sr.hits)}${sr.all ? "" : `I've also asked the Curator to filter the ${link("#work", "Work section")}.`}`,
			actions: [{ type: "filter", query: sr.all ? "" : sr.toks.join(" ") }],
		};
	}

	// 10. about / greeting
	if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(t)) return { trace, html: "Hello! Ask me about Adam's projects, skills, education or availability." };
	if (/(who|about|yourself|introduc|tell me)/.test(t)) {
		return {
			trace: ["get_bio()"],
			html: `Adam Dia graduated from the Université de Sherbrooke in April 2025 with a Bachelor's degree in Computer Science. He builds small web apps and games, and is now learning to build with AI agents. He's looking for ${esc(profile.looking)}. Try "what have you built?" or ${link("#about", "read more")}.`,
		};
	}

	// 11. fallback
	return { trace: ["no_matching_tool()"], html: "I only know what's on this page, and I couldn't match that to anything. Try asking about <b>projects</b>, <b>skills</b>, <b>education</b> or <b>contact</b>, or paste a job description." };
}

/** Render plain model text (with **bold**, "- " bullets, project names) as safe HTML. */
export function formatReply(text) {
	let html = esc(text);
	// auto-link project titles to their live demos (single pass so inserted links are never re-linked)
	const byTitle = new Map(projects.map((p) => [esc(p.title), p]));
	const alt = [...byTitle.keys()].sort((a, b) => b.length - a.length).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
	html = html.replace(new RegExp(`(?<![\\w-])(${alt})(?![\\w-])`, "g"), (m) => `<a href="${esc(byTitle.get(m).url)}" target="_blank" rel="noopener noreferrer">${m}</a>`);
	html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
	const lines = html.split("\n");
	const out = [];
	let list = false;
	for (const line of lines) {
		const m = /^\s*[-•]\s+(.*)$/.exec(line);
		if (m) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${m[1]}</li>`); }
		else { if (list) { out.push("</ul>"); list = false; } out.push(line.trim() ? line : "<br>"); }
	}
	if (list) out.push("</ul>");
	return out.join("\n").replace(/\n(?!<)/g, "<br>").replace(/<br>(<br>)+/g, "<br>");
}
