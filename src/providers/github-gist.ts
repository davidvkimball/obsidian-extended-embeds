import { requestUrl, setIcon } from "obsidian";
import type { EmbedProvider, ThemeMode } from "./base";
import type { CacheManager } from "../cache";

const GIST_PATTERN = /gist\.github\.com\/([a-zA-Z0-9_-]+)\/([a-f0-9]+)/;

interface GistFile {
	filename: string;
	language: string | null;
	content: string;
	truncated: boolean;
}

interface GistData {
	id: string;
	html_url: string;
	description: string | null;
	owner: {
		login: string;
		avatar_url: string;
	} | null;
	files: Record<string, GistFile>;
	created_at: string;
}

export function createGithubGistProvider(cache: CacheManager, token: string): EmbedProvider {
	return {
		id: "github-gist",
		name: "GitHub Gist",

		test(url: string): boolean {
			return GIST_PATTERN.test(url);
		},

		async render(url: string, container: HTMLElement, theme: ThemeMode): Promise<void> {
			const match = url.match(GIST_PATTERN);
			if (!match) return;

			const [, , gistId] = match;
			const cacheKey = `gist:${gistId}`;

			container.addClass("extended-embed", "extended-embed-gist");

			const loading = container.createDiv("extended-embed-loading");
			loading.setText("Loading gist...");

			let data: GistData | null = null;
			const cached = cache.get<GistData>(cacheKey);
			if (cached) {
				data = cached;
			} else {
				try {
					const headers: Record<string, string> = {
						Accept: "application/vnd.github.v3+json",
					};
					if (token) {
						headers.Authorization = `Bearer ${token}`;
					}

					const response = await requestUrl({
						url: `https://api.github.com/gists/${gistId}`,
						headers,
					});
					data = response.json as GistData;
					cache.set(cacheKey, data);
				} catch {
					loading.setText("Failed to load gist");
					loading.addClass("extended-embed-error");
					return;
				}
			}

			loading.remove();

			const isDark = theme === "dark";
			const files = Object.values(data.files);

			const card = container.createDiv({
				cls: `extended-embed-card extended-embed-gist-card ${isDark ? "extended-embed-dark" : "extended-embed-light"}`,
			});

			// Header: owner info + gist icon (owner name is clickable)
			const header = card.createDiv("extended-embed-card-header");
			const gistIcon = header.createSpan("extended-embed-stat-icon");
			setIcon(gistIcon, "code");

			if (data.owner) {
				header.createEl("img", {
					cls: "extended-embed-avatar",
					attr: { src: data.owner.avatar_url, alt: data.owner.login, width: "20", height: "20" },
				});
				header.createEl("a", {
					cls: "extended-embed-gist-owner",
					text: data.owner.login,
					attr: { href: `https://github.com/${data.owner.login}`, target: "_blank", rel: "noopener noreferrer" },
				});
			}

			// Gist title (description or fallback) - links to the gist
			const gistTitle = data.description || Object.keys(data.files)[0] || "View gist";
			card.createEl("a", {
				cls: "extended-embed-gist-title",
				text: gistTitle,
				attr: { href: data.html_url, target: "_blank", rel: "noopener noreferrer" },
			});

			// File previews (show first 2 files, max 12 lines each)
			const maxFiles = 2;
			const maxLines = 12;

			for (const file of files.slice(0, maxFiles)) {
				const fileBlock = card.createDiv("extended-embed-gist-file");

				const fileHeader = fileBlock.createDiv("extended-embed-gist-file-header");
				const fileIcon = fileHeader.createSpan("extended-embed-stat-icon");
				setIcon(fileIcon, "file-text");
				fileHeader.createSpan({ text: file.filename, cls: "extended-embed-gist-filename" });

				// Code preview
				const lines = file.content.split("\n");
				const preview = lines.slice(0, maxLines).join("\n");
				const truncated = lines.length > maxLines || file.truncated;

				const pre = fileBlock.createEl("pre", { cls: "extended-embed-gist-code" });
				const code = pre.createEl("code");
				code.setText(preview + (truncated ? "\n..." : ""));
			}

			// Footer: file count
			if (files.length > maxFiles) {
				card.createEl("p", {
					cls: "extended-embed-subtitle",
					text: `+${files.length - maxFiles} more file${files.length - maxFiles > 1 ? "s" : ""}`,
				});
			}
		},
	};
}
