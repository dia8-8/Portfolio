"use client";
import { useEffect } from "react";
import { projects, skills, NOT_YET } from "@/lib/content";
import { store } from "@/lib/store";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Boot sequence for the hero console + live detection + real section-view events. Renders nothing. */
let booted = false; // the boot sequence is one-time and global (also survives React's dev double-mount)

export default function Runtime() {
	useEffect(() => {
		const dead = false;
		const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
		const agents = ["concierge", "curator", "fitcheck"];

		if (!booted) (async () => {
			booted = true;
			let live = false;
			try {
				const r = await fetch("/api/chat", { cache: "no-store" });
				live = !!(await r.json()).live;
			} catch { /* offline dev etc. */ }
			if (dead) return;
			store.setLive(live);

			const aliases = skills.reduce((n, s) => n + s.aliases.length, 0);
			const seq = [
				["system", "booting agent crew…"],
				["concierge", `knowledge loaded: ${projects.length} projects, ${skills.length} skills`],
				["curator", `indexed ${projects.length} projects · ${new Set(projects.flatMap((p) => p.tags)).size} tags`],
				["fitcheck", `matcher ready: ${aliases} skill aliases, ${NOT_YET.length} known gaps`],
				["system", live ? "mode: live · concierge runs on Claude with 4 tools" : "mode: local · rule-based agents, no API key set"],
			];
			agents.forEach((a) => store.setStatus(a, "working", "starting…"));
			for (const [who, msg] of seq) {
				if (dead) return;
				store.log(who, msg);
				await sleep(reduce ? 0 : 520);
			}
			agents.forEach((a, i) => setTimeout(() => !dead && store.setStatus(a, "ready", "ready"), reduce ? 0 : i * 250));
			await sleep(reduce ? 0 : 1800);
			if (!dead) store.log("concierge", "tip: press Ctrl K to ask me anything");
		})();

		let last = "";
		const io = new IntersectionObserver(
			(entries) => entries.forEach((en) => {
				if (!en.isIntersecting) return;
				const id = en.target.id;
				if (id !== last && id !== "top") { last = id; store.log("concierge", `visitor is viewing #${id}`); }
			}),
			{ rootMargin: "-45% 0px -50% 0px" }
		);
		document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));
		return () => io.disconnect();
	}, []);

	return null;
}
