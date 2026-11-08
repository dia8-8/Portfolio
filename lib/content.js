/**
 * Single source of truth for everything on the site AND everything the agents know.
 * Edit this file to change the page and the agents' knowledge at the same time.
 */

export const profile = {
	name: "Adam Dia",
	email: "dia8_8@hotmail.com",
	linkedin: "https://www.linkedin.com/in/adam-dia-976765213/",
	github: "https://github.com/dia8-8",
	resume: "/assets/pdf/Adam-Dia.pdf",
	looking: "a junior web developer role",
	education: [
		{
			school: "Université de Sherbrooke",
			detail: "Bachelor's degree in Computer Science, graduated April 2025",
		},
		{
			school: "Lebanese University",
			detail: "Started Computer Science in September 2018",
		},
		{
			school: "Antonine University",
			detail: "Added a double major in Systems Engineering in September 2019",
		},
	],
};

export const projects = [
	{
		id: "vcm", title: "VC Management", cta: "View code", live: false,
		desc: "Full-stack admin system: a React dashboard (routing, Recharts charts, QR-code scanning) on an Express + Prisma API with JWT login.",
		url: "https://github.com/dia8-8/vc-management", hue: 262, stack: ["React", "Express", "Prisma"],
		tags: ["fullstack", "app"], labels: ["Full-stack", "React", "Express", "Prisma"],
		keywords: "admin dashboard management full-stack fullstack react express prisma jwt authentication recharts qr scanner railway node api database",
	},
	{
		id: "glory", title: "Glory RP", cta: "View live", live: true,
		desc: "Website for a FiveM roleplay community, in Arabic and English: content creators, server rules, job applications, a VIP shop and sign-in. Built with Next.js, TypeScript, NextAuth and Supabase.",
		url: "https://gloryrp.vercel.app/", img: "/projects/glory.webp", w: 800, h: 533,
		tags: ["fullstack", "site"], labels: ["Full-stack", "Next.js", "TypeScript", "Arabic/English"],
		keywords: "glory rp life fivem roleplay role play gta community arabic english bilingual rtl gaming discord website next.js nextjs typescript nextauth next-auth supabase tailwind framer motion authentication vercel database shop vip jobs rules streamers",
	},
	{
		id: "corona", title: "Corona Halal", cta: "View code", live: false,
		desc: "Website built with React, TypeScript and Vite, styled with Tailwind CSS.",
		url: "https://github.com/dia8-8/corona-halal", hue: 160, stack: ["React", "TypeScript", "Vite"],
		tags: ["site", "ui"], labels: ["Site", "React", "TypeScript"],
		keywords: "corona halal website site react typescript vite tailwind frontend ui",
	},
	{
		live: true, id: "shop", title: "Shopping Cart", cta: "View live",
		desc: "Storefront with a working cart, with products served from the Contentful headless CMS.",
		url: "https://shopping-cart-contentful.vercel.app/", img: "/projects/shop.webp", w: 960, h: 640,
		tags: ["ui", "app"], labels: ["UI", "App", "Contentful"],
		keywords: "shopping cart store ecommerce e-commerce contentful cms headless products",
	},
	{
		live: true, id: "todo", title: "To-Do List", cta: "View live",
		desc: "A task list to add, complete and remove items.",
		url: "https://better-to-do-list-one.vercel.app/", img: "/projects/todolist.webp", w: 960, h: 640,
		tags: ["app"], labels: ["App"], keywords: "todo to-do list tasks productivity",
	},
	{
		live: true, id: "weather", title: "Weather App", cta: "View live",
		desc: "Look up the weather for a city, with data fetched from a weather API.",
		url: "https://weather-app-tau-five.vercel.app/", img: "/projects/weatherapp.webp", w: 960, h: 640,
		tags: ["app"], labels: ["App", "API"], keywords: "weather forecast api city temperature fetch data",
	},
	{
		live: true, id: "fitness", title: "Map Fitness Tracker", cta: "View live",
		desc: "Log workouts and see them on an interactive map.",
		url: "https://map-fitness-tracker.vercel.app/", img: "/projects/fitness.webp", w: 960, h: 640,
		tags: ["app"], labels: ["App", "Maps"], keywords: "fitness workout tracker map maps running cycling geolocation",
	},
	{
		live: true, id: "tictactoe", title: "Tic-Tac-Toe", cta: "Play it",
		desc: "The classic two-player game, with win and draw detection written in JavaScript.",
		url: "https://tic-tac-toe-javascript-opal.vercel.app/", img: "/projects/tictactoe.webp", w: 960, h: 647,
		tags: ["game"], labels: ["Game", "JavaScript"], keywords: "tic tac toe tictactoe game play logic javascript",
	},
	{
		live: true, id: "maze", title: "Maze Game", cta: "Play it",
		desc: "Navigate a maze to reach the goal.",
		url: "https://maze-project-ten.vercel.app/", img: "/projects/maze.webp", w: 960, h: 673,
		tags: ["game"], labels: ["Game"], keywords: "maze game play puzzle physics",
	},
	{
		live: true, id: "timer", title: "Timer", cta: "View live",
		desc: "A simple timer with start, pause and reset controls.",
		url: "https://timer-project-delta.vercel.app/", img: "/projects/timer.webp", w: 960, h: 640,
		tags: ["app"], labels: ["App"], keywords: "timer countdown stopwatch time",
	},
	{
		live: true, id: "signup", title: "Sign-Up Form", cta: "View live",
		desc: "Form layout and styling. The validation logic is still on my to-do list.",
		url: "https://form-validation-dusky.vercel.app/", img: "/projects/signup.webp", w: 960, h: 604,
		tags: ["ui"], labels: ["UI", "In progress"], keywords: "form validation signup sign up register design interface",
	},
	{
		id: "gloryvip", title: "Glory VIP", cta: "View code", live: false,
		desc: "Single-page static website in HTML, with its own images and logo.",
		url: "https://github.com/dia8-8/gloryVIP", hue: 28, stack: ["HTML"],
		tags: ["site"], labels: ["Site", "HTML"],
		keywords: "glory vip website site static html landing page",
	},
	{
		id: "ether", title: "EtherWeb", cta: "View code", live: false,
		desc: "Website built with plain HTML, CSS and JavaScript.",
		url: "https://github.com/dia8-8/EtherWeb", hue: 200, stack: ["HTML", "CSS", "JavaScript"],
		tags: ["site"], labels: ["Site", "HTML", "CSS", "JavaScript"],
		keywords: "etherweb ether website site html css javascript frontend",
	},
	{
		id: "face", title: "Face Recognition App", cta: "View code", live: false,
		desc: "Java application that detects and recognizes faces, using the OpenCV / JavaCV libraries.",
		url: "https://github.com/dia8-8/Face-Recognize", hue: 350, stack: ["Java", "OpenCV"],
		tags: ["earlier"], labels: ["Earlier work", "Java"],
		keywords: "face recognition recognize detect java opencv javacv computer vision application desktop",
	},
	{
		id: "quiz", title: "Quiz App", cta: "View code", live: false,
		desc: "Java application for taking quizzes.",
		url: "https://github.com/dia8-8/quiz-app", hue: 45, stack: ["Java"],
		tags: ["earlier"], labels: ["Earlier work", "Java"],
		keywords: "quiz app java application questions",
	},
	{
		id: "aspnet", title: "ASP.NET Game", cta: "View code", live: false,
		desc: "A game built with C# and ASP.NET.",
		url: "https://github.com/dia8-8/ASP.NET-game", hue: 120, stack: ["C#", "ASP.NET"],
		tags: ["earlier", "game"], labels: ["Earlier work", "Game", "C#"],
		keywords: "asp.net aspnet game c# csharp dotnet .net play",
	},
	{
		id: "gym", title: "Gym Website", cta: "View code", live: false,
		desc: "Web design for a gym, built in HTML.",
		url: "https://github.com/dia8-8/Gym-Web", hue: 15, stack: ["HTML"],
		tags: ["earlier", "site"], labels: ["Earlier work", "Site", "HTML"],
		keywords: "gym website web design fitness html",
	},
];

