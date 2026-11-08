"use client";
import { useEffect, useState } from "react";
import { store } from "@/lib/store";
import { Icon } from "./ui";

const LINKS = [
	["agents", "Agents"],
	["work", "Work"],
	["skills", "Skills"],
	["about", "About"],
	["contact", "Contact"],
];

export default function Header() {
	const [scrolled, setScrolled] = useState(false);
	const [menu, setMenu] = useState(false);
	const [active, setActive] = useState("");
	const [theme, setTheme] = useState("dark");

	useEffect(() => {
		setTheme(document.documentElement.dataset.theme || "dark");
		const onScroll = () => setScrolled(window.scrollY > 10);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });

		const io = new IntersectionObserver(
			(entries) => entries.forEach((en) => en.isIntersecting && setActive(en.target.id)),
			{ rootMargin: "-45% 0px -50% 0px" }
		);
		document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));
		return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
	}, []);

	const toggleTheme = () => {
		const next = theme === "dark" ? "light" : "dark";
		document.documentElement.dataset.theme = next;
		try { localStorage.setItem("theme", next); } catch { /* storage unavailable */ }
		setTheme(next);
		window.dispatchEvent(new Event("themechange"));
	};

	return (
		<header className={`header${scrolled ? " is-scrolled" : ""}`} id="header">
			<nav className="nav container" aria-label="Main">
				<a href="#top" className="nav__logo">Adam Dia</a>

				<ul className={`nav__list${menu ? " is-open" : ""}`} id="nav-list" onClick={(e) => e.target.closest("a") && setMenu(false)}>
					{LINKS.map(([id, label]) => (
						<li key={id}>
							<a href={`#${id}`} className={`nav__link${active === id ? " is-active" : ""}`}>{label}</a>
						</li>
					))}
				</ul>

				<div className="nav__actions">
					<button className="chip-btn" type="button" aria-haspopup="dialog" onClick={() => store.openChat()}>
						<Icon n="spark" />
						<span>Ask my agent</span>
						<kbd>Ctrl K</kbd>
					</button>
					<button className="icon-btn" type="button" aria-label="Toggle light/dark theme" onClick={toggleTheme}>
						<Icon n={theme === "dark" ? "sun" : "moon"} />
					</button>
					<button className="icon-btn nav__toggle" type="button" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} aria-controls="nav-list" onClick={() => setMenu((m) => !m)}>
						<Icon n={menu ? "x" : "menu"} />
					</button>
				</div>
			</nav>
		</header>
	);
}
