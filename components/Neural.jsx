"use client";
import { useEffect, useRef } from "react";

/** Drifting network of nodes behind the page. Pauses when the tab is hidden; static for reduced motion. */
export default function Neural() {
	const ref = useRef(null);

	useEffect(() => {
		const cv = ref.current, ctx = cv.getContext("2d");
		const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
		let w, h, dpr, nodes = [], raf = 0, color = "139,123,255";
		const mouse = { x: -999, y: -999 };
		const readColor = () => { color = getComputedStyle(document.documentElement).getPropertyValue("--node").trim() || color; };

		const resize = () => {
			dpr = Math.min(devicePixelRatio || 1, 2);
			w = innerWidth; h = innerHeight;
			cv.width = w * dpr; cv.height = h * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			const n = Math.min(70, Math.floor((w * h) / 24000));
			nodes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28, r: Math.random() * 1.4 + 0.8 }));
		};
		const draw = () => {
			ctx.clearRect(0, 0, w, h);
			for (const a of nodes) {
				if (!reduce) {
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
			if (!reduce) raf = requestAnimationFrame(draw);
		};
		const start = () => { cancelAnimationFrame(raf); draw(); };
		const onResize = () => { resize(); if (reduce) draw(); };
		const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
		const onVis = () => { if (document.hidden) cancelAnimationFrame(raf); else if (!reduce) start(); };
		const onTheme = () => { readColor(); if (reduce) draw(); };

		resize(); readColor(); start();
		addEventListener("resize", onResize);
		addEventListener("pointermove", onMove, { passive: true });
		addEventListener("themechange", onTheme);
		document.addEventListener("visibilitychange", onVis);
		return () => {
			cancelAnimationFrame(raf);
			removeEventListener("resize", onResize);
			removeEventListener("pointermove", onMove);
			removeEventListener("themechange", onTheme);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, []);

	return <canvas id="neural" ref={ref} aria-hidden="true" />;
}
