import { requestUrl } from "obsidian";
import type { EmbedProvider, ThemeMode } from "./base";
import type { CacheManager } from "../cache";
import { redditIcon } from "./brand-icons";

const REDDIT_PATTERN = /^https?:\/\/(?:www\.|old\.|np\.)?reddit\.com\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)/;

interface RedditPost {
	title: string;
	selftext: string;
	author: string;
	subreddit_name_prefixed: string;
	score: number;
	num_comments: number;
	permalink: string;
	created_utc: number;
	link_flair_text?: string;
	is_self: boolean;
	thumbnail?: string;
	url?: string;
}

function formatCount(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

function formatDate(utc: number): string {
	const d = new Date(utc * 1000);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function createRedditProvider(cache: CacheManager): EmbedProvider {
	return {
		id: "reddit",
		name: "Reddit",

		test(url: string): boolean {
			return REDDIT_PATTERN.test(url);
		},

		async render(url: string, container: HTMLElement, theme: ThemeMode): Promise<void> {
			const match = url.match(REDDIT_PATTERN);
			if (!match) return;

			const subreddit = match[1] ?? "";
			const postId = match[2] ?? "";
			const cacheKey = `reddit:${subreddit}/${postId}`;

			container.addClass("extended-embed", "extended-embed-reddit");

			const loading = container.createDiv("extended-embed-loading");
			loading.setText("Loading post...");

			let post: RedditPost | null = null;
			const cached = cache.get<RedditPost>(cacheKey);
			if (cached) {
				post = cached;
			} else {
				try {
					const response = await requestUrl({
						url: `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`,
						headers: { Accept: "application/json" },
					});
					const listing = response.json as Array<{ data: { children: Array<{ data: RedditPost }> } }>;
					const firstChild = listing[0]?.data?.children[0]?.data;
					if (firstChild) {
						post = firstChild;
						cache.set(cacheKey, post);
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
			const postUrl = `https://www.reddit.com${post.permalink}`;

			const card = container.createDiv({
				cls: `extended-embed-card ${isDark ? "extended-embed-dark" : "extended-embed-light"}`,
			});

			// Header: subreddit + author + date
			const header = card.createDiv("extended-embed-card-header");
			header.createEl("a", {
				cls: "extended-embed-reddit-subreddit",
				text: post.subreddit_name_prefixed,
				attr: { href: `https://www.reddit.com/${post.subreddit_name_prefixed}/`, target: "_blank", rel: "noopener noreferrer" },
			});
			const meta = header.createSpan({ cls: "extended-embed-reddit-meta" });
			meta.appendText("Posted by ");
			meta.createEl("a", {
				cls: "extended-embed-reddit-author-link",
				text: `u/${post.author}`,
				attr: { href: `https://www.reddit.com/user/${post.author}/`, target: "_blank", rel: "noopener noreferrer" },
			});
			meta.appendText(` on ${formatDate(post.created_utc)}`);
			header.appendChild(redditIcon());

			// Flair badge
			if (post.link_flair_text) {
				header.createSpan({
					cls: "extended-embed-reddit-flair",
					text: post.link_flair_text,
				});
			}

			// Title (clickable)
			card.createEl("a", {
				cls: "extended-embed-reddit-title",
				text: post.title,
				attr: { href: postUrl, target: "_blank", rel: "noopener noreferrer" },
			});

			// Body text (truncated for self posts)
			if (post.is_self && post.selftext) {
				const truncated = post.selftext.length > 300
					? post.selftext.substring(0, 300) + "..."
					: post.selftext;
				card.createEl("p", {
					cls: "extended-embed-reddit-body",
					text: truncated,
				});
			}

			// Footer: score + comments
			const footer = card.createDiv("extended-embed-card-footer");
			footer.createSpan({
				cls: "extended-embed-stat",
				text: `${formatCount(post.score)} upvotes`,
			});
			footer.createSpan({
				cls: "extended-embed-stat",
				text: `${formatCount(post.num_comments)} comments`,
			});
		},
	};
}
