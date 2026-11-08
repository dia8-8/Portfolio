"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { projects } from "@/lib/content";
import { searchProjects } from "@/lib/analyze";
import { store, useStore } from "@/lib/store";
import { SectionHead, Icon } from "./ui";

const CHIPS = [["all", "All"], ["fullstack", "Full-stack"], ["app", "Apps"], ["site", "Sites"], ["game", "Games"], ["ui", "UI"], ["earlier", "Earlier work"]];

export default function Work() {
	const { curator } = useStore();
	const [value, setValue] = useState("");
	const timer = useRef(0);
	const first = useRef(true);

	// keep the input in sync when another agent (the Concierge) sets the filter
	useEffect(() => { setValue(curator.query); }, [curator.query]);

	const { order, visible, shown, hasQuery } = useMemo(() => {
		const r = curator.query ? searchProjects(curator.query) : null;
		const hasQuery = !!r && !r.all;
		const hitIds = hasQuery ? new Set(r.hits.map((h) => h.p.id)) : null;
		const ranked = hasQuery ? [...r.hits.map((h) => h.p), ...projects.filter((p) => !hitIds.has(p.id))] : projects;
		const visible = new Set(projects.filter((p) => (curator.chip === "all" || p.tags.includes(curator.chip)) && (!hitIds || hitIds.has(p.id))).map((p) => p.id));
		return { order: ranked, visible, shown: visible.size, hasQuery };
	}, [curator.query, curator.chip]);

	// the Curator reports what it did in the hero console
	useEffect(() => {
		if (first.current) { first.current = false; return; }
		const desc = [curator.query && `"${curator.query}"`, curator.chip !== "all" && `tag:${curator.chip}`].filter(Boolean).join(" + ");
		if (!desc) return;
		store.setStatus("curator", "working", "filtering…");
		store.log("curator", `filter_projects(${desc}) → ${shown}/${projects.length}`);
		const t = setTimeout(() => store.setStatus("curator", "ready", "ready"), 700);
		return () => clearTimeout(t);
	}, [curator.query, curator.chip, shown]);

	const onInput = (v) => {
		setValue(v);
		clearTimeout(timer.current);
		timer.current = setTimeout(() => store.setCurator({ query: v.trim() }), 220);
	};
	const desc = [curator.query && `"${curator.query}"`, curator.chip !== "all" && `tag:${curator.chip}`].filter(Boolean).join(" + ");

	return (
		<section className="section" id="work">
			<div className="container">
				<SectionHead eyebrow="Selected work" title="Things I've built" lead="From small practice apps to full-stack builds. Live demos where they're hosted, code on GitHub for the rest." />

				<div className="curator">
					<Icon n="spark" className="icon curator__icon" />
					<input type="search" value={value} onChange={(e) => onInput(e.target.value)} placeholder="Ask the Curator: “games”, “api”, “ui”, “maps”…" aria-label="Ask the Curator to filter projects" autoComplete="off" />
					<div className="filters" role="group" aria-label="Project filters">
						{CHIPS.map(([id, label]) => (
							<button key={id} type="button" className={`filter${curator.chip === id ? " is-active" : ""}`} onClick={() => store.setCurator({ chip: id })}>{label}</button>
						))}
					</div>
				</div>
				<p className="curator__status" aria-live="polite">{desc ? `curator › filter_projects(${desc}) → ${shown} of ${projects.length}` : ""}</p>

				<div className="projects">
					{order.map((p) => (
						<article className="project" key={p.id} data-hidden={!visible.has(p.id)} data-match={hasQuery && visible.has(p.id)}>
							{p.img ? (
								<a className="project__img" href={p.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
									<Image src={p.img} alt="" width={p.w} height={p.h} sizes="(max-width: 600px) 100vw, 300px" />
								</a>
							) : (
								<a className="project__img project__cover" style={{ "--h": p.hue }} href={p.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
									<b>{p.stack.join(" · ")}</b>
								</a>
							)}
							<div className="project__body">
								<h3 className="project__title">{p.title}</h3>
								<p className="project__desc">{p.desc}</p>
								<div className="project__meta">{p.labels.map((l) => <span className="tag" key={l}>{l}</span>)}</div>
								<a className="project__link" href={p.url} target="_blank" rel="noopener noreferrer">{p.cta} <Icon n="ext" /></a>
							</div>
						</article>
					))}
				</div>
				{shown === 0 && <p className="empty">No matching projects. Try “game”, “api”, or “ui”.</p>}
			</div>
		</section>
	);
}
