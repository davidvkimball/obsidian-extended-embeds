import { requestUrl } from "obsidian";
import type { EmbedProvider, ThemeMode } from "./base";
import type { CacheManager } from "../cache";

const ISSUE_PATTERN = /^https?:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)\/(issues|pull)\/(\d+)\/?$/;

interface IssueData {
	title: string;
	number: number;
	state: string;
	html_url: string;
	user: {
		login: string;
		avatar_url: string;
	};
	labels: Array<{
		name: string;
		color: string;
	}>;
	created_at: string;
	pull_request?: { merged_at: string | null };
}

function getStateInfo(data: IssueData, isPR: boolean): { label: string; cls: string } {
	if (isPR && data.pull_request?.merged_at) {
		return { label: "Merged", cls: "extended-embed-state-merged" };
	}
	if (data.state === "open") {
		return { label: "Open", cls: "extended-embed-state-open" };
	}
	return { label: "Closed", cls: "extended-embed-state-closed" };
}

function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function createGithubIssueProvider(cache: CacheManager, token: string): EmbedProvider {
	return {
		id: "github-issue",
		name: "GitHub issue/PR",

		test(url: string): boolean {
			return ISSUE_PATTERN.test(url);
		},

		async render(url: string, container: HTMLElement, theme: ThemeMode): Promise<void> {
			const match = url.match(ISSUE_PATTERN);
			if (!match) return;

			const [, owner, repo, type, number] = match;
			const isPR = type === "pull";
			const apiPath = isPR ? "pulls" : "issues";
			const cacheKey = `github-issue:${owner}/${repo}/${number}`;

			container.addClass("extended-embed", "extended-embed-github-issue");

			const loading = container.createDiv("extended-embed-loading");
			loading.setText(`Loading ${isPR ? "pull request" : "issue"}...`);

			let data: IssueData | null = null;
			const cached = cache.get<IssueData>(cacheKey);
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
						url: `https://api.github.com/repos/${owner}/${repo}/${apiPath}/${number}`,
						headers,
					});
					data = response.json as IssueData;
					cache.set(cacheKey, data);
				} catch {
					loading.setText(`Failed to load ${isPR ? "pull request" : "issue"}`);
					loading.addClass("extended-embed-error");
					return;
				}
			}

			loading.remove();

			const isDark = theme === "dark";
			const stateInfo = getStateInfo(data, isPR);

			const card = container.createDiv({
				cls: `extended-embed-card ${isDark ? "extended-embed-dark" : "extended-embed-light"}`,
			});

			// Header: state badge + title (title is clickable)
			const header = card.createDiv("extended-embed-card-header");
			header.createSpan({
				cls: `extended-embed-state-badge ${stateInfo.cls}`,
				text: stateInfo.label,
			});
			header.createEl("a", {
				cls: "extended-embed-issue-title",
				text: data.title,
				attr: { href: data.html_url, target: "_blank", rel: "noopener noreferrer" },
			});

			// Subtitle: repo + number
			card.createEl("p", {
				cls: "extended-embed-subtitle",
				text: `${owner}/${repo} #${data.number}`,
			});

			// Footer: labels + author + date
			const footer = card.createDiv("extended-embed-card-footer");

			if (data.labels.length > 0) {
				const labelsEl = footer.createSpan("extended-embed-labels");
				for (const label of data.labels.slice(0, 3)) {
					labelsEl.createSpan({
						cls: "extended-embed-label",
						text: label.name,
						attr: {
							style: `background-color: #${label.color}; color: ${isLightColor(label.color) ? "#000" : "#fff"}`,
						},
					});
				}
			}

			const meta = footer.createSpan("extended-embed-meta");
			meta.createEl("img", {
				cls: "extended-embed-avatar-small",
				attr: { src: data.user.avatar_url, alt: data.user.login, width: "16", height: "16" },
			});
			meta.createSpan({ text: `${data.user.login} on ${formatDate(data.created_at)}` });
		},
	};
}

function isLightColor(hex: string): boolean {
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.5;
}
