import type { EmbedProvider, ThemeMode } from "./base";

const SOUNDCLOUD_PATTERN = /soundcloud\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/;

export const soundcloudProvider: EmbedProvider = {
	id: "soundcloud",
	name: "SoundCloud",

	test(url: string): boolean {
		return SOUNDCLOUD_PATTERN.test(url);
	},

	render(url: string, container: HTMLElement, theme: ThemeMode): void {
		const colorParam = theme === "dark" ? "&color=%23ff5500" : "&color=%23ff5500";
		const visualParam = "&visual=true&show_artwork=true&show_comments=false&show_user=true&show_reposts=false";
		const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}${colorParam}${visualParam}&auto_play=false`;

		container.addClass("extended-embed", "extended-embed-soundcloud");

		container.createEl("iframe", {
			attr: {
				src: embedUrl,
				frameborder: "0",
				allow: "autoplay",
				loading: "lazy",
				scrolling: "no",
			},
		});
	},
};
