import { requestUrl } from "obsidian";
import type { EmbedProvider, ThemeMode } from "./base";

const BANDCAMP_PATTERN = /([a-zA-Z0-9_-]+)\.bandcamp\.com\/(track|album)\/([a-zA-Z0-9_-]+)/;

export const bandcampProvider: EmbedProvider = {
	id: "bandcamp",
	name: "Bandcamp",

	test(url: string): boolean {
		return BANDCAMP_PATTERN.test(url);
	},

	async render(url: string, container: HTMLElement, theme: ThemeMode): Promise<void> {
		const match = url.match(BANDCAMP_PATTERN);
		if (!match) return;

		const isAlbum = match[2] === "album";

		container.addClass("extended-embed", "extended-embed-bandcamp");

		const loading = container.createDiv("extended-embed-loading");
		loading.setText("Loading embed...");

		// Fetch the Bandcamp page to extract the item_id from structured data
		let itemId: string | null = null;
		try {
			const response = await requestUrl({ url, headers: { Accept: "text/html" } });
			const html = response.text;

			// Bandcamp pages contain JSON-LD with "item_id","value":NUMERIC_ID
			const idMatch = html.match(/"item_id","value":(\d+)/);
			if (idMatch) {
				itemId = idMatch[1] ?? null;
			}
		} catch {
			loading.setText("Failed to load embed");
			loading.addClass("extended-embed-error");
			return;
		}

		if (!itemId) {
			loading.setText("Failed to load embed");
			loading.addClass("extended-embed-error");
			return;
		}

		loading.remove();

		const bgColor = theme === "dark" ? "333333" : "ffffff";
		// Read Obsidian's accent color, falling back to a blue default
		const accent = getComputedStyle(document.body).getPropertyValue("--interactive-accent").trim();
		const linkColor = accent.startsWith("#") ? accent.slice(1) : "0687f5";
		const typeParam = isAlbum ? "album" : "track";
		const embedUrl = `https://bandcamp.com/EmbeddedPlayer/${typeParam}=${itemId}/size=large/bgcol=${bgColor}/linkcol=${linkColor}/tracklist=false/artwork=small/transparent=true/`;

		container.createEl("iframe", {
			attr: {
				src: embedUrl,
				frameborder: "0",
				seamless: "",
				loading: "lazy",
				style: "height: 120px",
			},
		});
	},
};
