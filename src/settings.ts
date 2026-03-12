import { App, BaseComponent, PluginSettingTab, requireApiVersion } from "obsidian";
import type ExtendedEmbedsPlugin from "./main";
import { createSettingsGroup } from "./utils/settings-compat";

/**
 * Interface for SecretComponent accessed via dynamic require.
 * SecretComponent is not available in type definitions for all Obsidian versions.
 */
interface SecretComponentType {
	new(app: App, el: HTMLElement): BaseComponent & {
		setValue(value: string): void;
		onChange(callback: (value: string) => void): void;
	};
}

export interface ExtendedEmbedsSettings {
	// Provider toggles
	enableVimeo: boolean;
	enableSpotify: boolean;
	enableAppleMusic: boolean;
	enableSoundcloud: boolean;
	enableBandcamp: boolean;
	enableCodepen: boolean;
	enableFigma: boolean;
	enableGithubGist: boolean;
	enableGithubRepo: boolean;
	enableGithubIssue: boolean;
	enableReddit: boolean;
	enableBluesky: boolean;
	enableMastodon: boolean;
	enableOpengraph: boolean;

	// GitHub authentication
	githubToken: string;
	githubTokenSecretId: string;

	// Display
	themeMode: "auto" | "dark" | "light";

	// Cache
	cacheTtlMinutes: number;
}

export const DEFAULT_SETTINGS: ExtendedEmbedsSettings = {
	enableVimeo: true,
	enableSpotify: true,
	enableAppleMusic: true,
	enableSoundcloud: true,
	enableBandcamp: true,
	enableCodepen: true,
	enableFigma: true,
	enableGithubGist: true,
	enableGithubRepo: true,
	enableGithubIssue: true,
	enableReddit: true,
	enableBluesky: true,
	enableMastodon: true,
	enableOpengraph: true,

	githubToken: "",
	githubTokenSecretId: "",
	themeMode: "auto",
	cacheTtlMinutes: 60,
};

export class ExtendedEmbedsSettingTab extends PluginSettingTab {
	plugin: ExtendedEmbedsPlugin;

	constructor(app: App, plugin: ExtendedEmbedsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Providers group
		const providersGroup = createSettingsGroup(containerEl, "Providers");

		this.addProviderToggle(providersGroup, "Vimeo", "enableVimeo");
		this.addProviderToggle(providersGroup, "Spotify", "enableSpotify");
		this.addProviderToggle(providersGroup, "Apple Music", "enableAppleMusic");
		this.addProviderToggle(providersGroup, "SoundCloud", "enableSoundcloud");
		this.addProviderToggle(providersGroup, "Bandcamp", "enableBandcamp");
		this.addProviderToggle(providersGroup, "CodePen", "enableCodepen");
		this.addProviderToggle(providersGroup, "Figma", "enableFigma");
		this.addProviderToggle(providersGroup, "GitHub Gist", "enableGithubGist");
		this.addProviderToggle(providersGroup, "GitHub repository", "enableGithubRepo");
		this.addProviderToggle(providersGroup, "GitHub issue/PR", "enableGithubIssue");
		this.addProviderToggle(providersGroup, "Reddit", "enableReddit");
		this.addProviderToggle(providersGroup, "Bluesky", "enableBluesky");
		this.addProviderToggle(providersGroup, "Mastodon", "enableMastodon");
		this.addProviderToggle(providersGroup, "Generic URL preview (Open Graph)", "enableOpengraph");

		// GitHub group
		const githubGroup = createSettingsGroup(containerEl, "GitHub");

		githubGroup.addSetting((setting) => {
			setting.setName("Personal access token");

			if (requireApiVersion("1.11.4")) {
				setting
					.setDesc("Choose a secret that contains your GitHub personal access token. Only needs public repo read access.")
					.addComponent((el) => {
						// eslint-disable-next-line @typescript-eslint/no-require-imports -- SecretComponent not in type definitions for all Obsidian versions
					const obsidian = require("obsidian") as { SecretComponent?: SecretComponentType };
						const SecretComponent = obsidian.SecretComponent as SecretComponentType;
						const component = new SecretComponent(this.app, el);
						component.setValue(this.plugin.settings.githubTokenSecretId);
						component.onChange((value: string) => {
							void (async () => {
								this.plugin.settings.githubTokenSecretId = value;
								await this.plugin.saveSettings();
							})();
						});
						return component;
					});
			} else {
				setting
					.setDesc("Optional. Increases API rate limit from 60 to 5,000 requests/hour. Only needs public repo read access.")
					.addText((text) =>
						text
							.setPlaceholder("Paste token here")
							.setValue(this.plugin.settings.githubToken)
							.onChange(async (value: string) => {
								this.plugin.settings.githubToken = value;
								await this.plugin.saveSettings();
							}),
					);
			}
		});

		// Display group
		const displayGroup = createSettingsGroup(containerEl, "Display");

		displayGroup.addSetting((setting) => {
			setting
				.setName("Theme mode")
				.setDesc("How embeds determine dark/light styling. Auto follows your Obsidian theme.")
				.addDropdown((dropdown) =>
					dropdown
						.addOption("auto", "Auto (follow Obsidian)")
						.addOption("dark", "Always dark")
						.addOption("light", "Always light")
						.setValue(this.plugin.settings.themeMode)
						.onChange(async (value: string) => {
							this.plugin.settings.themeMode = value as ExtendedEmbedsSettings["themeMode"];
							await this.plugin.saveSettings();
						}),
				);
		});

		// Cache group
		const cacheGroup = createSettingsGroup(containerEl, "Cache");

		cacheGroup.addSetting((setting) => {
			setting
				.setName("Cache duration (minutes)")
				.setDesc("How long fetched data is cached in memory. Set to 0 to disable caching.")
				.addSlider((slider) =>
					slider
						.setLimits(0, 1440, 15)
						.setValue(this.plugin.settings.cacheTtlMinutes)
						.setDynamicTooltip()
						.onChange(async (value: number) => {
							this.plugin.settings.cacheTtlMinutes = value;
							await this.plugin.saveSettings();
						}),
				);
		});
	}

	private addProviderToggle(
		group: ReturnType<typeof createSettingsGroup>,
		name: string,
		key: keyof ExtendedEmbedsSettings,
	): void {
		group.addSetting((setting) => {
			setting.setName(name).addToggle((toggle) =>
				toggle.setValue(this.plugin.settings[key] as boolean).onChange(async (value: boolean) => {
					(this.plugin.settings[key] as boolean) = value;
					await this.plugin.saveSettings();
				}),
			);
		});
	}
}
