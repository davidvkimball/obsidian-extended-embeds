import type { EmbedProvider, ThemeMode } from "./providers/base";
import type { CacheManager } from "./cache";
import type { ExtendedEmbedsSettings } from "./settings";

import { youtubeProvider } from "./providers/youtube";
import { spotifyProvider } from "./providers/spotify";
import { soundcloudProvider } from "./providers/soundcloud";
import { codepenProvider } from "./providers/codepen";
import { createGithubGistProvider } from "./providers/github-gist";
import { createGithubRepoProvider } from "./providers/github-repo";
import { createGithubIssueProvider } from "./providers/github-issue";
import { createOpenGraphProvider } from "./providers/opengraph";

export class EmbedManager {
	private providers: EmbedProvider[] = [];

	constructor(
		private settings: ExtendedEmbedsSettings,
		private cache: CacheManager,
	) {
		this.rebuildProviders();
	}

	rebuildProviders(): void {
		const s = this.settings;
		const token = s.githubToken;

		this.providers = [];

		// Order matters: specific providers first, opengraph last as fallback
		if (s.enableYoutube) this.providers.push(youtubeProvider);
		if (s.enableSpotify) this.providers.push(spotifyProvider);
		if (s.enableSoundcloud) this.providers.push(soundcloudProvider);
		if (s.enableCodepen) this.providers.push(codepenProvider);
		if (s.enableGithubGist) this.providers.push(createGithubGistProvider(this.cache, token));
		if (s.enableGithubIssue) this.providers.push(createGithubIssueProvider(this.cache, token));
		if (s.enableGithubRepo) this.providers.push(createGithubRepoProvider(this.cache, token));
		if (s.enableOpengraph) this.providers.push(createOpenGraphProvider(this.cache));
	}

	getTheme(): ThemeMode {
		if (this.settings.themeMode === "auto") {
			return document.body.classList.contains("theme-dark") ? "dark" : "light";
		}
		return this.settings.themeMode;
	}

	findProvider(url: string): EmbedProvider | null {
		for (const provider of this.providers) {
			if (provider.test(url)) return provider;
		}
		return null;
	}

	async render(url: string, container: HTMLElement): Promise<boolean> {
		const provider = this.findProvider(url);
		if (!provider) return false;

		const theme = this.getTheme();
		await provider.render(url, container, theme);
		return true;
	}
}
