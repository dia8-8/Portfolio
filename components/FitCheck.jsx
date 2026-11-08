"use client";
import { useEffect, useRef, useState } from "react";
import { profile, SAMPLE_JD } from "@/lib/content";
import { analyzeJob, verdict, briefText } from "@/lib/analyze";
import { store, useStore } from "@/lib/store";
import { Icon } from "./ui";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STEPS = ["parse_job(text)", "match_skills(toolkit)", "find_gaps()", "write_brief()"];

export default function FitCheck() {
	const { live, fitInput } = useStore();
	const [text, setText] = useState("");
	const [busy, setBusy] = useState(false);
	const [msg, setMsg] = useState("");
	const [run, setRun] = useState(null); // { a, stepIdx, done, summary, summaryState }
	const [meter, setMeter] = useState(0);
	const [copied, setCopied] = useState("Copy brief");
	const lastHandoff = useRef(0);
	const reduceMotion = useRef(false);

	useEffect(() => { reduceMotion.current = matchMedia("(prefers-reduced-motion: reduce)").matches; }, []);

	/** Stream the model's summary. Returns the text, or "" when the live agent is unavailable. */
	async function streamSummary(jd, onText) {
		if (live === false) return "";
		try {
			const res = await fetch("/api/fit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jd }) });
			if (res.status === 503) { store.setLive(false); return ""; }
			if (!res.ok || !res.body) return "";
			const reader = res.body.getReader(), dec = new TextDecoder();
			let acc = "";
			for (;;) {
				const { value, done } = await reader.read();
				if (done) break;
				acc += dec.decode(value, { stream: true });
				onText(acc);
			}
			return acc.trim();
		} catch { return ""; }
	}

	async function go(input) {
		const jd = (input ?? text).trim();
		if (busy) return;
		if (jd.length < 20) { setMsg("Paste a bit more of the job description (at least a sentence) and try again."); setRun(null); return; }
		setMsg(""); setBusy(true); setMeter(0);
		store.setStatus("fitcheck", "working", "analysing…");
		const a = analyzeJob(jd);
		setRun({ a, stepIdx: 0, done: false, summary: "", summaryState: "pending" });

		// start the model call right away; it runs while the step animation plays
		const summaryP = streamSummary(jd, (t) => setRun((r) => r && { ...r, summary: t, summaryState: "streaming" }));
		for (let i = 0; i < STEPS.length; i++) {
			setRun((r) => r && { ...r, stepIdx: i });
			store.log("fitcheck", STEPS[i]);
			await sleep(reduceMotion.current ? 0 : 420);
		}
		setRun((r) => r && { ...r, stepIdx: STEPS.length, done: true });
		store.setLit([...a.core, ...a.exploring].map((s) => s.name));
		requestAnimationFrame(() => setMeter(a.pct || 0));

		const live_ = await summaryP;
		const final = live_ || verdict(a);
		setRun((r) => r && { ...r, summary: final, summaryState: live_ ? "live" : "local" });
		store.log("fitcheck", a.pct === null ? "no recognisable tech found" : `skill overlap ${a.pct}% · ${a.gaps.length} gap(s)${live_ ? " · summary by claude" : ""}`);
		store.setStatus("fitcheck", "ready", "ready");
		setBusy(false);
	}

	// Handoff from the Concierge (visitor pasted a job description into the chat)
	useEffect(() => {
		if (fitInput && fitInput.at !== lastHandoff.current) {
			lastHandoff.current = fitInput.at;
			setText(fitInput.text);
			go(fitInput.text);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fitInput]);

	const a = run?.a;
	const copy = async () => {
		try { await navigator.clipboard.writeText(`${briefText(a)}\n\n${run.summary}`); setCopied("Copied ✓"); } catch { setCopied("Copy failed"); }
		setTimeout(() => setCopied("Copy brief"), 1800);
	};

	return (
		<div className="fit" id="fit">
			<div className="fit__input">
				<label htmlFor="fit-text" className="fit__label">Fit&#8209;Check &mdash; paste a job description</label>
				<textarea id="fit-text" rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a job posting here, e.g. “Junior Frontend Developer. HTML, CSS, JavaScript, React. Familiarity with REST APIs and Git. Nice to have: TypeScript…”" maxLength={6000} />
				<div className="fit__row">
					<button className="button button--primary" type="button" onClick={() => go()} disabled={busy}><Icon n="spark" /> Run Fit&#8209;Check</button>
					<button className="button button--ghost" type="button" onClick={() => setText(SAMPLE_JD)}>Use a sample</button>
					<span className="fit__note">
						{live === true ? "The text is sent to Claude to write the summary. This site doesn't store it." : "Runs locally in your browser. Nothing you paste leaves it."}
					</span>
				</div>
			</div>

			<div className="fit__output" aria-live="polite">
				{!run && <div className="fit__empty"><p>{msg || "The agent's trace and brief will appear here."}</p></div>}
				{run && (
					<>
						<div className="steps">
							{STEPS.map((s, i) => {
								const st = i < run.stepIdx ? "is-done" : i === run.stepIdx && !run.done ? "is-running" : run.done ? "is-done" : "";
								const detail = [`${text.trim().split(/\s+/).length} words`, `${a.core.length + a.exploring.length} matches`, `${a.gaps.length} gaps`, "done"][i];
								return <div className={`step ${st}`} key={s}>{st === "is-done" ? `${s} → ${detail}` : s}</div>;
							})}
						</div>
						{run.done && (a.pct === null ? (
							<div className="brief"><p>{verdict(a)}</p></div>
						) : (
							<div className="brief">
								<div className="brief__score"><b>{a.pct}%</b><span>skill overlap on {a.denom} detected technolog{a.denom === 1 ? "y" : "ies"}</span></div>
								<div className="meter"><i style={{ width: `${meter}%` }} /></div>
								<h4>Matches</h4>
								<div className="pills">
									{a.core.map((s) => <span className="pill pill--ok" key={s.name}>{s.name} · {s.level}</span>)}
									{a.exploring.map((s) => <span className="pill pill--soft" key={s.name}>{s.name} · exploring</span>)}
									{!a.core.length && !a.exploring.length && <span className="pill pill--soft">none detected</span>}
								</div>
								<h4>Not in my toolkit yet</h4>
								<div className="pills">
									{a.gaps.map((g) => <span className="pill pill--gap" key={g}>{g}</span>)}
									{!a.gaps.length && <span className="pill pill--soft">none detected</span>}
								</div>
								{(a.concepts.length > 0 || a.git) && (
									<>
										<h4>Evidence</h4>
										<ul className="evidence">
											{a.concepts.map((c) => (
												<li key={c.label}><b>{c.label}:</b>{" "}
													{c.projects.map((p, i) => <span key={p.id}>{i ? ", " : ""}<a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a></span>)}
												</li>
											))}
											{a.git && <li><b>Git &amp; GitHub:</b> <a href={profile.github} target="_blank" rel="noopener noreferrer">my public GitHub</a></li>}
										</ul>
									</>
								)}
								<h4>Summary{run.summaryState === "live" ? " · written by Claude" : ""}</h4>
								<p>{run.summary || "Writing the summary…"}</p>
								<div className="brief__actions">
									<button className="button button--ghost button--sm" type="button" onClick={copy}>{copied}</button>
									<a className="button button--primary button--sm" href={`mailto:${profile.email}?subject=${encodeURIComponent("Role at your company")}`}>Email Adam</a>
								</div>
							</div>
						))}
					</>
				)}
			</div>
		</div>
	);
}