/** Skill groups. Levels are deliberately honest. `aliases` are extra words the agents recognise. */
export const skillGroups = [
	{
		group: "Frontend", heading: "Frontend",
		items: [
			{ name: "HTML", aliases: "html5", level: "Basic" },
			{ name: "CSS", aliases: "css3", level: "Basic" },
			{ name: "JavaScript", aliases: "js javascript es6 ecmascript", level: "Basic" },
			{ name: "React", aliases: "react reactjs react.js", level: "Basic" },
			{ name: "Next.js", aliases: "next.js nextjs", level: "Basic" },
			{ name: "jQuery", aliases: "jquery", level: "Basic" },
			{ name: "TypeScript", aliases: "typescript", level: "Basic" },
			{ name: "Tailwind CSS", aliases: "tailwind tailwindcss", level: "Basic" },
			{ name: "Vite", aliases: "vite", level: "Basic" },
		],
	},
	{
		group: "Backend", heading: "Backend, auth & deploy",
		items: [
			{ name: "Node.js", aliases: "node nodejs node.js", level: "Basic" },
			{ name: "Python", aliases: "python", level: "Basic" },
			{ name: "PHP", aliases: "php", level: "Basic" },
			{ name: "MySQL", aliases: "mysql sql", level: "Basic" },
			{ name: "NextAuth", aliases: "nextauth next-auth auth.js", level: "Basic" },
			{ name: "Vercel", aliases: "vercel", level: "Basic" },
			{ name: "Express", aliases: "express expressjs", level: "Basic" },
			{ name: "Prisma", aliases: "prisma", level: "Basic" },
			{ name: "Supabase", aliases: "supabase", level: "Basic" },
		],
	},
	{
		group: "Programming", heading: "Programming",
		items: [
			{ name: "C/C++", aliases: "c++ cpp", level: "Basic" },
			{ name: "Java", aliases: "java", level: "Basic" },
			{ name: "C#", aliases: "c# csharp", level: "Basic" },
			{ name: "Lua", aliases: "lua", level: "Basic" },
		],
	},
	{
		group: "Design", heading: "Design",
		items: [
			{ name: "Adobe Illustrator", label: "Illustrator", aliases: "illustrator", level: "Basic" },
			{ name: "Adobe Photoshop", label: "Photoshop", aliases: "photoshop", level: "Basic" },
		],
	},
	{
		group: "Exploring", heading: "Exploring now", explore: true,
		items: [
			{ name: "LLM APIs", aliases: "llm llms ai genai openai anthropic claude gpt", level: "Exploring" },
			{ name: "AI agents", aliases: "agent agents agentic mcp tool-use", level: "Exploring" },
		],
	},
];

