import type { EmbedProvider, ThemeMode } from "./base";

const SPOTIFY_PATTERN = /open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/;
const SPOTIFY_PODCAST_PATTERN = /(podcasters|creators)\.spotify\.com\/pod\/(show|profile)\/([^/]+)\/(embed\/)?episodes\/([^/]+)\/([^/?#]+)/;

function isPodcastUrl(url: string): boolean {
	return SPOTIFY_PODCAST_PATTERN.test(url);
}

function getPodcastEmbedUrl(url: string): string {
	// If the URL already contains /embed/, use it as-is (swapping domain to podcasters if needed)
	if (url.includes("/embed/")) {
		return url.replace(/^https?:\/\/(creators|podcasters)\.spotify\.com/, "https://podcasters.spotify.com");
	}

	// Convert creators.spotify.com/pod/profile/{user}/episodes/{slug}/{id}
	// to https://podcasters.spotify.com/pod/show/{user}/embed/episodes/{slug}/{id}
	const match = url.match(SPOTIFY_PODCAST_PATTERN);
	if (!match) return url;

	const [, , , user, , slug, id] = match;
	return `https://podcasters.spotify.com/pod/show/${user}/embed/episodes/${slug}/${id}`;
}

export const spotifyProvider: EmbedProvider = {
	id: "spotify",
	name: "Spotify",

	test(url: string): boolean {
		return SPOTIFY_PATTERN.test(url) || isPodcastUrl(url);
	},

	render(url: string, container: HTMLElement, theme: ThemeMode): void {
		container.addClass("extended-embed", "extended-embed-spotify");

		if (isPodcastUrl(url)) {
			const embedUrl = getPodcastEmbedUrl(url);

			container.createEl("iframe", {
				attr: {
					src: embedUrl,
					frameborder: "0",
					allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
					loading: "lazy",
					scrolling: "no",
				style: "height: 102px; overflow: hidden",
				},
			});
			return;
		}

		const match = url.match(SPOTIFY_PATTERN);
		if (!match) return;

		const [, type, id] = match;
		const themeParam = theme === "dark" ? "&theme=0" : "";
		const embedUrl = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator${themeParam}`;

		const isCompact = type === "track";

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
