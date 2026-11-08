/**
 * Deterministic, grounded analysis shared by the browser (instant UI, offline fallback)
 * and the server (so the model is handed facts it cannot invent).
 */
import { projects, skills, NOT_YET, CONCEPTS, profile } from "./content";

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const hasWord = (text, term) => new RegExp(`(?<![\\w])${escRe(term)}(?![\\w])`, "i").test(text);

const stem = (w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);
const stemAll = (s) => new Set((s.toLowerCase().match(/[a-z0-9+#.]+/g) || []).map(stem));

const projectWords = new Map(projects.map((p) => [p.id, stemAll(`${p.title} ${p.desc} ${p.keywords} ${p.tags.join(" ")}`)]));

const STOP = new Set(
	"a an the of and or to do does did i you your yours me my show list all any some something with that this are is it for about what which can see have has had portfolio project projects built build made make work works demo demos tell give want like please also more other on in at as be been were was how when where who whats thing things stuff".split(" ")
);
const SYN = { gaming: "game", play: "game", playing: "game", forecast: "weather", shopping: "shop", store: "shop", ecommerce: "shop", interface: "ui", design: "ui", designs: "ui", maps: "map", exercise: "fitness", workout: "fitness", tasks: "todo", countdown: "timer" };

/** Natural-language project search. Returns ranked hits; `all` is true when the query had no usable words. */
export function searchProjects(q) {
	const toks = (q.toLowerCase().match(/[a-z0-9+#.]+/g) || [])
		.filter((t) => !STOP.has(t))
		.map((t) => stem(SYN[t] || t))
		.filter((t) => t.length > 1 && !STOP.has(t));
	if (!toks.length) return { toks, hits: projects.map((p) => ({ p, score: 1 })), all: true };
	const hits = projects
		.map((p) => {
			const words = projectWords.get(p.id);
			let score = 0;
			for (const t of toks) {
				if (words.has(t)) score += 2;
				else if (t.length >= 3 && [...words].some((w) => w.startsWith(t))) score += 1;
			}
			return { p, score };
		})
		.filter((x) => x.score > 0)
		.sort((a, b) => b.score - a.score);
	return { toks, hits, all: false };
}

export function analyzeJob(jd) {
	const matched = skills.filter((s) => s.aliases.some((a) => hasWord(jd, a)));
	const core = matched.filter((s) => s.level !== "Exploring");
	const exploring = matched.filter((s) => s.level === "Exploring");
	const gaps = NOT_YET.filter(([, terms]) => terms.some((t) => hasWord(jd, t))).map(([label]) => label);
	const concepts = CONCEPTS.filter((c) => c.re.test(jd))
		.map((c) => ({ label: c.label, q: c.q, projects: searchProjects(c.q).hits.slice(0, 2).map((h) => h.p) }))
		.filter((c) => c.projects.length);
	const git = /\b(git|github|version control)\b/i.test(jd);
	const senior = /\b(senior|sr\.|principal|staff engineer|architect|tech lead|team lead|engineering manager)\b|\b([3-9]|1\d)\s*\+?\s*(years|yrs)\b/i.exec(jd);
	const junior = /\b(junior|entry[- ]level|intern(ship)?|graduate|trainee|apprentice|early[- ]career)\b/i.test(jd);
	const denom = core.length + exploring.length + gaps.length;
	const pct = denom ? Math.round(((core.length + exploring.length * 0.5) / denom) * 100) : null;
	return { core, exploring, gaps, concepts, git, senior: senior ? senior[0] : null, junior, pct, denom };
}

/** Honest one-paragraph verdict, used as the offline fallback and as a hint to the model. */
export function verdict(a) {
	if (a.pct === null) return "I couldn't find recognisable technologies in that text. Try pasting the requirements section, or ask the Concierge directly.";
	const parts = [];
	if (a.senior) parts.push(`This looks senior-level (“${a.senior}”). Adam is a recent graduate, so it's most likely not a fit yet.`);
	else if (a.junior) parts.push("The posting reads as junior or entry-level, which is the kind of role Adam is looking for.");
	if (a.pct >= 70) parts.push("Strong overlap with the technologies detected, but all levels are Basic, so expect a junior profile who learns fast.");
	else if (a.pct >= 40) parts.push("Partial overlap. Adam covers part of the stack and would need to ramp up on the rest.");
	else parts.push("Limited overlap with the technologies detected. Better to say that now than to oversell.");
	return parts.join(" ");
}

export function briefText(a) {
	const m = [...a.core, ...a.exploring].map((s) => `${s.name} (${s.level})`);
	return [
		`Fit-Check brief: ${profile.name}`,
		a.pct === null ? "No recognisable technologies detected." : `Skill overlap: ${a.pct}%`,
		`Matches: ${m.join(", ") || "none"}`,
		`Not in the toolkit yet: ${a.gaps.join(", ") || "none detected"}`,
		verdict(a),
		`Contact: ${profile.email}`,
	].join("\n");
}

/** Compact, serialisable form of the analysis (what we hand to the model). */
export function analysisFacts(a) {
	return {
		skill_overlap_percent: a.pct,
		matched_skills: [...a.core, ...a.exploring].map((s) => ({ name: s.name, level: s.level })),
		not_in_toolkit: a.gaps,
		evidence: a.concepts.map((c) => ({ concept: c.label, projects: c.projects.map((p) => p.title) })).concat(a.git ? [{ concept: "Git & GitHub", projects: ["public GitHub profile"] }] : []),
		posting_looks_senior: a.senior,
		posting_looks_junior: a.junior,
	};
}