export const skills = skillGroups.flatMap((g) =>
	g.items.map((s) => ({
		...s,
		group: g.group,
		aliases: [...new Set([s.name.toLowerCase(), ...s.aliases.split(" ").filter(Boolean)])],
	}))
);

/** Technologies Adam does NOT list. Agents say so plainly if asked. */
export const NOT_YET = [
	["Vue", ["vue", "vue.js", "vuejs"]],
	["Angular", ["angular"]], ["Svelte", ["svelte"]], ["Redux", ["redux"]], ["GraphQL", ["graphql"]],
	["Sass", ["sass", "scss"]], ["Bootstrap", ["bootstrap"]],
	["MongoDB", ["mongodb", "mongo"]], ["PostgreSQL", ["postgres", "postgresql"]], ["Docker", ["docker"]],
	["Kubernetes", ["kubernetes", "k8s"]], ["AWS", ["aws", "amazon web services"]], ["Azure", ["azure"]],
	["Google Cloud", ["gcp", "google cloud"]], ["CI/CD", ["ci/cd", "cicd", "github actions", "jenkins"]],
	["Automated testing", ["jest", "cypress", "playwright", "vitest", "unit testing", "unit tests"]],
	["Django", ["django"]], ["Flask", ["flask"]], ["Spring", ["spring", "spring boot"]], [".NET", [".net", "asp.net"]],
	["Laravel", ["laravel"]], ["Firebase", ["firebase"]], ["Figma", ["figma"]], ["Ruby", ["ruby", "rails"]],
	["Go", ["golang"]], ["Rust", ["rust"]], ["Swift", ["swift", "swiftui"]], ["Kotlin", ["kotlin"]],
	["Webpack", ["webpack"]],
];

/** Concepts Adam can back with a real project. */
export const CONCEPTS = [
	{ label: "API integration", re: /\b(apis?|rest(ful)?|json|fetch|ajax)\b/i, q: "api" },
	{ label: "Headless CMS", re: /\b(cms|contentful|headless)\b/i, q: "contentful" },
	{ label: "Maps / geolocation", re: /\b(maps?|geolocation|leaflet|mapbox)\b/i, q: "map" },
	{ label: "UI / interface work", re: /\b(ui|ux|user interface|responsive|front-?end|design systems?)\b/i, q: "ui" },
	{ label: "Game logic", re: /\b(games?|gaming)\b/i, q: "game" },
];

export const SECTIONS = {
	agents: "agents", agent: "agents", fit: "fit", work: "work", projects: "work",
	skills: "skills", toolkit: "skills", about: "about", contact: "contact", home: "top", top: "top",
};

export const SAMPLE_JD = `Junior Frontend Developer

We're looking for a motivated junior developer to join our product team.

Requirements:
- Solid HTML, CSS and JavaScript
- Experience with React and Next.js
- Comfortable consuming REST APIs
- Familiarity with Git
- Nice to have: GraphQL, Docker, AWS`;
