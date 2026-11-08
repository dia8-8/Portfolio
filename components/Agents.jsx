import { SectionHead, OpenChat, Icon } from "./ui";
import FitCheck from "./FitCheck";

const CARDS = [
	{
		key: "a", name: "Concierge",
		text: "Answers questions about my background, skills, projects and how to reach me, and can jump you to any section.",
		tools: ["search_projects", "get_skills", "filter_projects", "navigate"],
		action: <OpenChat className="button button--ghost button--sm">Open chat <Icon n="arrow" /></OpenChat>,
	},
	{
		key: "b", name: "Curator",
		text: "Filters my projects from plain language. Try “games”, “something with an API” or “ui” in the Work section.",
		tools: ["filter_projects", "rank_by_relevance"],
		action: <a href="#work" className="button button--ghost button--sm">Go to Work <Icon n="arrow" /></a>,
	},
	{
		key: "c", name: "Fit‑Check",
		text: "Paste a job description. It matches it against my real skills and projects, and tells you plainly where I don't fit yet.",
		tools: ["parse_job", "match_skills", "find_gaps"],
		action: <a href="#fit" className="button button--ghost button--sm">Try it below <Icon n="arrow" /></a>,
	},
];

export default function Agents() {
	return (
		<section className="section" id="agents">
			<div className="container">
				<SectionHead
					eyebrow="Meet the crew"
					title="Three agents, one portfolio"
					lead="Each agent has one job, a small set of tools, and only knows what is written on this page. No invented experience. Try them."
				/>
				<div className="agents">
					{CARDS.map((c) => (
						<article className="agent-card" key={c.key}>
							<div className="agent-card__top">
								<span className={`agent-badge agent-badge--${c.key}`}><Icon n="spark" /></span>
								<h3>{c.name}</h3>
							</div>
							<p>{c.text}</p>
							<p className="tools">{c.tools.map((t) => <code key={t}>{t}</code>)}</p>
							{c.action}
						</article>
					))}
				</div>
				<FitCheck />
			</div>
		</section>
	);
}
