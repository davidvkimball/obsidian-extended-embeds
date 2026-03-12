import { requestUrl } from "obsidian";
import type { EmbedProvider, ThemeMode } from "./base";
import type { CacheManager } from "../cache";

interface OGData {
	title: string;
	description: string;
	image: string;
	favicon: string;
	siteName: string;
	url: string;
}

/**
 * Extracts Open Graph metadata by fetching the page HTML.
 * This is the fallback provider for URLs that don't match any specific provider.
 */
async function fetchOGData(url: string): Promise<OGData> {
	const response = await requestUrl({
		url,
		headers: { Accept: "text/html" },
	});

	const html = response.text;
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");

	function getMeta(property: string): string {
		const el = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
		return el?.getAttribute("content") ?? "";
	}

	const parsedUrl = new URL(url);

	return {
		title: getMeta("og:title") || doc.querySelector("title")?.textContent || parsedUrl.hostname,
		description: getMeta("og:description") || getMeta("description"),
		image: getMeta("og:image"),
		favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=32`,
		siteName: getMeta("og:site_name") || parsedUrl.hostname,
		url,
	};
}

export function createOpenGraphProvider(cache: CacheManager): EmbedProvider {
	return {
		id: "opengraph",
		name: "Generic URL preview",

		test(url: string): boolean {
			try {
				const parsed = new URL(url);
				return parsed.protocol === "http:" || parsed.protocol === "https:";
			} catch {
				return false;
			}
		},

		async render(url: string, container: HTMLElement, theme: ThemeMode): Promise<void> {
			const cacheKey = `og:${url}`;

			container.addClass("extended-embed", "extended-embed-opengraph");

			const loading = container.createDiv("extended-embed-loading");
			loading.setText("Loading preview...");

			let data: OGData | null = null;
			const cached = cache.get<OGData>(cacheKey);
			if (cached) {
				data = cached;
			} else {
				try {
					data = await fetchOGData(url);
					cache.set(cacheKey, data);
				} catch {
					loading.setText("Failed to load preview");
					loading.addClass("extended-embed-error");
					return;
				}
			}

			loading.remove();

			const isDark = theme === "dark";

			const card = container.createDiv({
				cls: `extended-embed-card extended-embed-og-card ${isDark ? "extended-embed-dark" : "extended-embed-light"}`,
			});

			// Image (if available, clickable) - side by side with body
			if (data.image) {
				const imageLink = card.createEl("a", {
					cls: "extended-embed-og-image-link",
					attr: { href: data.url, target: "_blank" },
				});
				imageLink.createEl("img", {
					cls: "extended-embed-og-image",
					attr: { src: data.image, alt: data.title, loading: "lazy" },
				});
			}

			const body = card.createDiv("extended-embed-og-body");

			// Site name with favicon
			const siteRow = body.createDiv("extended-embed-og-site");
			siteRow.createEl("img", {
				cls: "extended-embed-favicon",
				attr: { src: data.favicon, alt: "", width: "16", height: "16" },
			});
			siteRow.createSpan({ text: data.siteName });

			// Title (clickable)
			body.createEl("a", {
				cls: "extended-embed-og-title",
				text: data.title,
				attr: { href: data.url, target: "_blank" },
			});

			// Description
			if (data.description) {
				const desc = data.description.length > 160
					? data.description.substring(0, 160) + "..."
					: data.description;
				body.createEl("p", { cls: "extended-embed-og-desc", text: desc });
			}
		},
	};
}
