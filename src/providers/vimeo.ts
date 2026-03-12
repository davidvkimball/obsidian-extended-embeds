import type { EmbedProvider, ThemeMode } from "./base";

const VIMEO_PATTERNS = [
	/^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/,
	/^https?:\/\/(?:www\.)?vimeo\.com\/manage\/videos\/(\d+)/,
	/^https?:\/\/player\.vimeo\.com\/video\/(\d+)/,
];

function extractVimeoId(url: string): string | null {
	for (const pattern of VIMEO_PATTERNS) {
		const match = url.match(pattern);
		if (match && match[1]) return match[1];
	}
	return null;
}

export const vimeoProvider: EmbedProvider = {
	id: "vimeo",
	name: "Vimeo",

	test(url: string): boolean {
		return extractVimeoId(url) !== null;
	},

	render(url: string, container: HTMLElement, _theme: ThemeMode): void {
		const videoId = extractVimeoId(url);
		if (!videoId) return;

		const embedUrl = `https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479`;

		container.addClass("extended-embed", "extended-embed-vimeo");

		container.createEl("iframe", {
			attr: {
				src: embedUrl,
				frameborder: "0",
				allow: "autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share",
				allowfullscreen: "",
				referrerpolicy: "strict-origin-when-cross-origin",
				loading: "lazy",
			},
		});
	},
};
