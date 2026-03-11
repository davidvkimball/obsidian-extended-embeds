import type { EmbedProvider, ThemeMode } from "./base";

const YOUTUBE_PATTERNS = [
	/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
];

function extractVideoId(url: string): string | null {
	for (const pattern of YOUTUBE_PATTERNS) {
		const match = url.match(pattern);
		if (match?.[1]) return match[1];
	}
	return null;
}

function extractTimestamp(url: string): number | null {
	const match = url.match(/[?&]t=(\d+)/);
	return match?.[1] ? parseInt(match[1], 10) : null;
}

export const youtubeProvider: EmbedProvider = {
	id: "youtube",
	name: "YouTube",

	test(url: string): boolean {
		return extractVideoId(url) !== null;
	},

	render(url: string, container: HTMLElement, _theme: ThemeMode): void {
		const videoId = extractVideoId(url);
		if (!videoId) return;

		const timestamp = extractTimestamp(url);
		let embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
		if (timestamp !== null) {
			embedUrl += `?start=${timestamp}`;
		}

		const isShort = url.includes("/shorts/");

		container.addClass("extended-embed", "extended-embed-youtube");

		const iframe = container.createEl("iframe", {
			attr: {
				src: embedUrl,
				frameborder: "0",
				allowfullscreen: "",
				allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
				loading: "lazy",
			},
		});

		if (isShort) {
			iframe.addClass("extended-embed-youtube-short");
		}
	},
};
