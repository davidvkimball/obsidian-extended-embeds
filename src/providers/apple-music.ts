import type { EmbedProvider, ThemeMode } from "./base";

const APPLE_MUSIC_PATTERN = /music\.apple\.com\/([a-z]{2})\/(album|playlist|song|music-video|station)\/([^?#]+)/;

export const appleMusicProvider: EmbedProvider = {
	id: "apple-music",
	name: "Apple Music",

	test(url: string): boolean {
		return APPLE_MUSIC_PATTERN.test(url);
	},

	render(url: string, container: HTMLElement, theme: ThemeMode): void {
		const match = url.match(APPLE_MUSIC_PATTERN);
		if (!match) return;

		// Convert music.apple.com URL to embed.music.apple.com
		const embedUrl = url.replace("music.apple.com", "embed.music.apple.com");
		const themeParam = theme === "dark" ? "" : "&l=en-US";

		const type = match[2];
		const isSingle = type === "song" || url.includes("?i=");

		container.addClass("extended-embed", "extended-embed-apple-music");

		container.createEl("iframe", {
			attr: {
				src: `${embedUrl}${themeParam}`,
				frameborder: "0",
				allow: "autoplay *; encrypted-media *; fullscreen *; clipboard-write",
				sandbox: "allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation",
				loading: "lazy",
				style: `height: ${isSingle ? "175px" : "450px"}`,
			},
		});
	},
};
