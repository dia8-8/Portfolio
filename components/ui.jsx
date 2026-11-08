"use client";
import { store } from "@/lib/store";

export const Icon = ({ n, className = "icon" }) => (
	<svg className={className} aria-hidden="true">
		<use href={`#i-${n}`} />
	</svg>
);

/** Section heading: the title is split into words so each one can stream in (see Director + CSS). */
export function SectionHead({ eyebrow, title, lead }) {
	return (
		<header className="section__head">
			<p className="eyebrow">{eyebrow}</p>
			<h2 className="section__title" aria-label={title}>
				{title.split(" ").map((w, i, arr) => (
					<span key={i}>
						<span className="w" aria-hidden="true" style={{ "--i": i }}>{w}</span>
						{i < arr.length - 1 ? " " : null}
					</span>
				))}
			</h2>
			{lead ? <p className="section__lead">{lead}</p> : null}
		</header>
	);
}

export function OpenChat({ className = "button button--primary", children }) {
	return (
		<button className={className} type="button" onClick={(e) => { store.openChat(); e.currentTarget.blur(); }}>
			{children}
		</button>
	);
}
