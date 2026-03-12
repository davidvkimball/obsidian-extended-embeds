import { requestUrl } from "obsidian";
import type { EmbedProvider, ThemeMode } from "./base";
import type { CacheManager } from "../cache";
import { blueskyIcon } from "./brand-icons";

const BLUESKY_PATTERN = /^https?:\/\/bsky\.app\/profile\/([a-zA-Z0-9._:-]+)\/post\/([a-zA-Z0-9]+)\/?$/;

interface BlueskyAuthor {
	handle: string;
	displayName?: string;
	avatar?: string;
}

interface BlueskyEmbed {
	$type: string;
	images?: Array<{
		thumb: string;
		alt: string;
	}>;
	external?: {
		uri: string;
		title: string;
		thumb?: string;
	};
}

interface BlueskyPost {
	uri: string;
	author: BlueskyAuthor;
	record: {
		text: string;
		createdAt: string;
		embed?: BlueskyEmbed;
	};
	embed?: {
		$type: string;
		images?: Array<{
			thumb: string;
			alt: string;
		}>;
	};
	likeCount?: number;
	repostCount?: number;
	replyCount?: number;
}

function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

export function createBlueskyProvider(cache: CacheManager): EmbedProvider {
	return {
		id: "bluesky",
		name: "Bluesky",

		test(url: string): boolean {
			return BLUESKY_PATTERN.test(url);
		},

		async render(url: string, container: HTMLElement, theme: ThemeMode): Promise<void> {
			const match = url.match(BLUESKY_PATTERN);
			if (!match) return;

			const handle = match[1] ?? "";
			const postId = match[2] ?? "";
			const cacheKey = `bluesky:${handle}/${postId}`;

			container.addClass("extended-embed", "extended-embed-bluesky");

			const loading = container.createDiv("extended-embed-loading");
			loading.setText("Loading post...");

			let post: BlueskyPost | null = null;
			const cached = cache.get<BlueskyPost>(cacheKey);
			if (cached) {
				post = cached;
			} else {
				try {
					// Resolve handle to DID first, then fetch post
					const profileRes = await requestUrl({
						url: `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
					});
					const did = (profileRes.json as { did: string }).did;
					const atUri = `at://${did}/app.bsky.feed.post/${postId}`;

					const postRes = await requestUrl({
						url: `https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?uris=${encodeURIComponent(atUri)}`,
					});
					const posts = (postRes.json as { posts: Array<{ uri: string; author: BlueskyAuthor; record: { text: string; createdAt: string }; likeCount?: number; repostCount?: number; replyCount?: number }> }).posts;
					if (posts.length > 0) {
						const p = posts[0];
						if (p) {
							post = p as BlueskyPost;
							cache.set(cacheKey, post);
						}
					}
				} catch {
					loading.setText("Failed to load post");
					loading.addClass("extended-embed-error");
					return;
				}
			}

			if (!post) {
				loading.setText("Failed to load post");
				loading.addClass("extended-embed-error");
				return;
			}

			loading.remove();

			const isDark = theme === "dark";

			const card = container.createDiv({
				cls: `extended-embed-card ${isDark ? "extended-embed-dark" : "extended-embed-light"}`,
			});

			// Header: avatar + display name + handle + brand icon
			const header = card.createDiv("extended-embed-card-header");
			if (post.author.avatar) {
				header.createEl("img", {
					cls: "extended-embed-avatar-small",
					attr: { src: post.author.avatar, alt: post.author.handle, width: "20", height: "20" },
				});
			}
			const nameWrap = header.createSpan("extended-embed-bluesky-author");
			if (post.author.displayName) {
				nameWrap.createSpan({ cls: "extended-embed-bluesky-displayname", text: post.author.displayName });
			}
			nameWrap.createEl("a", {
				cls: "extended-embed-bluesky-handle",
				text: `@${post.author.handle}`,
				attr: { href: `https://bsky.app/profile/${post.author.handle}`, target: "_blank", rel: "noopener noreferrer" },
			});
			header.appendChild(blueskyIcon());

			// Post text (plain, not a link)
			card.createEl("p", {
				cls: "extended-embed-bluesky-text",
				text: post.record.text,
			});

			// Image embed (if present)
			const images = post.embed?.images;
			if (images && images.length > 0) {
				const firstImage = images[0];
				if (firstImage) {
					card.createEl("img", {
						cls: "extended-embed-bluesky-media",
						attr: {
							src: firstImage.thumb,
							alt: firstImage.alt || "",
							loading: "lazy",
						},
					});
				}
			}

			// Footer: date (permalink) + stats
			const footer = card.createDiv("extended-embed-card-footer");
			footer.createEl("a", {
				text: formatDate(post.record.createdAt),
				attr: { href: url, target: "_blank", rel: "noopener noreferrer" },
			});

			if (post.replyCount != null && post.replyCount > 0) {
				footer.createSpan({ cls: "extended-embed-stat", text: `${formatCount(post.replyCount)} replies` });
			}
			if (post.repostCount != null && post.repostCount > 0) {
				footer.createSpan({ cls: "extended-embed-stat", text: `${formatCount(post.repostCount)} reposts` });
			}
			if (post.likeCount != null && post.likeCount > 0) {
				footer.createSpan({ cls: "extended-embed-stat", text: `${formatCount(post.likeCount)} likes` });
			}
		},
	};
}
