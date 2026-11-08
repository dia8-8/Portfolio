import Neural from "@/components/Neural";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Agents from "@/components/Agents";
import Work from "@/components/Work";
import Skills from "@/components/Skills";
import { About, Contact, Footer } from "@/components/Sections";
import ChatDrawer from "@/components/ChatDrawer";
import Runtime from "@/components/Runtime";
import Director from "@/components/Director";

export default function Page() {
	return (
		<>
			<Neural />
			<a className="skip" href="#main">Skip to content</a>
			<Header />
			<main id="main">
				<Hero />
				<Agents />
				<Work />
				<Skills />
				<About />
				<Contact />
			</main>
			<Footer />
			<ChatDrawer />
			<Runtime />
			<Director />
		</>
	);
}
