import { requestUrl, setIcon } from "obsidian";
import type { EmbedProvider, ThemeMode } from "./base";
import type { CacheManager } from "../cache";

const REPO_PATTERN = /^https?:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)\/?$/;

interface RepoData {
	full_name: string;
	description: string | null;
	stargazers_count: number;
	forks_count: number;
	language: string | null;
	owner: {
		avatar_url: string;
		login: string;
	};
	html_url: string;
	topics: string[];
}

function formatCount(n: number): string {
	if (n >= 1000) {
		return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
	}
	return String(n);
}

// Language colors from GitHub
const LANGUAGE_COLORS: Record<string, string> = {
	JavaScript: "#f1e05a",
	TypeScript: "#3178c6",
	Python: "#3572A5",
	Java: "#b07219",
	Go: "#00ADD8",
	Rust: "#dea584",
	Ruby: "#701516",
	PHP: "#4F5D95",
	"C#": "#178600",
	"C++": "#f34b7d",
	C: "#555555",
	Swift: "#F05138",
	Kotlin: "#A97BFF",
	Dart: "#00B4AB",
	Shell: "#89e051",
	HTML: "#e34c26",
	CSS: "#563d7c",
	Vue: "#41b883",
	Svelte: "#ff3e00",
	Astro: "#ff5a03",
	Lua: "#000080",
	Zig: "#ec915c",
};

export function createGithubRepoProvider(cache: CacheManager, token: string): EmbedProvider {
	return {
		id: "github-repo",
		name: "GitHub repository",

		test(url: string): boolean {
			return REPO_PATTERN.test(url);
		},

		async render(url: string, container: HTMLElement, theme: ThemeMode): Promise<void> {
			const match = url.match(REPO_PATTERN);
			if (!match) return;

			const [, owner, repo] = match;
			const cacheKey = `github-repo:${owner}/${repo}`;

			container.addClass("extended-embed", "extended-embed-github-repo");

			// Show loading state
			const loading = container.createDiv("extended-embed-loading");
			loading.setText("Loading repository...");

			let data: RepoData | null = null;
			const cached = cache.get<RepoData>(cacheKey);
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
						url: `https://api.github.com/repos/${owner}/${repo}`,
						headers,
					});
					data = response.json as RepoData;
					cache.set(cacheKey, data);
				} catch {
					loading.setText("Failed to load repository");
					loading.addClass("extended-embed-error");
					return;
				}
			}

			loading.remove();

			const isDark = theme === "dark";

			// Build the card
			const card = container.createDiv({
				cls: `extended-embed-card ${isDark ? "extended-embed-dark" : "extended-embed-light"}`,
			});

			// Header: avatar + repo name (name is clickable)
			const header = card.createDiv("extended-embed-card-header");
			header.createEl("img", {
				cls: "extended-embed-avatar",
				attr: { src: data.owner.avatar_url, alt: data.owner.login, width: "20", height: "20" },
			});
			header.createEl("a", {
				cls: "extended-embed-repo-name",
				text: data.full_name,
				attr: { href: data.html_url, target: "_blank", rel: "noopener noreferrer" },
			});

			// Description
			if (data.description) {
				card.createEl("p", { cls: "extended-embed-description", text: data.description });
			}

			// Footer: language + stars + forks
			const footer = card.createDiv("extended-embed-card-footer");

			if (data.language) {
				const langEl = footer.createSpan("extended-embed-language");
				const color = LANGUAGE_COLORS[data.language] ?? "#8b949e";
				langEl.createSpan({
					cls: "extended-embed-lang-dot",
					attr: { style: `background-color: ${color}` },
				});
				langEl.createSpan({ text: data.language });
			}

			if (data.stargazers_count > 0) {
				const stars = footer.createSpan("extended-embed-stat");
				const starIcon = stars.createSpan("extended-embed-stat-icon");
				setIcon(starIcon, "star");
				stars.createSpan({ text: formatCount(data.stargazers_count) });
			}

			if (data.forks_count > 0) {
				const forks = footer.createSpan("extended-embed-stat");
				const forkIcon = forks.createSpan("extended-embed-stat-icon");
				setIcon(forkIcon, "git-fork");
				forks.createSpan({ text: formatCount(data.forks_count) });
			}
		},
	};
}
