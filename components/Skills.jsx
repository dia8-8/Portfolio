"use client";
import { skillGroups } from "@/lib/content";
import { useStore } from "@/lib/store";
import { SectionHead } from "./ui";

export default function Skills() {
	const { lit } = useStore();
	return (
		<section className="section" id="skills">
			<div className="container">
				<SectionHead eyebrow="Toolkit" title="What I work with" lead="Honest levels: I'm early in my career and still learning quickly." />
				<div className="skills">
					{skillGroups.map((g) => (
						<div className={`skill-group${g.explore ? " skill-group--explore" : ""}`} key={g.group}>
							<h3>{g.heading}</h3>
							<ul>
								{g.items.map((s) => (
									<li key={s.name} className={lit.includes(s.name) ? "is-lit" : undefined}>
										{s.label || s.name} <span>{s.level}</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
