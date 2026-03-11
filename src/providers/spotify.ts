import type { EmbedProvider, ThemeMode } from "./base";

const SPOTIFY_PATTERN = /open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/;

export const spotifyProvider: EmbedProvider = {
	id: "spotify",
	name: "Spotify",

	test(url: string): boolean {
		return SPOTIFY_PATTERN.test(url);
	},

	render(url: string, container: HTMLElement, theme: ThemeMode): void {
		const match = url.match(SPOTIFY_PATTERN);
		if (!match) return;

		const [, type, id] = match;
		const themeParam = theme === "dark" ? "&theme=0" : "";
		const embedUrl = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator${themeParam}`;

		const isCompact = type === "track";

		container.addClass("extended-embed", "extended-embed-spotify");

		container.createEl("iframe", {
			attr: {
				src: embedUrl,
				frameborder: "0",
				allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
				loading: "lazy",
				style: `height: ${isCompact ? "152px" : "352px"}`,
			},
		});
	},
};
