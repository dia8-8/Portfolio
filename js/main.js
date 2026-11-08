/* ==========================================================
   Adam Dia — portfolio
   1. UI basics (theme, nav, header)      4. Curator agent
   2. Neural background                   5. Fit-Check agent
   3. Agent bus + hero console            6. Concierge agent (chat)
   All agents are local and read their knowledge from the DOM,
   so editing index.html is all it takes to update what they know.
   ========================================================== */
(() => {
	"use strict";

	const $ = (s, r = document) => r.querySelector(s);
	const $$ = (s, r = document) => [...r.querySelectorAll(s)];
	const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
	const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
	const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
	const store = {
		get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
		set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
	};
	// whole-word match that also works for terms like "c++", "node.js", "c#"
	const wordRe = (term) => new RegExp(`(?<![\\w])${escRe(term)}(?![\\w])`, "i");
	const hasWord = (text, term) => wordRe(term).test(text);

	/* ---------------------------------------------------------
	   1. UI basics
	   --------------------------------------------------------- */
	const root = document.documentElement;
	const themeBtn = $("#theme-button");
	const applyTheme = (t) => {
		root.dataset.theme = t;
		themeBtn.querySelector("use").setAttribute("href", t === "dark" ? "#i-sun" : "#i-moon");
		const m = $('meta[name="theme-color"]');
		if (m) m.content = t === "dark" ? "#0b0e17" : "#f6f7fb";
		root.dispatchEvent(new CustomEvent("themechange"));
	};
	applyTheme(store.get("theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
	themeBtn.addEventListener("click", () => {
		const next = root.dataset.theme === "dark" ? "light" : "dark";
		store.set("theme", next);
		applyTheme(next);
	});

	const header = $("#header");
	const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
	onScroll();
	addEventListener("scroll", onScroll, { passive: true });

	const navList = $("#nav-list"), navToggle = $("#nav-toggle");
	navToggle.addEventListener("click", () => {
		const open = navList.classList.toggle("is-open");
		navToggle.setAttribute("aria-expanded", String(open));
		navToggle.querySelector("use").setAttribute("href", open ? "#i-x" : "#i-menu");
	});
	navList.addEventListener("click", (e) => {
		if (e.target.closest("a")) {
			navList.classList.remove("is-open");
			navToggle.setAttribute("aria-expanded", "false");
			navToggle.querySelector("use").setAttribute("href", "#i-menu");
		}
	});

	$("#year").textContent = new Date().getFullYear();

	/* ---------------------------------------------------------
	   2. Neural background (pauses when hidden / reduced motion)
	   --------------------------------------------------------- */
	(() => {
		const cv = $("#neural"), ctx = cv.getContext("2d");
		let w, h, dpr, nodes = [], raf = 0, color = "139,123,255";
		const mouse = { x: -999, y: -999 };
		const readColor = () => { color = getComputedStyle(root).getPropertyValue("--node").trim() || color; };
		const resize = () => {
			dpr = Math.min(devicePixelRatio || 1, 2);
			w = innerWidth; h = innerHeight;
			cv.width = w * dpr; cv.height = h * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const n = Math.min(70, Math.floor((w * h) / 24000));
			nodes = Array.from({ length: n }, () => ({
				x: Math.random() * w, y: Math.random() * h,
				vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28, r: Math.random() * 1.4 + 0.8,
			}));
		};
		const draw = () => {
			ctx.clearRect(0, 0, w, h);
			for (const a of nodes) {
				if (!reduceMotion) {
					a.x += a.vx; a.y += a.vy;
					if (a.x < 0 || a.x > w) a.vx *= -1;
					if (a.y < 0 || a.y > h) a.vy *= -1;
				}
				ctx.fillStyle = `rgba(${color},0.8)`;
				ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
			}
			for (let i = 0; i < nodes.length; i++) {
				const a = nodes[i];
				for (let j = i + 1; j < nodes.length; j++) {
					const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
					if (d < 130) {
						ctx.strokeStyle = `rgba(${color},${(1 - d / 130) * 0.35})`;
						ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
					}
				}
				const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
				if (dm < 160) {
					ctx.strokeStyle = `rgba(54,209,220,${(1 - dm / 160) * 0.6})`;
					ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
				}
			}
			if (!reduceMotion) raf = requestAnimationFrame(draw);
		};
		const start = () => { cancelAnimationFrame(raf); draw(); };
		resize(); readColor(); start();
		addEventListener("resize", () => { resize(); if (reduceMotion) draw(); });
		addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
		document.addEventListener("visibilitychange", () => { document.hidden ? cancelAnimationFrame(raf) : !reduceMotion && start(); });
		root.addEventListener("themechange", () => { readColor(); if (reduceMotion) draw(); });
	})();

	/* ---------------------------------------------------------
	   3. Agent bus + hero console
	   --------------------------------------------------------- */
	const logEl = $("#agent-log");
	const AGENTS = { concierge: "concierge", curator: "curator", fitcheck: "fit-check", system: "system" };
	const clock = () => new Date().toTimeString().slice(0, 8);

	function log(who, msg) {
		const line = document.createElement("div");
		line.className = "log-line";
		line.innerHTML = `<time>${clock()}</time><span class="who who--${who}">${AGENTS[who] || who}</span><span class="msg">${esc(msg)}</span>`;
		logEl.appendChild(line);
		while (logEl.children.length > 9) logEl.firstChild.remove();
	}
	function setStatus(agent, state, text) {
		const li = $(`#agent-status [data-agent="${agent}"]`);
		if (!li) return;
		li.classList.toggle("is-working", state === "working");
		li.classList.toggle("is-ready", state === "ready");
		li.querySelector("i").textContent = text || state;
	}

	/* ---------------------------------------------------------
	   Knowledge: built from the page itself (single source of truth)
	   --------------------------------------------------------- */
	const projects = $$(".project").map((el) => ({
		el,
		id: el.dataset.id,
		title: $(".project__title", el).textContent.trim(),
		desc: $(".project__desc", el).textContent.trim(),
		url: $(".project__link", el).href,
		tags: el.dataset.tags.split(" "),
		labels: $$(".tag", el).map((t) => t.textContent.trim()),
		words: stemAll(`${$(".project__title", el).textContent} ${$(".project__desc", el).textContent} ${el.dataset.keywords} ${el.dataset.tags}`),
	}));
	const skills = $$("[data-skill]").map((li) => ({
		el: li,
		name: li.dataset.skill,
		level: li.dataset.level,
		group: li.closest(".skill-group").dataset.group,
		aliases: [...new Set([li.dataset.skill.toLowerCase(), ...(li.dataset.aliases || "").split(" ").filter(Boolean)])],
	}));
	const contact = {
		email: "dia8_8@hotmail.com",
		linkedin: "https://www.linkedin.com/in/adam-dia-976765213/",
		github: "https://github.com/dia8-8",
		resume: "./assets/pdf/Adam-Dia.pdf",
	};
	// Technologies I do NOT list. If a job asks for them the agents say so plainly.
	const NOT_YET = [
		["TypeScript", ["typescript"]], ["Vue", ["vue", "vue.js", "vuejs"]],
		["Angular", ["angular"]], ["Svelte", ["svelte"]], ["Redux", ["redux"]], ["GraphQL", ["graphql"]],
		["Tailwind", ["tailwind", "tailwindcss"]], ["Sass", ["sass", "scss"]], ["Bootstrap", ["bootstrap"]],
		["MongoDB", ["mongodb", "mongo"]], ["PostgreSQL", ["postgres", "postgresql"]], ["Docker", ["docker"]],
		["Kubernetes", ["kubernetes", "k8s"]], ["AWS", ["aws", "amazon web services"]], ["Azure", ["azure"]],
		["Google Cloud", ["gcp", "google cloud"]], ["CI/CD", ["ci/cd", "cicd", "github actions", "jenkins"]],
		["Automated testing", ["jest", "cypress", "playwright", "vitest", "unit testing", "unit tests"]],
		["Django", ["django"]], ["Flask", ["flask"]], ["Spring", ["spring", "spring boot"]], [".NET", [".net", "asp.net"]],
		["Laravel", ["laravel"]], ["Firebase", ["firebase"]], ["Figma", ["figma"]], ["Ruby", ["ruby", "rails"]],
		["Go", ["golang"]], ["Rust", ["rust"]], ["Swift", ["swift", "swiftui"]], ["Kotlin", ["kotlin"]],
		["Webpack / Vite", ["webpack", "vite"]],
	];
	// Concepts I can back with a real project (or my public GitHub).
	const CONCEPTS = [
		{ label: "API integration", re: /\b(apis?|rest(ful)?|json|fetch|ajax)\b/i, q: "api" },
		{ label: "Headless CMS", re: /\b(cms|contentful|headless)\b/i, q: "contentful" },
		{ label: "Maps / geolocation", re: /\b(maps?|geolocation|leaflet|mapbox)\b/i, q: "map" },
		{ label: "UI / interface work", re: /\b(ui|ux|user interface|responsive|front-?end|design systems?)\b/i, q: "ui" },
		{ label: "Game logic", re: /\b(games?|gaming)\b/i, q: "game" },
	];

	function stem(w) { return w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w; }
	function stemAll(s) { return new Set((s.toLowerCase().match(/[a-z0-9+#.]+/g) || []).map(stem)); }
	const STOP = new Set("a an the of and or to do does did i you your yours me my show list all any some something with that this are is it for about what which can see have has had portfolio project projects built build made make work works demo demos tell give want like please also more other on in at as be been were was how when where who whats thing things stuff".split(" "));
	const SYN = { gaming: "game", play: "game", playing: "game", forecast: "weather", shopping: "shop", store: "shop", ecommerce: "shop", interface: "ui", design: "ui", designs: "ui", maps: "map", exercise: "fitness", workout: "fitness", tasks: "todo", countdown: "timer" };

	function searchProjects(q) {
		const toks = (q.toLowerCase().match(/[a-z0-9+#.]+/g) || [])
			.filter((t) => !STOP.has(t)).map((t) => stem(SYN[t] || t)).filter((t) => t.length > 1 && !STOP.has(t));
		if (!toks.length) return { toks, hits: projects.map((p) => ({ p, score: 1 })), all: true };
		const hits = projects.map((p) => {
			let score = 0;
			for (const t of toks) {
				if (p.words.has(t)) score += 2;
				else if (t.length >= 3 && [...p.words].some((w) => w.startsWith(t))) score += 1;
			}
			return { p, score };
		}).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
		return { toks, hits, all: false };
	}

	/* ---------------------------------------------------------
	   4. Curator agent — filters projects
	   --------------------------------------------------------- */
	const curatorInput = $("#curator-input"), curatorStatus = $("#curator-status"), emptyMsg = $("#projects-empty");
	let activeChip = "all", curatorQuery = "";

	function renderCurator({ announce = true } = {}) {
		const res = curatorQuery ? searchProjects(curatorQuery) : null;
		const hitIds = res && !res.all ? new Set(res.hits.map((h) => h.p.id)) : null;
		let shown = 0;
		for (const p of projects) {
			const chipOk = activeChip === "all" || p.tags.includes(activeChip);
			const queryOk = !hitIds || hitIds.has(p.id);
			const visible = chipOk && queryOk;
			p.el.classList.toggle("is-hidden", !visible);
			p.el.classList.toggle("is-match", visible && !!hitIds);
			if (visible) shown++;
		}
		// best matches first when searching
		if (res && !res.all) res.hits.slice().reverse().forEach((h) => h.p.el.parentNode.prepend(h.p.el));
		else projects.forEach((p) => p.el.parentNode.appendChild(p.el)); // restore original order
		emptyMsg.hidden = shown !== 0;
		const desc = [curatorQuery && `"${curatorQuery}"`, activeChip !== "all" && `tag:${activeChip}`].filter(Boolean).join(" + ");
		curatorStatus.textContent = desc ? `curator › filter_projects(${desc}) → ${shown} of ${projects.length}` : "";
		if (announce && desc) {
			setStatus("curator", "working", "filtering…");
			log("curator", `filter_projects(${desc}) → ${shown}/${projects.length}`);
			setTimeout(() => setStatus("curator", "ready", "ready"), 700);
		}
		return shown;
	}
	let curatorTimer;
	curatorInput.addEventListener("input", () => {
		clearTimeout(curatorTimer);
		curatorTimer = setTimeout(() => { curatorQuery = curatorInput.value.trim(); renderCurator(); }, 220);
	});
	$("#filters").addEventListener("click", (e) => {
		const b = e.target.closest(".filter"); if (!b) return;
		$$(".filter").forEach((f) => f.classList.toggle("is-active", f === b));
		activeChip = b.dataset.filter;
		renderCurator();
	});
	const curator = {
		apply(q) { curatorQuery = q; curatorInput.value = q; activeChip = "all"; $$(".filter").forEach((f) => f.classList.toggle("is-active", f.dataset.filter === "all")); return renderCurator(); },
		clear() { return curator.apply(""); },
	};

	/* ---------------------------------------------------------
	   5. Fit-Check agent
	   --------------------------------------------------------- */
	const fitText = $("#fit-text"), fitOut = $("#fit-out"), fitRun = $("#fit-run");
	const SAMPLE_JD = `Junior Frontend Developer

We're looking for a motivated junior developer to join our product team.

Requirements:
- Solid HTML, CSS and JavaScript
- Experience with React
- Comfortable consuming REST APIs
- Familiarity with Git
- Nice to have: TypeScript, Tailwind, Docker`;
	$("#fit-sample").addEventListener("click", () => { fitText.value = SAMPLE_JD; fitText.focus(); });

	function analyzeJob(jd) {
		const matched = skills.filter((s) => s.aliases.some((a) => hasWord(jd, a)));
		const core = matched.filter((s) => s.level !== "Exploring");
		const exploring = matched.filter((s) => s.level === "Exploring");
		const gaps = NOT_YET.filter(([, terms]) => terms.some((t) => hasWord(jd, t))).map(([label]) => label);
		const concepts = CONCEPTS.filter((c) => c.re.test(jd)).map((c) => ({ ...c, projects: searchProjects(c.q).hits.slice(0, 2).map((h) => h.p) })).filter((c) => c.projects.length);
		const git = /\b(git|github|version control)\b/i.test(jd);
		const senior = /\b(senior|sr\.|principal|staff engineer|architect|tech lead|team lead|engineering manager)\b|\b([3-9]|1\d)\s*\+?\s*(years|yrs)\b/i.exec(jd);
		const junior = /\b(junior|entry[- ]level|intern(ship)?|graduate|trainee|apprentice|early[- ]career)\b/i.test(jd);
		const denom = core.length + exploring.length + gaps.length;
		const pct = denom ? Math.round(((core.length + exploring.length * 0.5) / denom) * 100) : null;
		return { core, exploring, gaps, concepts, git, senior: senior && senior[0], junior, pct, denom };
	}

	function verdict(a) {
		if (a.pct === null) return "I couldn't find recognisable technologies in that text. Try pasting the requirements section, or ask my Concierge directly.";
		const parts = [];
		if (a.senior) parts.push(`This looks senior-level (“${a.senior}”). I'm a recent graduate, so it's most likely not a fit yet.`);
		else if (a.junior) parts.push("The posting reads as junior or entry-level, which is the kind of role I'm looking for.");
		if (a.pct >= 70) parts.push("Strong overlap with the technologies I detected, but all my levels are Basic, so expect a junior profile who learns fast.");
		else if (a.pct >= 40) parts.push("Partial overlap. I cover part of the stack and would need to ramp up on the rest.");
		else parts.push("Limited overlap with the technologies I detected. I'd rather tell you that now than oversell.");
		return parts.join(" ");
	}

	let fitBusy = false;
	async function runFitCheck(text) {
		const jd = (text ?? fitText.value).trim();
		if (fitBusy) return;
		if (jd.length < 20) {
			fitOut.innerHTML = `<div class="fit__empty"><p>Paste a bit more of the job description (at least a sentence) and try again.</p></div>`;
			return;
		}
		fitBusy = true; fitRun.disabled = true;
		setStatus("fitcheck", "working", "analysing…");
		const labels = ["parse_job(text)", "match_skills(toolkit)", "find_gaps()", "write_brief()"];
		fitOut.innerHTML = `<div class="steps">${labels.map((l) => `<div class="step">${esc(l)}</div>`).join("")}</div><div id="fit-result"></div>`;
		const steps = $$(".step", fitOut);
		const a = analyzeJob(jd);
		const detail = [`${jd.split(/\s+/).length} words`, `${a.core.length + a.exploring.length} matches`, `${a.gaps.length} gaps`, "done"];
		for (let i = 0; i < steps.length; i++) {
			steps[i].classList.add("is-running");
			log("fitcheck", labels[i]);
			await sleep(reduceMotion ? 0 : 420);
			steps[i].classList.replace("is-running", "is-done");
			steps[i].textContent = `${labels[i]} → ${detail[i]}`;
		}
		skills.forEach((s) => s.el.classList.remove("is-lit"));
		[...a.core, ...a.exploring].forEach((s) => s.el.classList.add("is-lit"));
		$("#fit-result").innerHTML = renderBrief(a);
		requestAnimationFrame(() => { const m = $(".meter i", fitOut); if (m) m.style.width = `${a.pct || 0}%`; });
		log("fitcheck", a.pct === null ? "no recognisable tech found" : `skill overlap ${a.pct}% · ${a.gaps.length} gap(s)`);
		setStatus("fitcheck", "ready", "ready");
		fitBusy = false; fitRun.disabled = false;
	}

	function briefText(a) {
		const lines = ["Fit-Check brief: Adam Dia", a.pct === null ? "No recognisable technologies detected." : `Skill overlap: ${a.pct}%`];
		const m = [...a.core, ...a.exploring].map((s) => `${s.name} (${s.level})`);
		lines.push(`Matches: ${m.join(", ") || "none"}`, `Not in my toolkit yet: ${a.gaps.join(", ") || "none detected"}`, verdict(a), `Contact: ${contact.email}`);
		return lines.join("\n");
	}

	function renderBrief(a) {
		if (a.pct === null) return `<div class="brief"><p>${esc(verdict(a))}</p></div>`;
		const ok = [...a.core.map((s) => `<span class="pill pill--ok">${esc(s.name)} · ${esc(s.level)}</span>`), ...a.exploring.map((s) => `<span class="pill pill--soft">${esc(s.name)} · exploring</span>`)].join("") || `<span class="pill pill--soft">none detected</span>`;
		const gaps = a.gaps.map((g) => `<span class="pill pill--gap">${esc(g)}</span>`).join("") || `<span class="pill pill--soft">none detected</span>`;
		const ev = a.concepts.map((c) => `<li><b>${esc(c.label)}:</b> ${c.projects.map((p) => `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a>`).join(", ")}</li>`);
		if (a.git) ev.push(`<li><b>Git &amp; GitHub:</b> <a href="${contact.github}" target="_blank" rel="noopener">my public GitHub</a></li>`);
		window.__lastBrief = briefText(a);
		return `<div class="brief">
			<div class="brief__score"><b>${a.pct}%</b><span>skill overlap on ${a.denom} detected technolog${a.denom === 1 ? "y" : "ies"}</span></div>
			<div class="meter"><i></i></div>
			<h4>Matches</h4><div class="pills">${ok}</div>
			<h4>Not in my toolkit yet</h4><div class="pills">${gaps}</div>
			${ev.length ? `<h4>Evidence</h4><ul class="evidence">${ev.join("")}</ul>` : ""}
			<h4>Summary</h4><p>${esc(verdict(a))}</p>
			<div class="brief__actions">
				<button class="button button--ghost button--sm" type="button" id="copy-brief">Copy brief</button>
				<a class="button button--primary button--sm" href="mailto:${contact.email}?subject=${encodeURIComponent("Role at your company")}">Email Adam</a>
			</div>
		</div>`;
	}
	fitRun.addEventListener("click", () => runFitCheck());
	fitOut.addEventListener("click", async (e) => {
		if (e.target.id !== "copy-brief") return;
		try { await navigator.clipboard.writeText(window.__lastBrief); e.target.textContent = "Copied ✓"; }
		catch { e.target.textContent = "Copy failed"; }
		setTimeout(() => (e.target.textContent = "Copy brief"), 1800);
	});

	/* ---------------------------------------------------------
	   6. Concierge agent (chat drawer)
	   --------------------------------------------------------- */
	const chat = $("#chat"), scrim = $("#scrim"), scroll = $("#chat-scroll"), form = $("#chat-form"), input = $("#chat-input"), modeEl = $("#chat-mode"), suggestEl = $("#chat-suggest");
	const cfg = window.AGENT_CONFIG || {};
	const remote = !!cfg.endpoint;
	if (remote) modeEl.textContent = "Live model · via your endpoint";
	const history = [];
	let opener = null, busy = false;

	const SUGGESTIONS = ["What have you built?", "What are your skills?", "Where did you study?", "Do you know Python?", "Show me games", "How can I contact you?"];
	suggestEl.innerHTML = SUGGESTIONS.map((s) => `<button type="button" class="suggest">${esc(s)}</button>`).join("");
	suggestEl.addEventListener("click", (e) => { const b = e.target.closest(".suggest"); if (b) ask(b.textContent); });

	function openChat(from) {
		opener = from || document.activeElement;
		chat.hidden = false; scrim.hidden = false;
		if (!scroll.children.length) {
			addAgent(`Hi, I'm Adam's Concierge. I can answer questions about his projects, skills, education and how to reach him. ${remote ? "" : "I run locally in your browser and only know what's on this page. "}Try a suggestion below, or paste a job description and I'll hand it to Fit-Check.`);
			setStatus("concierge", "ready", "ready");
		}
		setStatus("concierge", "ready", "chatting");
		log("concierge", "session opened");
		setTimeout(() => input.focus(), 50);
	}
	function closeChat() {
		chat.hidden = true; scrim.hidden = true;
		setStatus("concierge", "ready", "idle");
		if (opener && opener.focus) opener.focus();
	}
	$("#close-chat").addEventListener("click", closeChat);
	scrim.addEventListener("click", closeChat);
	$$("[data-open-chat]").forEach((b) => b.addEventListener("click", () => openChat(b)));
	$("#open-chat").addEventListener("click", (e) => openChat(e.currentTarget));
	addEventListener("keydown", (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); chat.hidden ? openChat() : closeChat(); }
		else if (e.key === "Escape" && !chat.hidden) closeChat();
		else if (e.key === "Tab" && !chat.hidden) { // keep focus inside the drawer
			const f = $$("button, input, a[href]", chat).filter((x) => !x.disabled && x.offsetParent !== null);
			if (!f.length) return;
			const first = f[0], last = f[f.length - 1];
			if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
			else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
		}
	});
	chat.addEventListener("click", (e) => { const a = e.target.closest('a[href^="#"]'); if (a) closeChat(); });

	function addUser(text) {
		const row = document.createElement("div");
		row.className = "msg-row msg-row--user";
		const b = document.createElement("div"); b.className = "bubble"; b.textContent = text;
		row.appendChild(b); scroll.appendChild(row); scroll.scrollTop = scroll.scrollHeight;
	}
	function addAgent(html, trace) {
		const row = document.createElement("div");
		row.className = "msg-row msg-row--agent";
		row.innerHTML = `${trace && trace.length ? `<div class="trace">${trace.map((t) => `<code>${esc(t)}</code>`).join(" ")}</div>` : ""}<div class="bubble">${html}</div>`;
		scroll.appendChild(row); scroll.scrollTop = scroll.scrollHeight;
		return row;
	}
	function addTyping() {
		const row = document.createElement("div");
		row.className = "msg-row msg-row--agent";
		row.innerHTML = `<div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>`;
		scroll.appendChild(row); scroll.scrollTop = scroll.scrollHeight;
		return row;
	}

	const SECTIONS = { agents: "agents", agent: "agents", fit: "fit", work: "work", projects: "work", skills: "skills", toolkit: "skills", about: "about", contact: "contact", home: "top", top: "top" };
	const link = (href, label, ext) => `<a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${esc(label)}</a>`;
	const projList = (hits) => `<ul>${hits.map(({ p }) => `<li>${link(p.url, p.title, true)}: ${esc(p.desc)}</li>`).join("")}</ul>`;

	/* Local brain: intent routing over the page's own content. Returns { html, trace, run? } */
	function localAnswer(text) {
		const t = text.toLowerCase().trim();
		const trace = [];

		// 1. a pasted job description → hand off to Fit-Check
		const techHits = skills.filter((s) => s.aliases.some((a) => hasWord(t, a))).length + NOT_YET.filter(([, ts]) => ts.some((x) => hasWord(t, x))).length;
		if (text.length > 280 || (text.includes("\n") && techHits >= 3) || /^job description/i.test(t)) {
			trace.push("handoff(fit-check)");
			return { trace, html: "That looks like a job description, so I've handed it to <b>Fit-Check</b>. It will show how my real skills line up (and where they don't). " + link("#fit", "See the result"), run: () => { fitText.value = text; runFitCheck(text); } };
		}

		// 2. navigation
		const nav = /\b(go to|take me|jump to|navigate|scroll to|open the)\b/.exec(t);
		if (nav) {
			const key = Object.keys(SECTIONS).find((k) => hasWord(t, k));
			if (key) {
				trace.push(`navigate("#${SECTIONS[key]}")`);
				return { trace, html: `Taking you to ${link("#" + SECTIONS[key], key)}.`, run: () => setTimeout(() => { closeChat(); document.getElementById(SECTIONS[key]).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }, 500) };
			}
		}

		// 3. meta: how does this work
		if (/(how (does|do|is) (this|you|it|that)|are you (an? )?(ai|bot|real|human|llm|chatgpt|claude)|this (site|page|agent|chat)|under the hood|who made you|powered by)/.test(t)) {
			trace.push("get_site_info()");
			return { trace, html: remote ? "I'm an agent on Adam's portfolio, backed by a language model through a small serverless endpoint, and grounded in the content of this page." : "I'm one of three small agents on this page. Right now I'm <b>local and rule-based</b>: I route your question to tools that read this page's own content (projects, skills, education), so I can't invent experience. Adam is learning to wire agents like this to real LLM APIs, and this setup is built so he can plug one in." };
		}

		// 4. a specific technology
		const known = skills.filter((s) => s.aliases.some((a) => hasWord(t, a)));
		const unknown = NOT_YET.filter(([, ts]) => ts.some((x) => hasWord(t, x)));
		if ((known.length || unknown.length) && !/\b(skills?|stack|tools?|toolkit|languages?)\b/.test(t)) {
			const out = [];
			known.forEach((s) => {
				trace.push(`get_skills("${s.name}")`);
				const rel = searchProjects(s.aliases[0]).hits.filter((h) => !searchProjects(s.aliases[0]).all);
				out.push(s.level === "Exploring"
					? `<b>${esc(s.name)}</b>: I'm actively exploring this. This agent setup is part of that. It isn't a professional skill yet.`
					: `<b>${esc(s.name)}</b>: yes, it's in my toolkit at a <b>${esc(s.level)}</b> level.${rel.length ? ` Related: ${rel.slice(0, 2).map((h) => link(h.p.url, h.p.title, true)).join(", ")}.` : ""}`);
			});
			unknown.forEach(([label]) => { trace.push(`get_skills("${label}")`); out.push(`<b>${esc(label)}</b>: not yet. It isn't in my toolkit and I won't claim it. I'd be glad to learn it on the job.`); });
			return { trace, html: out.join("<br><br>") };
		}

		// 5. contact / resume
		if (/(contact|e-?mail|reach|hire|hiring|available|availability|linkedin|github|resume|résumé|\bcv\b|get in touch)/.test(t)) {
			trace.push("get_contact()");
			return { trace, html: `You can reach Adam at ${link("mailto:" + contact.email, contact.email)}. He's looking for a junior web developer role.<ul><li>${link(contact.linkedin, "LinkedIn", true)}</li><li>${link(contact.github, "GitHub", true)}</li><li>${link(contact.resume, "Résumé (PDF)")}</li></ul>` };
		}

		// 6. education
		if (/(educat|study|studied|universit|degree|school|graduat|college|major|antonine|lebanese|sherbrooke|bachelor)/.test(t)) {
			trace.push("get_education()");
			return { trace, html: "Adam graduated from the <b>Université de Sherbrooke</b> in April 2025 with a Bachelor's degree in Computer Science. Earlier, he started Computer Science at the <b>Lebanese University</b> in September 2018, then added a double major in Systems Engineering at <b>Antonine University</b> in September 2019." };
		}

		// 7. skills overview
		if (/\b(skills?|stack|tech|technologies|languages?|tools?|toolkit|proficien\w*|good at|know)\b/.test(t)) {
			trace.push("get_skills()");
			const groups = {};
			skills.forEach((s) => (groups[s.group] = groups[s.group] || []).push(`${s.name}${s.level === "Exploring" ? " (exploring)" : ""}`));
			return { trace, html: `Everything is at a <b>Basic</b> level for now. I'm early in my career and I'd rather be accurate:<ul>${Object.entries(groups).map(([g, v]) => `<li><b>${esc(g)}:</b> ${esc(v.join(", "))}</li>`).join("")}</ul>See the full ${link("#skills", "toolkit")}.` };
		}

		// 8. experience
		if (/(experience|years|intern|professional|employ|job history|worked)/.test(t)) {
			trace.push("get_experience()");
			return { trace, html: `I'm a recent graduate looking for a first role, so there's no professional job history yet. What I can show is real, working code: ${projects.length} live projects. Ask me to "show me apps" or "show me games".` };
		}

		// 9. projects
		const projWords = /\b(projects?|built|build|made|portfolio|demos?|apps?|games?|examples?|show|list|work|samples?|ui|api|maps?|weather|todo|timer|maze|fitness|shop|cart|form|tic)\b/;
		if (projWords.test(t) || searchProjects(t).hits.length && !searchProjects(t).all) {
			const r = searchProjects(t);
			trace.push(r.all ? "search_projects()" : `search_projects("${r.toks.join(" ")}")`);
			if (!r.all && !r.hits.length) { trace.push("→ 0 results"); return { trace, html: `Nothing in my portfolio matches that. Here's what I do have: ${projects.map((p) => esc(p.title)).join(", ")}.` }; }
			trace.push(`→ ${r.hits.length} result${r.hits.length === 1 ? "" : "s"}`);
			return {
				trace,
				html: `${r.all ? `Here are all ${r.hits.length} projects` : `Found ${r.hits.length} matching project${r.hits.length === 1 ? "" : "s"}`}:${projList(r.hits)}${r.all ? "" : `I've also asked the Curator to filter the ${link("#work", "Work section")}.`}`,
				run: () => { if (r.all) curator.clear(); else { setStatus("curator", "working", "asked by concierge"); log("concierge", `→ curator: filter_projects("${r.toks.join(" ")}")`); curator.apply(r.toks.join(" ")); } },
			};
		}

		// 10. about / greeting
		if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(t)) return { trace, html: "Hello! Ask me about Adam's projects, skills, education or availability." };
		if (/(who|about|yourself|introduc|tell me)/.test(t)) {
			trace.push("get_bio()");
			return { trace, html: `Adam Dia graduated from the Université de Sherbrooke in April 2025 with a Bachelor's degree in Computer Science. He builds small web apps and games, and is now learning to build with AI agents. He's looking for a junior web developer role. Try "what have you built?" or ${link("#about", "read more")}.` };
		}

		// 11. fallback
		trace.push("no_matching_tool()");
		return { trace, html: "I only know what's on this page, and I couldn't match that to anything. Try asking about <b>projects</b>, <b>skills</b>, <b>education</b> or <b>contact</b>, or paste a job description." };
	}

	async function remoteAnswer(text) {
		const knowledge = [
			"Adam Dia: graduated from the Université de Sherbrooke in April 2025 with a Bachelor's degree in Computer Science. Earlier studies: Computer Science at the Lebanese University from Sep 2018, with a double major in Systems Engineering at Antonine University from Sep 2019. Looking for a junior web developer role.",
			"Skills: " + skills.map((s) => `${s.name} (${s.level})`).join(", "),
			"Projects: " + projects.map((p) => `${p.title}: ${p.desc} ${p.url}`).join(" | "),
			`Contact: ${contact.email}, ${contact.linkedin}, ${contact.github}`,
		].join("\n");
		const ctl = new AbortController();
		const timer = setTimeout(() => ctl.abort(), cfg.timeoutMs || 20000);
		try {
			const res = await fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-10), knowledge }), signal: ctl.signal });
			if (!res.ok) throw new Error(res.status);
			const data = await res.json();
			if (!data || typeof data.reply !== "string") throw new Error("bad response");
			return esc(data.reply).replace(/\n/g, "<br>");
		} finally { clearTimeout(timer); }
	}

	async function ask(text) {
		text = text.trim();
		if (!text || busy) return;
		busy = true; input.value = "";
		suggestEl.hidden = true;
		addUser(text); history.push({ role: "user", content: text });
		const typing = addTyping();
		setStatus("concierge", "working", "thinking…");
		log("concierge", `query: "${text.length > 38 ? text.slice(0, 38) + "…" : text.replace(/\n/g, " ")}"`);
		let out;
		if (remote) {
			try { out = { html: await remoteAnswer(text), trace: ["llm(endpoint)"] }; }
			catch { out = localAnswer(text); out.trace = ["endpoint_failed", "fallback(local)", ...(out.trace || [])]; }
		} else {
			await sleep(reduceMotion ? 0 : 450 + Math.random() * 350);
			out = localAnswer(text);
		}
		typing.remove();
		addAgent(out.html, out.trace);
		history.push({ role: "assistant", content: out.html.replace(/<[^>]+>/g, " ") });
		(out.trace || []).filter((x) => !x.startsWith("→")).slice(0, 2).forEach((x) => log("concierge", `tool ${x}`));
		setStatus("concierge", "ready", "chatting");
		if (out.run) out.run();
		busy = false; input.focus();
	}
	form.addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });

	/* ---------------------------------------------------------
	   Scroll motion: reveal, streamed titles, decoding eyebrows, scan lines
	   (only runs when html.js is set, i.e. the visitor allows motion)
	   --------------------------------------------------------- */
	if (root.classList.contains("js") && "IntersectionObserver" in window) {
		const GLYPHS = "01<>/{}[]#*+_=";
		const SCAN = ".agent-card, .skill-group, .project, .fit, .cta";
		const decode = (el) => {
			if (!el || el.children.length) return;
			const final = el.textContent, t0 = performance.now(), dur = 700;
			(function step(t) {
				const p = Math.min(1, (t - t0) / dur), n = Math.floor(p * final.length);
				el.textContent = final.slice(0, n) + [...final.slice(n)].map((c) => (c === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
				if (p < 1) requestAnimationFrame(step); else el.textContent = final;
			})(t0);
		};
		// split section titles into words so they can stream in
		$$(".section__title").forEach((h) => {
			if (h.children.length) return;
			h.setAttribute("aria-label", h.textContent);
			h.innerHTML = h.textContent.split(" ").map((w, i) => `<span class="w" aria-hidden="true" style="--i:${i}">${esc(w)}</span>`).join(" ");
		});
		const targets = $$(".section__head, .agent-card, .fit, .curator, .project, .skill-group, .about__media, .about__copy, .cta");
		targets.forEach((el) => {
			el.classList.add("reveal");
			if (el.matches(".skill-group")) $$("li", el).forEach((li, k) => li.style.setProperty("--k", k));
			if (el.matches(SCAN)) el.style.setProperty("--scan-h", `${el.offsetHeight + 80}px`);
		});
		// Final step of a build: the element appears.
		const reveal = (el) => {
			if (el.classList.contains("is-in")) return;
			el.classList.add("is-in");
			if (el.matches(SCAN)) el.classList.add("scan");
			if (el.matches(".section__head")) decode($(".eyebrow", el));
			// drop the helper classes afterwards so hover transitions are untouched
			setTimeout(() => el.classList.remove("reveal", "is-in", "scan"), 2600);
		};

		/* ---- Agent cursors: the agents "build" each element as it scrolls into view ---- */
		const layer = document.createElement("div");
		layer.className = "cursor-layer";
		layer.setAttribute("aria-hidden", "true");
		document.body.appendChild(layer);

		const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
		const cursors = {};
		let loopOn = false, lastT = 0;
		const tick = (t) => {
			const dt = Math.min(64, t - (lastT || t - 16)); lastT = t;
			const k = 1 - Math.exp(-dt / 85);
			let any = false;
			for (const c of Object.values(cursors)) {
				if (!c.on) continue;
				any = true;
				c.x += (c.tx - c.x) * k; c.y += (c.ty - c.y) * k;
				c.el.style.transform = `translate3d(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px,0)`;
			}
			if (any) requestAnimationFrame(tick); else loopOn = false;
		};
		const ensureLoop = () => { if (!loopOn) { loopOn = true; lastT = 0; requestAnimationFrame(tick); } };

		function getCursor(agent) {
			if (cursors[agent]) return cursors[agent];
			const el = document.createElement("div");
			el.className = `cursor cursor--${agent}`;
			el.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2.5l15.5 8.2-6.9 2-2.4 7.3z" fill="var(--c)" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg><span>${esc(AGENTS[agent])}</span>`;
			layer.appendChild(el);
			const c = {
				el, on: false, x: innerWidth * 0.85, y: innerHeight + 30, tx: 0, ty: 0, timer: 0,
				target(x, y) {
					c.tx = clamp(x, 6, innerWidth - 90); c.ty = clamp(y, 6, innerHeight - 30);
					clearTimeout(c.timer); c.timer = setTimeout(c.hide, 2600);
				},
				show() { if (c.on) return; c.on = true; el.classList.add("is-on"); c.tx = c.x; c.ty = c.y - 60; ensureLoop(); },
				hide() { el.classList.remove("is-on"); setTimeout(() => { if (!el.classList.contains("is-on")) c.on = false; }, 450); },
			};
			return (cursors[agent] = c);
		}

		const animate = (ms, fn) => new Promise((res) => {
			const t0 = performance.now();
			(function f(t) { const p = clamp((t - t0) / ms, 0, 1); fn(1 - Math.pow(1 - p, 3)); p < 1 ? requestAnimationFrame(f) : res(); })(t0);
		});
		const follow = (c, pt, max) => new Promise((res) => {
			const t0 = performance.now();
			(function f() {
				const [x, y] = pt(); c.target(x, y);
				if ((Math.hypot(c.tx - c.x, c.ty - c.y) < 16) || performance.now() - t0 > max) res(); else requestAnimationFrame(f);
			})();
		});

		const makeBox = (agent, label) => {
			const b = document.createElement("div");
			b.className = `build-box build-box--${agent}`;
			b.innerHTML = `<span>${esc(label)}</span>`;
			layer.appendChild(b);
			return {
				set: (l, t, w, h) => { b.style.cssText = `left:${l}px;top:${t}px;width:${w}px;height:${h}px`; b.classList.add("is-live"); },
				done: () => { b.classList.add("is-done"); setTimeout(() => b.remove(), 500); },
			};
		};

		const AGENT_OF = (el) => (el.matches(".project, .curator") ? "curator" : el.matches(".fit, .skill-group") ? "fitcheck" : "concierge");
		const describe = (el) => {
			if (el.matches(".section__head")) return `heading "${$(".section__title", el).getAttribute("aria-label")}"`;
			if (el.matches(".project")) return `project: ${$(".project__title", el).textContent}`;
			if (el.matches(".agent-card")) return `agent card: ${$("h3", el).textContent}`;
			if (el.matches(".skill-group")) return `skills: ${$("h3", el).textContent}`;
			if (el.matches(".fit")) return "fit-check panel";
			if (el.matches(".curator")) return "search bar";
			if (el.matches(".cta")) return "contact block";
			return el.matches(".about__media") ? "about image" : "about text";
		};

		async function build(agent, el, fast) {
			if (el.classList.contains("is-in")) return;
			const r0 = el.getBoundingClientRect();
			if (r0.bottom < 0 || r0.top > innerHeight) { reveal(el); return; } // scrolled past already
			const c = getCursor(agent), what = describe(el);
			c.show();
			setStatus(agent, "working", "building…");
			log(agent, `building ${what}`);
			const box = makeBox(agent, what);
			const live = () => el.getBoundingClientRect();
			await follow(c, () => { const r = live(); return [r.left + 6, r.top + 6]; }, fast ? 300 : 800);
			await animate(fast ? 220 : 560, (p) => {
				const r = live();
				box.set(r.left, r.top, r.width * p, r.height * p);
				c.target(r.left + r.width * p, r.top + r.height * p);
			});
			reveal(el);
			box.done();
			if (el.matches(".section__head")) { // follow the title as it streams in
				const words = $$(".w", el);
				words.forEach((w, i) => setTimeout(() => { const r = w.getBoundingClientRect(); c.target(r.right + 6, r.top + r.height * 0.75); }, i * 90 + 150));
				await sleep(words.length * 90 + 350);
			} else await sleep(fast ? 60 : 300);
			setStatus(agent, "ready", "ready");
		}

		const queues = { concierge: [], curator: [], fitcheck: [] }, busy = {};
		async function pump(agent) {
			if (busy[agent]) return;
			busy[agent] = true;
			while (queues[agent].length) {
				const el = queues[agent].shift();
				try { await build(agent, el, queues[agent].length > 2); } catch { reveal(el); }
			}
			busy[agent] = false;
		}

		const rio = new IntersectionObserver((entries) => {
			entries.forEach((en) => {
				if (!en.isIntersecting) return;
				const el = en.target;
				rio.unobserve(el);
				const agent = AGENT_OF(el);
				queues[agent].push(el);
				pump(agent);
				setTimeout(() => reveal(el), 9000); // failsafe: never leave content hidden
			});
		}, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
		targets.forEach((el) => rio.observe(el));

		// intro: the agents wake up on their console rows
		setTimeout(() => ["concierge", "curator", "fitcheck"].forEach((a, i) => setTimeout(() => {
			const li = $(`#agent-status [data-agent="${a}"]`);
			if (!li || Object.values(queues).some((q) => q.length)) return;
			const r = li.getBoundingClientRect(), c = getCursor(a);
			c.show(); c.target(r.left + r.width * 0.55, r.top + r.height * 0.75);
		}, i * 350)), 900);
	}

	/* ---------------------------------------------------------
	   Boot sequence + live section tracking (real events only)
	   --------------------------------------------------------- */
	(async () => {
		const aliasCount = skills.reduce((n, s) => n + s.aliases.length, 0);
		const seq = [
			["system", "booting agent crew…"],
			["concierge", `knowledge loaded: ${projects.length} projects, ${skills.length} skills`],
			["curator", `indexed ${projects.length} projects · ${new Set(projects.flatMap((p) => p.tags)).size} tags`],
			["fitcheck", `matcher ready: ${aliasCount} skill aliases, ${NOT_YET.length} known gaps`],
			["system", remote ? "mode: live model (endpoint set)" : "mode: local, nothing leaves your browser"],
		];
		["concierge", "curator", "fitcheck"].forEach((a) => setStatus(a, "working", "starting…"));
		for (const [who, msg] of seq) { log(who, msg); await sleep(reduceMotion ? 0 : 520); }
		["concierge", "curator", "fitcheck"].forEach((a, i) => setTimeout(() => setStatus(a, "ready", "ready"), reduceMotion ? 0 : i * 250));
		await sleep(reduceMotion ? 0 : 1800);
		log("concierge", "tip: press Ctrl K to ask me anything");
	})();

	const navLinks = new Map($$(".nav__link").map((a) => [a.getAttribute("href").slice(1), a]));
	let lastSection = "";
	const io = new IntersectionObserver((entries) => {
		entries.forEach((en) => {
			if (!en.isIntersecting) return;
			const id = en.target.id;
			navLinks.forEach((a, k) => a.classList.toggle("is-active", k === id));
			if (id !== lastSection && id !== "top") { lastSection = id; log("concierge", `visitor is viewing #${id}`); }
		});
	}, { rootMargin: "-45% 0px -50% 0px" });
	$$("main section[id]").forEach((s) => io.observe(s));
})();
