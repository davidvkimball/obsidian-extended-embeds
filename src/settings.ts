import { App, PluginSettingTab } from "obsidian";
import type ExtendedEmbedsPlugin from "./main";
import { createSettingsGroup } from "./utils/settings-compat";

export interface ExtendedEmbedsSettings {
	// Provider toggles
	enableYoutube: boolean;
	enableSpotify: boolean;
	enableSoundcloud: boolean;
	enableCodepen: boolean;
	enableGithubGist: boolean;
	enableGithubRepo: boolean;
	enableGithubIssue: boolean;
	enableOpengraph: boolean;

	// GitHub authentication
	githubToken: string;

	// Display
	themeMode: "auto" | "dark" | "light";

	// Cache
	cacheTtlMinutes: number;
}

export const DEFAULT_SETTINGS: ExtendedEmbedsSettings = {
	enableYoutube: true,
	enableSpotify: true,
	enableSoundcloud: true,
	enableCodepen: true,
	enableGithubGist: true,
	enableGithubRepo: true,
	enableGithubIssue: true,
	enableOpengraph: true,

	githubToken: "",
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

		this.addProviderToggle(providersGroup, "YouTube", "enableYoutube");
		this.addProviderToggle(providersGroup, "Spotify", "enableSpotify");
		this.addProviderToggle(providersGroup, "SoundCloud", "enableSoundcloud");
		this.addProviderToggle(providersGroup, "CodePen", "enableCodepen");
		this.addProviderToggle(providersGroup, "GitHub Gist", "enableGithubGist");
		this.addProviderToggle(providersGroup, "GitHub repository", "enableGithubRepo");
		this.addProviderToggle(providersGroup, "GitHub issue/PR", "enableGithubIssue");
		this.addProviderToggle(providersGroup, "Generic URL preview (Open Graph)", "enableOpengraph");

		// GitHub group
		const githubGroup = createSettingsGroup(containerEl, "GitHub");

		githubGroup.addSetting((setting) => {
			setting
				.setName("Personal access token")
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
