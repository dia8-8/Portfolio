"use client";
import { profile } from "@/lib/content";
import { useStore, agentLabel } from "@/lib/store";
import { Icon, OpenChat } from "./ui";

const ROWS = [
	["concierge", "Concierge"],
	["curator", "Curator"],
	["fitcheck", "Fit‑Check"],
];

function Console() {
	const { logs, status, live } = useStore();
	return (
		<aside className="console" aria-label="Live agent activity">
			<div className="console__bar">
				<span className="dot dot--r" /><span className="dot dot--y" /><span className="dot dot--g" />
				<span className="console__title">agents.log</span>
				<span className="console__live"><span className="pulse" /> {live === true ? "live · claude" : "live"}</span>
			</div>
			<ul className="console__agents">
				{ROWS.map(([id, label]) => (
					<li key={id} className={status[id].state === "working" ? "is-working" : status[id].state === "ready" ? "is-ready" : ""} data-agent={id}>
						<span className="status" />
						<b>{label}</b>
						<i>{status[id].text}</i>
					</li>
				))}
			</ul>
			<div className="console__log" role="log" aria-live="off">
				{logs.map((l) => (
					<div className="log-line" key={l.id}>
						<time>{l.time}</time>
						<span className={`who who--${l.who}`}>{agentLabel(l.who)}</span>
						<span className="msg">{l.msg}</span>
					</div>
				))}
			</div>
		</aside>
	);
}

export default function Hero() {
	return (
		<section className="hero" id="top">
			<div className="hero__container container">
				<div className="hero__copy">
					<p className="eyebrow"><span className="pulse" /> Open to junior web developer roles</p>
					<h1 className="hero__title">
						Hi, I&apos;m <span className="grad">Adam&nbsp;Dia</span>.<br />
						I build for the web, with agents in the loop.
					</h1>
					<p className="hero__lead">
						Computer Science graduate (Université de Sherbrooke, April 2025). This portfolio is staffed by three small agents: one answers questions about me, one curates my projects, and one checks how my skills match <em>your</em> job description.
					</p>
					<div className="hero__cta">
						<OpenChat><Icon n="spark" /> Talk to my agent</OpenChat>
						<a href="#work" className="button button--ghost">See my work <Icon n="arrow" /></a>
					</div>
					<div className="hero__links">
						<a href={profile.github} target="_blank" rel="noopener noreferrer"><Icon n="github" /> GitHub</a>
						<a href={profile.linkedin} target="_blank" rel="noopener noreferrer"><Icon n="linkedin" /> LinkedIn</a>
						<a href={profile.resume} download><Icon n="file" /> Résumé</a>
					</div>
				</div>
				<Console />
			</div>
		</section>
	);
}
