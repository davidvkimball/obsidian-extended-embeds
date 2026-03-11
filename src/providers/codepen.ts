import type { EmbedProvider, ThemeMode } from "./base";

const CODEPEN_PATTERN = /codepen\.io\/([a-zA-Z0-9_-]+)\/(?:pen|full|details)\/([a-zA-Z0-9]+)/;

export const codepenProvider: EmbedProvider = {
	id: "codepen",
	name: "CodePen",

	test(url: string): boolean {
		return CODEPEN_PATTERN.test(url);
	},

	render(url: string, container: HTMLElement, theme: ThemeMode): void {
		const match = url.match(CODEPEN_PATTERN);
		if (!match) return;

		const [, user, penId] = match;
		const themeParam = theme === "dark" ? "dark" : "light";
		const embedUrl = `https://codepen.io/${user}/embed/${penId}?default-tab=result&editable=true&theme-id=${themeParam}`;

		container.addClass("extended-embed", "extended-embed-codepen");

		container.createEl("iframe", {
			attr: {
				src: embedUrl,
				frameborder: "0",
				allowfullscreen: "",
				allow: "autoplay; clipboard-write; encrypted-media",
				loading: "lazy",
				scrolling: "no",
			},
		});
	},
};
