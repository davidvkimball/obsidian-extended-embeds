import { Editor, MarkdownRenderChild, Notice, Plugin, requireApiVersion } from "obsidian";
import { DEFAULT_SETTINGS, ExtendedEmbedsSettingTab } from "./settings";
import type { ExtendedEmbedsSettings } from "./settings";
import { createCacheManager } from "./cache";
import type { CacheManager } from "./cache";
import { EmbedManager } from "./embed-manager";

/**
 * Parse the code block source to extract URL and optional dimensions.
 * Supports:
 *   https://example.com
 *   https://example.com
 *   400
 *   https://example.com
 *   400x300
 */
function parseSource(source: string): { url: string; width?: number; height?: number } | null {
	const lines = source.trim().split("\n").map((l) => l.trim()).filter(Boolean);
	if (lines.length === 0) return null;

	const url = lines[0] ?? "";
	if (!url.startsWith("http://") && !url.startsWith("https://")) return null;

	let width: number | undefined;
	let height: number | undefined;

	if (lines.length > 1) {
		const dimMatch = (lines[1] ?? "").match(/^(\d+)(?:x(\d+))?$/);
		if (dimMatch) {
			const w = dimMatch[1];
			const h = dimMatch[2];
			if (w) width = parseInt(w, 10);
			if (h) height = parseInt(h, 10);
		}
	}

	return { url, width, height };
}

/** Detect a YouTube watch / share / shorts / embed / live URL. */
function isYouTubeUrl(url: string): boolean {
	return /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)/i.test(url);
}

export default class ExtendedEmbedsPlugin extends Plugin {
	settings: ExtendedEmbedsSettings;
	private cache: CacheManager;
	private embedManager: EmbedManager;

	async onload(): Promise<void> {
		await this.loadSettings();
		await this.migrateTokenToSecret();

		this.cache = createCacheManager(this.settings.cacheTtlMinutes);
		this.embedManager = new EmbedManager(this.settings, this.cache, this.app);

		this.addSettingTab(new ExtendedEmbedsSettingTab(this.app, this));

		this.registerInsertCommand();
		this.registerAutoEmbedOnPaste();

		// Code block processor: ```embed
		this.registerMarkdownCodeBlockProcessor("embed", (source, el, ctx) => {
			const parsed = parseSource(source);
			if (!parsed) {
				el.createDiv({ cls: "extended-embed-error", text: "Invalid embed: paste a URL" });
				return;
			}

			const wrapper = el.createDiv("extended-embed-wrapper");

			if (parsed.width) {
				wrapper.addClass("extended-embed-custom-width");
				wrapper.setCssProps({ "--embed-width": `${parsed.width}px` });
			}
			if (parsed.height) {
				wrapper.setCssProps({ "--embed-height": `${parsed.height}px` });
			}

			ctx.addChild(new EmbedRenderChild(wrapper, this.embedManager, parsed.url));
		});
	}

	private registerInsertCommand(): void {
		this.addCommand({
			id: "insert-web-embed",
			name: "Add web embed",
			editorCallback: (editor: Editor) => {
				const cursor = editor.getCursor();
				const template = "```embed\n\n```";
				editor.replaceRange(template, cursor);
				// Place cursor on the empty line inside the block
				editor.setCursor({ line: cursor.line + 1, ch: 0 });
			},
		});
	}

	/**
	 * Convert a supported link pasted on an empty line into an embed.
	 * Specific providers become an ```embed block; YouTube becomes the native
	 * ![](url) form (there is no embed-block renderer for it here, and that is what
	 * Obsidian and downstream Astro pipelines expect). The Open Graph catch-all is
	 * intentionally excluded so arbitrary URLs are never hijacked.
	 */
	private registerAutoEmbedOnPaste(): void {
		this.registerEvent(
			this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor) => {
				if (!this.settings.autoEmbedOnPaste) return;
				if (evt.defaultPrevented) return;

				const text = evt.clipboardData?.getData("text")?.trim();
				// Only act on a single bare URL, with no surrounding text.
				if (!text || !/^https?:\/\/\S+$/.test(text)) return;

				// Only on an empty line with no selection, so a URL pasted into the
				// middle of a sentence is never touched.
				if (editor.somethingSelected()) return;
				const cursor = editor.getCursor();
				if (editor.getLine(cursor.line).trim() !== "") return;

				if (isYouTubeUrl(text)) {
					evt.preventDefault();
					editor.replaceSelection(`![](${text})`);
					return;
				}

				if (this.embedManager.findSpecificProvider(text)) {
					evt.preventDefault();
					editor.replaceSelection("```embed\n" + text + "\n```");
				}
			}),
		);
	}

	/**
	 * One-time migration of plaintext GitHub token to SecretStorage (1.11.4+).
	 */
	private async migrateTokenToSecret(): Promise<void> {
		if (!requireApiVersion("1.11.4")) return;
		if (this.settings.githubTokenSecretId || !this.settings.githubToken) return;

		const secretStorage = (this.app as unknown as { secretStorage?: { setSecret(id: string, secret: string): void } }).secretStorage;
		if (!secretStorage) return;

		const secretId = "extended-embeds-github-token";
		try {
			secretStorage.setSecret(secretId, this.settings.githubToken);
			this.settings.githubTokenSecretId = secretId;
			await this.saveSettings();
		} catch {
			new Notice("Failed to migrate token to secure storage, please re-enter it in settings.");
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ExtendedEmbedsSettings>);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		if (this.embedManager) {
			this.cache = createCacheManager(this.settings.cacheTtlMinutes);
			this.embedManager = new EmbedManager(this.settings, this.cache, this.app);
		}
	}
}

class EmbedRenderChild extends MarkdownRenderChild {
	constructor(
		containerEl: HTMLElement,
		private embedManager: EmbedManager,
		private url: string,
	) {
		super(containerEl);
	}

	override onload(): void {
		void this.embedManager.render(this.url, this.containerEl);
	}
}
