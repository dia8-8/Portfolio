"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { localAnswer, formatReply, esc } from "@/lib/localAgent";
import { store, useStore } from "@/lib/store";
import { Icon } from "./ui";

const SUGGESTIONS = ["What have you built?", "What are your skills?", "Where did you study?", "Do you know Python?", "Show me games", "How can I contact you?"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stripTags = (h) => h.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const traceLabel = (name, input) => {
	const v = input && Object.values(input)[0];
	return typeof v === "string" ? `${name}("${v.length > 24 ? v.slice(0, 24) + "…" : v}")` : `${name}()`;
};

export default function ChatDrawer() {
	const { chatOpen, live } = useStore();
	const [msgs, setMsgs] = useState([]); // { id, role, html, plain, trace[], pending }
	const [input, setInput] = useState("");
	const [busy, setBusy] = useState(false);
	const [started, setStarted] = useState(false);
	const scrollRef = useRef(null), inputRef = useRef(null), chatRef = useRef(null), openerRef = useRef(null), idRef = useRef(0);
	const msgsRef = useRef(msgs);
	msgsRef.current = msgs;

	const nextId = () => ++idRef.current;
	const patch = useCallback((id, fn) => setMsgs((ms) => ms.map((m) => (m.id === id ? { ...m, ...fn(m) } : m))), []);

	/* ---------- open / close, keyboard ---------- */
	const close = useCallback(() => {
		store.closeChat();
		store.setStatus("concierge", "ready", "idle");
		openerRef.current?.focus?.();
	}, []);

	useEffect(() => {
		if (!chatOpen) return;
		openerRef.current = document.activeElement;
		store.log("concierge", "session opened");
		store.setStatus("concierge", "ready", "chatting");
		const t = setTimeout(() => inputRef.current?.focus(), 50);
		return () => clearTimeout(t);
	}, [chatOpen]);

	useEffect(() => {
		const onKey = (e) => {
			const open = store.get().chatOpen;
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open ? close() : store.openChat(); }
			else if (e.key === "Escape" && open) close();
			else if (e.key === "Tab" && open && chatRef.current) { // keep focus inside the drawer
				const f = [...chatRef.current.querySelectorAll("button, input, a[href]")].filter((x) => !x.disabled && x.offsetParent !== null);
				if (!f.length) return;
				const first = f[0], last = f[f.length - 1];
				if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
				else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [close]);

	useEffect(() => { scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight); }, [msgs]);

	// greeting (once the mode is known)
	useEffect(() => {
		if (!chatOpen || msgsRef.current.length || live === null) return;
		setMsgs([{
			id: nextId(), role: "agent", trace: [], pending: false,
			html: `Hi, I'm Adam's Concierge. I can answer questions about his projects, skills, education and how to reach him. ${live ? "I'm powered by Claude and I only use what's on this site. " : "I'm running in offline mode, so I only know what's on this page. "}Try a suggestion below, or paste a job description and I'll hand it to Fit-Check.`,
		}]);
	}, [chatOpen, live]);

	/* ---------- actions the agent can take on the page ---------- */
	const perform = useCallback((a) => {
		if (a.type === "navigate" || a.name === "navigate") {
			const id = a.section || a.input?.section;
			store.log("concierge", `navigate("#${id}")`);
			setTimeout(() => { close(); document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }, 700);
		} else if (a.type === "filter" || a.name === "filter_projects") {
			const q = a.query ?? a.input?.query ?? "";
			store.setStatus("curator", "working", "asked by concierge");
			store.log("concierge", `→ curator: filter_projects("${q}")`);
			store.applyCuratorQuery(q);
		} else if (a.type === "fit") {
			store.handOffToFit(a.text);
		}
	}, [close]);

	/* ---------- answering ---------- */
	const answerLocal = useCallback(async (id, text, note) => {
		await sleep(matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450);
		const out = localAnswer(text);
		patch(id, () => ({ html: (note ? `<i>${esc(note)}</i><br>` : "") + out.html, plain: stripTags(out.html), trace: out.trace, pending: false }));
		out.trace.filter((x) => !x.startsWith("→")).slice(0, 2).forEach((x) => store.log("concierge", `tool ${x}`));
		(out.actions || []).forEach(perform);
	}, [patch, perform]);

	const answerLive = useCallback(async (id, history) => {
		const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) });
		if (res.status === 503) { store.setLive(false); return { fallback: "offline" }; }
		if (res.status === 429) return { fallback: "rate" };
		if (!res.ok || !res.body) return { fallback: "error" };

		const reader = res.body.getReader(), dec = new TextDecoder();
		let buf = "", text = "", gotAny = false, errored = false;
		const handle = (ev) => {
			if (ev.t === "text") { gotAny = true; text += ev.d; patch(id, () => ({ html: formatReply(text), plain: text, pending: false })); }
			else if (ev.t === "tool") {
				const label = traceLabel(ev.name, ev.input);
				store.log("concierge", `tool ${label}`);
				patch(id, (m) => ({ trace: [...m.trace, label] }));
			} else if (ev.t === "action") { perform(ev); }
			else if (ev.t === "error") errored = true;
		};
		for (;;) {
			const { value, done } = await reader.read();
			if (done) break;
			buf += dec.decode(value, { stream: true });
			let nl;
			while ((nl = buf.indexOf("\n")) >= 0) {
				const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
				if (line) { try { handle(JSON.parse(line)); } catch { /* ignore a malformed line */ } }
			}
		}
		if (errored && !gotAny) return { fallback: "error" };
		if (!gotAny) patch(id, () => ({ html: "Sorry, I couldn't put together an answer. Please try again, or email Adam directly.", pending: false }));
		return { ok: true };
	}, [patch, perform]);

	const ask = useCallback(async (raw) => {
		const text = raw.trim();
		if (!text || busy) return;
		setBusy(true); setInput(""); setStarted(true);
		const userMsg = { id: nextId(), role: "user", html: esc(text), plain: text, trace: [] };
		const agentId = nextId();
		const history = [...msgsRef.current.filter((m) => m.plain || m.role === "user"), userMsg].map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.plain || stripTags(m.html) }));
		setMsgs((ms) => [...ms, userMsg, { id: agentId, role: "agent", html: "", plain: "", trace: [], pending: true }]);
		store.log("concierge", `query: "${text.length > 38 ? text.slice(0, 38) + "…" : text.replace(/\n/g, " ")}"`);
		store.setStatus("concierge", "working", "thinking…");

		try {
			let r = { fallback: "offline" };
			if (store.get().live !== false) { try { r = await answerLive(agentId, history); } catch { r = { fallback: "error" }; } }
			if (r.fallback) {
				const notes = { rate: "You're sending messages quickly, so here is the offline answer.", error: "The live agent hit a problem, so here is the offline answer." };
				await answerLocal(agentId, text, notes[r.fallback]);
			}
		} finally {
			store.setStatus("concierge", "ready", "chatting");
			setBusy(false);
			inputRef.current?.focus();
		}
	}, [busy, answerLive, answerLocal]);

	const onChatClick = (e) => { if (e.target.closest('a[href^="#"]')) close(); };

	return (
		<>
			<div className="scrim" hidden={!chatOpen} onClick={close} />
			<aside className="chat" ref={chatRef} role="dialog" aria-modal="true" aria-labelledby="chat-title" hidden={!chatOpen}>
				<header className="chat__head">
					<div>
						<h2 id="chat-title"><Icon n="spark" /> Concierge</h2>
						<p className="chat__mode">{live === true ? "Live · powered by Claude" : live === false ? "Offline mode · rule-based" : "Connecting…"}</p>
					</div>
					<button className="icon-btn" type="button" aria-label="Close chat" onClick={close}><Icon n="x" /></button>
				</header>

				<div className="chat__scroll" ref={scrollRef} aria-live="polite" onClick={onChatClick}>
					{msgs.map((m) => (
						<div className={`msg-row msg-row--${m.role}`} key={m.id}>
							{m.trace?.length > 0 && <div className="trace">{m.trace.map((t, i) => <code key={i}>{t}</code>)}</div>}
							<div className="bubble">
								{m.pending && !m.html ? <span className="typing"><i /><i /><i /></span> : <span dangerouslySetInnerHTML={{ __html: m.html }} />}
							</div>
						</div>
					))}
				</div>

				{!started && (
					<div className="chat__suggest">
						{SUGGESTIONS.map((s) => <button type="button" className="suggest" key={s} onClick={() => ask(s)}>{s}</button>)}
					</div>
				)}
				{live === true && <p className="chat__privacy">Messages are sent to Claude to answer. Please don&apos;t share anything sensitive.</p>}

				<form className="chat__form" autoComplete="off" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
					<label htmlFor="chat-input" className="sr">Message the Concierge</label>
					<input id="chat-input" ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about my projects, skills, education…" maxLength={1500} />
					<button className="send" type="submit" aria-label="Send" disabled={busy}><Icon n="send" /></button>
				</form>
			</aside>

			<button className="fab" type="button" aria-label="Ask my agent" onClick={() => store.openChat()}><Icon n="spark" /></button>
		</>
	);
}
