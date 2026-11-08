import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SPRITE } from "@/components/sprite";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata = {
	title: "Adam Dia — Web Developer building with AI agents",
	description:
		"Adam Dia graduated from the Université de Sherbrooke in April 2025 with a Bachelor's degree in Computer Science, and builds web apps. This portfolio is staffed by AI agents: ask one about my work, or let one match my skills to your job description.",
	openGraph: {
		title: "Adam Dia — Web Developer building with AI agents",
		description: "A portfolio staffed by AI agents. Ask the Concierge, browse the work, or run Fit-Check on a job description.",
		type: "website",
	},
};

export const viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: [
		{ media: "(prefers-color-scheme: dark)", color: "#0b0e17" },
		{ media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
	],
};

// Runs before first paint: restores the theme and enables motion styles (unless the visitor prefers reduced motion).
const BOOT = `try{var d=document.documentElement,t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");d.dataset.theme=t;if(!matchMedia("(prefers-reduced-motion: reduce)").matches)d.classList.add("js")}catch(e){document.documentElement.dataset.theme="dark"}`;

export default function RootLayout({ children }) {
	return (
		<html lang="en" className={`${inter.variable} ${mono.variable}`} data-theme="dark" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: BOOT }} />
			</head>
			<body>
				<svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: SPRITE }} />
				{children}
			</body>
		</html>
	);
}
