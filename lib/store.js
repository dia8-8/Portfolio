"use client";
/**
 * A tiny external store shared by every client component:
 * agent status + the live log, the Curator's filter, the chat drawer, and the Fit-Check handoff.
 * (Keeps components decoupled without a provider tree.)
 */
import { useSyncExternalStore } from "react";

const AGENT_LABEL = { concierge: "concierge", curator: "curator", fitcheck: "fit-check", system: "system" };
export const agentLabel = (a) => AGENT_LABEL[a] || a;

let state = {
	logs: [],
	status: {
		concierge: { state: "idle", text: "idle" },
		curator: { state: "idle", text: "idle" },
		fitcheck: { state: "idle", text: "idle" },
	},
	curator: { query: "", chip: "all" },
	chatOpen: false,
	live: null, // null = unknown, true = Claude is on, false = local mode
	lit: [], // skill names highlighted by Fit-Check
	fitInput: null, // job description handed over from the chat
};
const listeners = new Set();
const SERVER_STATE = state;
let logId = 0;

function set(patch) {
	state = { ...state, ...patch };
	listeners.forEach((l) => l());
}

export const store = {
	get: () => state,
	subscribe(l) { listeners.add(l); return () => listeners.delete(l); },

	log(who, msg) {
		const time = new Date().toTimeString().slice(0, 8);
		set({ logs: [...state.logs, { id: ++logId, who, msg, time }].slice(-9) });
	},
	setStatus(agent, st, text) {
		set({ status: { ...state.status, [agent]: { state: st, text: text || st } } });
	},
	setCurator(patch) { set({ curator: { ...state.curator, ...patch } }); },
	applyCuratorQuery(query) { set({ curator: { query, chip: "all" } }); },
	openChat() { set({ chatOpen: true }); },
	closeChat() { set({ chatOpen: false }); },
	setLive(live) { set({ live }); },
	setLit(lit) { set({ lit }); },
	handOffToFit(text) { set({ fitInput: { text, at: Date.now() } }); },
};

export function useStore() {
	return useSyncExternalStore(store.subscribe, store.get, () => SERVER_STATE);
}
