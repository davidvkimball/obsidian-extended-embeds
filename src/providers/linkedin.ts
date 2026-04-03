import type { EmbedProvider, ThemeMode } from "./base";

const LINKEDIN_PATTERN = /linkedin\.com\/(?:embed\/)?(?:posts\/.*?(activity)-|feed\/update\/urn:li:(share|activity|ugcPost):)([0-9]+)/;

export const linkedinProvider: EmbedProvider = {
	id: "linkedin",
	name: "LinkedIn",

	test(url: string): boolean {
		return LINKEDIN_PATTERN.test(url);
	},

	render(url: string, container: HTMLElement, theme: ThemeMode): void {
		const match = url.match(LINKEDIN_PATTERN);
		if (!match) return;

		const [, activityType, urnType, id] = match;
		const type = activityType || urnType;

		let embedUrl: string;
		let search = "";
		try {
			const urlObj = new URL(url);
			search = urlObj.search;
			if (urlObj.pathname.includes("/embed/feed/update/")) {
				embedUrl = `${urlObj.origin}${urlObj.pathname}${urlObj.search}`;
			} else {
				embedUrl = `https://www.linkedin.com/embed/feed/update/urn:li:${type}:${id}${search}`;
			}
		} catch {
			embedUrl = `https://www.linkedin.com/embed/feed/update/urn:li:${type}:${id}`;
		}

		const liMode = search.includes("compact=1")
			? "compact"
			: search.includes("collapsed=1")
				? "collapsed"
				: "full";

		container.addClass("extended-embed", "extended-embed-linkedin");
		container.setAttribute("data-li-mode", liMode);

		container.createEl("iframe", {
			attr: {
				src: embedUrl,
				style: "border:none",
				frameborder: "0",
				allowfullscreen: "",
				title: "Embedded post",
				loading: "lazy",
			},
		});
	},
};
