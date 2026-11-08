import { ABOUT_ART } from "./aboutArt";
import { profile, projects } from "@/lib/content";
import { SectionHead, Icon } from "./ui";

export function About() {
	return (
		<section className="section" id="about">
			<div className="container about">
				<div className="about__media">
					<div dangerouslySetInnerHTML={{ __html: ABOUT_ART }} />
				</div>
				<div className="about__copy">
					<p className="eyebrow">About</p>
					<h2 className="section__title">A student who ships</h2>
					<p>
						I graduated from the <b>Université de Sherbrooke</b> in <b>April 2025</b> with a Bachelor&apos;s degree in Computer Science. My path began earlier: I started Computer Science at the Lebanese University in <b>September 2018</b>, then added a double major in Systems Engineering at Antonine University in <b>September 2019</b>.
					</p>
					<p>
						Alongside my degrees I keep building: small web apps, games and interfaces that teach me something new each time. Right now I&apos;m learning how to design software that works <em>with</em> AI agents: tool-calling, retrieval, and keeping their answers grounded in real data. That&apos;s exactly how the agents on this page work.
					</p>
					<ul className="facts">
						<li><b>Apr 2025</b><span>B.Sc. Computer Science, Université de Sherbrooke</span></li>
						<li><b>{projects.length}</b><span>Projects built</span></li>
						<li><b>Now</b><span>Learning AI agents &amp; LLM APIs</span></li>
					</ul>
					<a href="#contact" className="button button--primary">Get in touch <Icon n="arrow" /></a>
				</div>
			</div>
		</section>
	);
}

export function Contact() {
	return (
		<section className="section" id="contact">
			<div className="container">
				<div className="cta">
					<SectionHead eyebrow="Contact" title="Let's build something" lead={`I'm looking for ${profile.looking}. The fastest way to reach me is email.`} />
					<div className="cta__row">
						<a className="button button--primary" href={`mailto:${profile.email}`}><Icon n="mail" /> {profile.email}</a>
						<a className="button button--ghost" href={profile.linkedin} target="_blank" rel="noopener noreferrer"><Icon n="linkedin" /> LinkedIn</a>
						<a className="button button--ghost" href={profile.resume} download><Icon n="file" /> Download résumé</a>
					</div>
				</div>
			</div>
		</section>
	);
}

export function Footer() {
	return (
		<footer className="footer">
			<div className="container footer__row">
				<span>© {new Date().getFullYear()} Adam Dia</span>
				<span className="footer__note">The agents only use content from this site. Answers may be written by an AI model.</span>
				<a href="#top" className="footer__top">Back to top <Icon n="up" /></a>
			</div>
		</footer>
	);
}
