/*
 * Agent configuration.
 *
 * By default the agents are LOCAL: they run entirely in the visitor's browser
 * and only use content that is already on the page (projects, skills, education).
 * No API key, no backend, nothing leaves the browser.
 *
 * To upgrade the Concierge to a real LLM, deploy a tiny serverless function
 * (Vercel / Netlify / Cloudflare Worker) that holds YOUR API key and forwards
 * requests to a model, then put its URL below. NEVER put an API key in this file:
 * everything in this repo is public.
 *
 * The endpoint receives:   POST { messages: [{role, content}, ...], knowledge: "<text about Adam>" }
 * and must respond with:   { reply: "<text>" }
 *
 * If the endpoint is empty or fails, the Concierge falls back to the local agent.
 */
window.AGENT_CONFIG = {
	endpoint: "",
	timeoutMs: 20000,
};
