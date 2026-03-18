import type { EmbedProvider, ThemeMode } from "./base";

const STEAM_APP_PATTERN = /store\.steampowered\.com\/app\/(\d+)/;
const STEAM_BUNDLE_PATTERN = /store\.steampowered\.com\/bundle\/(\d+)/;
const STEAM_SUB_PATTERN = /store\.steampowered\.com\/sub\/(\d+)/;

function getSteamEmbedUrl(url: string): string | null {
	let match = url.match(STEAM_APP_PATTERN);
	if (match) return `https://store.steampowered.com/widget/${match[1]}/`;

	match = url.match(STEAM_BUNDLE_PATTERN);
	if (match) return `https://store.steampowered.com/widget/bundle/${match[1]}/`;

	match = url.match(STEAM_SUB_PATTERN);
	if (match) return `https://store.steampowered.com/widget/${match[1]}/`;

	return null;
}

export const steamProvider: EmbedProvider = {
	id: "steam",
	name: "Steam",

	test(url: string): boolean {
		return STEAM_APP_PATTERN.test(url) || STEAM_BUNDLE_PATTERN.test(url) || STEAM_SUB_PATTERN.test(url);
	},

	render(url: string, container: HTMLElement, _theme: ThemeMode): void {
		const embedUrl = getSteamEmbedUrl(url);
		if (!embedUrl) return;

		container.addClass("extended-embed", "extended-embed-steam");

		container.createEl("iframe", {
			attr: {
				src: embedUrl,
				frameborder: "0",
				loading: "lazy",
				style: "height: 190px",
			},
		});
	},
};
