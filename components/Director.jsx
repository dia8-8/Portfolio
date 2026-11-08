"use client";
import { useEffect } from "react";
import { store, agentLabel } from "@/lib/store";

/**
 * "Agents are building the page": as sections scroll into view, a labelled agent cursor flies to the
 * element, drags out a blueprint box, and then the element appears. Everything is DOM-driven and
 * gated by the `js` class on <html> (absent for visitors who prefer reduced motion).
 */
const GLYPHS = "01<>/{}[]#*+_=";
const SCAN = ".agent-card, .skill-group, .project, .fit, .cta";
const TARGETS = ".section__head, .agent-card, .fit, .curator, .project, .skill-group, .about__media, .about__copy, .cta";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function Director() {
	useEffect(() => {
		const root = document.documentElement;
		if (!root.classList.contains("js") || !("IntersectionObserver" in window)) return;

		let alive = true;
		const timers = new Set();
		const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };

		const decode = (el) => {
			if (!el || el.children.length) return;
			const final = el.textContent, t0 = performance.now(), dur = 700;
			(function step(t) {
				if (!alive) { el.textContent = final; return; }
				const p = Math.min(1, (t - t0) / dur), n = Math.floor(p * final.length);
				el.textContent = final.slice(0, n) + [...final.slice(n)].map((c) => (c === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
				if (p < 1) requestAnimationFrame(step); else el.textContent = final;
			})(t0);
		};

		// Final step of a build: the element appears.
		const reveal = (el) => {
			if (el.classList.contains("is-in")) return;
			el.classList.add("is-in");
			if (el.matches(SCAN)) el.classList.add("scan");
			if (el.matches(".section__head")) decode(el.querySelector(".eyebrow"));
			later(() => el.classList.remove("reveal", "is-in", "scan"), 2600); // keep hover transitions clean
		};

		const targets = [...document.querySelectorAll(TARGETS)];
		targets.forEach((el) => {
			el.classList.add("reveal");
			if (el.matches(".skill-group")) el.querySelectorAll("li").forEach((li, k) => li.style.setProperty("--k", k));
			if (el.matches(SCAN)) el.style.setProperty("--scan-h", `${el.offsetHeight + 80}px`);
		});

		/* ---- cursors ---- */
		const layer = document.createElement("div");
		layer.className = "cursor-layer";
		layer.setAttribute("aria-hidden", "true");
		document.body.appendChild(layer);

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
			if (any && alive) requestAnimationFrame(tick); else loopOn = false;
		};
		const ensureLoop = () => { if (!loopOn) { loopOn = true; lastT = 0; requestAnimationFrame(tick); } };

		function getCursor(agent) {
			if (cursors[agent]) return cursors[agent];
			const el = document.createElement("div");
			el.className = `cursor cursor--${agent}`;
			el.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2.5l15.5 8.2-6.9 2-2.4 7.3z" fill="var(--c)" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg><span>${agentLabel(agent)}</span>`;
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
			(function f(t) { const p = clamp((t - t0) / ms, 0, 1); fn(1 - Math.pow(1 - p, 3)); if (p < 1 && alive) requestAnimationFrame(f); else res(); })(t0);
		});
		const follow = (c, pt, max) => new Promise((res) => {
			const t0 = performance.now();
			(function f() {
				const [x, y] = pt(); c.target(x, y);
				if (Math.hypot(c.tx - c.x, c.ty - c.y) < 16 || performance.now() - t0 > max || !alive) res(); else requestAnimationFrame(f);
			})();
		});

		const makeBox = (agent, label) => {
			const b = document.createElement("div");
			b.className = `build-box build-box--${agent}`;
			const s = document.createElement("span");
			s.textContent = label;
			b.appendChild(s);
			layer.appendChild(b);
			return {
				set: (l, t, w, h) => { b.style.cssText = `left:${l}px;top:${t}px;width:${w}px;height:${h}px`; b.classList.add("is-live"); },
				done: () => { b.classList.add("is-done"); later(() => b.remove(), 500); },
			};
		};

		const AGENT_OF = (el) => (el.matches(".project, .curator") ? "curator" : el.matches(".fit, .skill-group") ? "fitcheck" : "concierge");
		const describe = (el) => {
			const q = (s) => el.querySelector(s);
			if (el.matches(".section__head")) return `heading "${q(".section__title").getAttribute("aria-label")}"`;
			if (el.matches(".project")) return `project: ${q(".project__title").textContent}`;
			if (el.matches(".agent-card")) return `agent card: ${q("h3").textContent}`;
			if (el.matches(".skill-group")) return `skills: ${q("h3").textContent}`;
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
			store.setStatus(agent, "working", "building…");
			store.log(agent, `building ${what}`);
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
				const words = [...el.querySelectorAll(".w")];
				words.forEach((w, i) => later(() => { const r = w.getBoundingClientRect(); c.target(r.right + 6, r.top + r.height * 0.75); }, i * 90 + 150));
				await sleep(words.length * 90 + 350);
			} else await sleep(fast ? 60 : 300);
			store.setStatus(agent, "ready", "ready");
		}

		const queues = { concierge: [], curator: [], fitcheck: [] }, busy = {};
		async function pump(agent) {
			if (busy[agent]) return;
			busy[agent] = true;
			while (alive && queues[agent].length) {
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
				later(() => reveal(el), 9000); // failsafe: never leave content hidden
			});
		}, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
		targets.forEach((el) => rio.observe(el));

		// intro: the agents wake up on their console rows
		later(() => ["concierge", "curator", "fitcheck"].forEach((a, i) => later(() => {
			const li = document.querySelector(`[data-agent="${a}"]`);
			if (!li || Object.values(queues).some((q) => q.length)) return;
			const r = li.getBoundingClientRect(), c = getCursor(a);
			c.show(); c.target(r.left + r.width * 0.55, r.top + r.height * 0.75);
		}, i * 350)), 900);

		return () => {
			alive = false;
			rio.disconnect();
			timers.forEach(clearTimeout);
			Object.values(cursors).forEach((c) => clearTimeout(c.timer));
			layer.remove();
			// never leave anything hidden if the effect is torn down (dev double-mount, navigation)
			targets.forEach((el) => el.classList.remove("reveal", "is-in", "scan"));
		};
	}, []);

	return null;
}
