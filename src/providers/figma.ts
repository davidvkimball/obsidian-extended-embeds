import type { EmbedProvider, ThemeMode } from "./base";

const FIGMA_PATTERN = /figma\.com\/(file|proto|design|board|slides|deck)\/([a-zA-Z0-9]+)/;

export const figmaProvider: EmbedProvider = {
	id: "figma",
	name: "Figma",

	test(url: string): boolean {
		return FIGMA_PATTERN.test(url);
	},

	render(url: string, container: HTMLElement, _theme: ThemeMode): void {
		const match = url.match(FIGMA_PATTERN);
		if (!match) return;

		const embedUrl = `https://www.figma.com/embed?embed_host=obsidian&url=${encodeURIComponent(url)}`;

		container.addClass("extended-embed", "extended-embed-figma");

		container.createEl("iframe", {
			attr: {
				src: embedUrl,
				frameborder: "0",
				allowfullscreen: "",
				loading: "lazy",
			},
		});
	},
};
