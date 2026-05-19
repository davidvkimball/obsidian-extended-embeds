import { requestUrl } from "obsidian";
import type { EmbedProvider, ThemeMode } from "./base";
import type { CacheManager } from "../cache";
import { mastodonIcon } from "./brand-icons";

// Matches /@user/numeric-id on any domain
const MASTODON_PATTERN = /^https?:\/\/([a-zA-Z0-9.-]+)\/@([a-zA-Z0-9_]+)\/(\d+)\/?$/;

interface MastodonStatus {
	content: string;
	created_at: string;
	url: string;
	replies_count: number;
	reblogs_count: number;
	favourites_count: number;
	account: {
		display_name: string;
		acct: string;
		avatar: string;
		url: string;
	};
	media_attachments?: Array<{
		type: string;
		preview_url: string;
		description?: string;
	}>;
}

function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

// Reads a parsed element as plain text: <br> becomes a newline and HTML
// entities are decoded by the parser, so no innerHTML write is needed.
function blockToText(el: Element): string {
	el.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
	return el.textContent ?? "";
}

function htmlToPlainText(html: string): string {
	const doc = new DOMParser().parseFromString(html, "text/html");
	const paragraphs: string[] = [];
	const ps = doc.querySelectorAll("p");
	if (ps.length > 0) {
		ps.forEach((p) => paragraphs.push(blockToText(p)));
	} else {
		// Fallback if no <p> tags
		paragraphs.push(blockToText(doc.body));
	}
	return paragraphs.join("\n\n").trim();
}

export function createMastodonProvider(cache: CacheManager): EmbedProvider {
	return {
		id: "mastodon",
		name: "Mastodon",

		test(url: string): boolean {
			return MASTODON_PATTERN.test(url);
		},

		async render(url: string, container: HTMLElement, theme: ThemeMode): Promise<void> {
			const match = url.match(MASTODON_PATTERN);
			if (!match) return;

			const instance = match[1] ?? "";
			const postId = match[3] ?? "";
			const cacheKey = `mastodon:${instance}/${postId}`;

			container.addClass("extended-embed", "extended-embed-mastodon");

			const loading = container.createDiv("extended-embed-loading");
			loading.setText("Loading post...");

			let status: MastodonStatus | null = null;
			const cached = cache.get<MastodonStatus>(cacheKey);
			if (cached) {
				status = cached;
			} else {
				try {
					// Use the public Mastodon API to fetch the status
					const response = await requestUrl({
						url: `https://${instance}/api/v1/statuses/${postId}`,
						headers: { Accept: "application/json" },
					});
					status = response.json as MastodonStatus;
					cache.set(cacheKey, status);
				} catch {
					loading.setText("Failed to load post");
					loading.addClass("extended-embed-error");
					return;
				}
			}

			if (!status) {
				loading.setText("Failed to load post");
				loading.addClass("extended-embed-error");
				return;
			}

			loading.remove();

			const isDark = theme === "dark";

			const card = container.createDiv({
				cls: `extended-embed-card ${isDark ? "extended-embed-dark" : "extended-embed-light"}`,
			});

			// Header: avatar + display name + handle
			const header = card.createDiv("extended-embed-card-header");
			header.createEl("img", {
				cls: "extended-embed-avatar-small",
				attr: { src: status.account.avatar, alt: status.account.acct, width: "20", height: "20" },
			});
			const nameWrap = header.createSpan("extended-embed-mastodon-author");
			if (status.account.display_name) {
				nameWrap.createSpan({ cls: "extended-embed-mastodon-displayname", text: status.account.display_name });
			}
			nameWrap.createEl("a", {
				cls: "extended-embed-mastodon-handle",
				text: `@${status.account.acct}@${instance}`,
				attr: { href: status.account.url, target: "_blank", rel: "noopener noreferrer" },
			});
			header.appendChild(mastodonIcon());

			// Post content (plain text, not a link)
			const plainText = htmlToPlainText(status.content);
			card.createEl("p", {
				cls: "extended-embed-mastodon-text",
				text: plainText,
			});

			// Media preview (first image only)
			if (status.media_attachments && status.media_attachments.length > 0) {
				const firstMedia = status.media_attachments[0];
				if (firstMedia && firstMedia.type === "image" && firstMedia.preview_url) {
					card.createEl("img", {
						cls: "extended-embed-mastodon-media",
						attr: {
							src: firstMedia.preview_url,
							alt: firstMedia.description ?? "",
							loading: "lazy",
						},
					});
				}
			}

			// Footer: date (permalink) + stats
			const footer = card.createDiv("extended-embed-card-footer");
			footer.createEl("a", {
				text: formatDate(status.created_at),
				attr: { href: status.url, target: "_blank", rel: "noopener noreferrer" },
			});

			if (status.replies_count > 0) {
				footer.createSpan({ cls: "extended-embed-stat", text: `${formatCount(status.replies_count)} replies` });
			}
			if (status.reblogs_count > 0) {
				footer.createSpan({ cls: "extended-embed-stat", text: `${formatCount(status.reblogs_count)} boosts` });
			}
			if (status.favourites_count > 0) {
				footer.createSpan({ cls: "extended-embed-stat", text: `${formatCount(status.favourites_count)} favorites` });
			}
		},
	};
}
