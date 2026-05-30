import { App, BaseComponent, PluginSettingTab, requireApiVersion, Setting, SettingGroup } from "obsidian";
import type ExtendedEmbedsPlugin from "./main";

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
	enableLinkedin: boolean;
	enableSteam: boolean;
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
	enableLinkedin: true,
	enableSteam: true,
	enableOpengraph: true,

	githubToken: "",
	githubTokenSecretId: "",
	themeMode: "auto",
	cacheTtlMinutes: 60,
};

export class ExtendedEmbedsSettingTab extends PluginSettingTab {
	// Shown beside the plugin name in settings search results (1.13) and in the
	// settings sidebar on older Obsidian (SettingTab.icon).
	public icon = 'lucide-code-xml';
	plugin: ExtendedEmbedsPlugin;

	constructor(app: App, plugin: ExtendedEmbedsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// 1.13.0+: framework calls this and skips display().
	// Pre-1.13.0: this method is not invoked; display() below runs as before.
	// See https://docs.obsidian.md/plugins/guides/migrate-declarative-settings
	getSettingDefinitions() {
		return [
			{
				type: "group" as const,
				heading: "Providers",
				items: [
					{ name: "Vimeo", control: { type: "toggle" as const, key: "enableVimeo" } },
					{ name: "Spotify", control: { type: "toggle" as const, key: "enableSpotify" } },
					{ name: "Apple Music", control: { type: "toggle" as const, key: "enableAppleMusic" } },
					{ name: "SoundCloud", control: { type: "toggle" as const, key: "enableSoundcloud" } },
					{ name: "Bandcamp", control: { type: "toggle" as const, key: "enableBandcamp" } },
					{ name: "CodePen", control: { type: "toggle" as const, key: "enableCodepen" } },
					{ name: "Figma", control: { type: "toggle" as const, key: "enableFigma" } },
					{ name: "GitHub Gist", control: { type: "toggle" as const, key: "enableGithubGist" } },
					{ name: "GitHub repository", control: { type: "toggle" as const, key: "enableGithubRepo" } },
					{ name: "GitHub issue/PR", control: { type: "toggle" as const, key: "enableGithubIssue" } },
					{ name: "Reddit", control: { type: "toggle" as const, key: "enableReddit" } },
					{ name: "Bluesky", control: { type: "toggle" as const, key: "enableBluesky" } },
					{ name: "Mastodon", control: { type: "toggle" as const, key: "enableMastodon" } },
					{ name: "LinkedIn", control: { type: "toggle" as const, key: "enableLinkedin" } },
					{ name: "Steam", control: { type: "toggle" as const, key: "enableSteam" } },
					{ name: "Generic URL preview (Open Graph)", control: { type: "toggle" as const, key: "enableOpengraph" } },
				],
			},
			{
				type: "group" as const,
				heading: "GitHub",
				items: [
					{
						name: "Personal access token",
						// Render: branches on app version between a SecretComponent and a
						// plain text fallback, mirroring display().
						render: (setting: Setting) => {
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
						},
					},
				],
			},
			{
				type: "group" as const,
				heading: "Display",
				items: [
					{
						name: "Theme mode",
						desc: "How embeds determine dark/light styling. Auto follows your Obsidian theme.",
						control: {
							type: "dropdown" as const,
							key: "themeMode",
							options: {
								auto: "Auto (follow Obsidian)",
								dark: "Always dark",
								light: "Always light",
							},
						},
					},
				],
			},
			{
				type: "group" as const,
				heading: "Cache",
				items: [
					{
						name: "Cache duration (minutes)",
						desc: "How long fetched data is cached in memory. Set to 0 to disable caching.",
						control: { type: "slider" as const, key: "cacheTtlMinutes", min: 0, max: 1440, step: 15 },
					},
				],
			},
		];
	}

	// Override the framework's default setControlValue (which only calls saveData)
	// so that every control change runs the plugin's saveSettings() — which also
	// rebuilds the cache and embed managers when settings change. Without this
	// override, the cache TTL and provider toggles would not take effect until
	// reload on Obsidian 1.13.0+. (On older versions this method is unused;
	// display() already calls saveSettings() in its onChange handlers.)
	async setControlValue(key: string, value: unknown): Promise<void> {
		(this.plugin.settings as unknown as Record<string, unknown>)[key] = value;
		await this.plugin.saveSettings();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Providers group
		const providersGroup = new SettingGroup(containerEl).setHeading("Providers");

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
		this.addProviderToggle(providersGroup, "LinkedIn", "enableLinkedin");
		this.addProviderToggle(providersGroup, "Steam", "enableSteam");
		this.addProviderToggle(providersGroup, "Generic URL preview (Open Graph)", "enableOpengraph");

		// GitHub group
		const githubGroup = new SettingGroup(containerEl).setHeading("GitHub");

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
		const displayGroup = new SettingGroup(containerEl).setHeading("Display");

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
		const cacheGroup = new SettingGroup(containerEl).setHeading("Cache");

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
		group: SettingGroup,
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
