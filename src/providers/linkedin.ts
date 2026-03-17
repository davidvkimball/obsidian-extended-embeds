import type { EmbedProvider, ThemeMode } from "./base";

const LINKEDIN_PATTERN = /linkedin\.com\/(?:posts\/.*?(activity)-|feed\/update\/urn:li:(share):)([0-9]+)/;

export const linkedinProvider: EmbedProvider = {
	id: "linkedin",
	name: "LinkedIn",

	test(url: string): boolean {
		return LINKEDIN_PATTERN.test(url);
	},

	render(url: string, container: HTMLElement, theme: ThemeMode): void {
		const match = url.match(LINKEDIN_PATTERN);
		if (!match) return;

		const [, activityType, shareType, id] = match;
		const type = activityType || shareType;
		const embedUrl = `https://www.linkedin.com/embed/feed/update/urn:li:${type}:${id}`;

		container.addClass("extended-embed", "extended-embed-linkedin");

		container.createEl("iframe", {
			attr: {
				src: embedUrl,
				height: "512",
				width: "504",
				frameborder: "0",
				allowfullscreen: "",
				title: "Embedded post",
				loading: "lazy",
			},
		});
	},
};
