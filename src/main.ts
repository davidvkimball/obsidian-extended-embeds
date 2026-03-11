import { Editor, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, ExtendedEmbedsSettingTab } from "./settings";
import type { ExtendedEmbedsSettings } from "./settings";
import { createCacheManager } from "./cache";
import type { CacheManager } from "./cache";
import { EmbedManager } from "./embed-manager";

/**
 * Trigger keywords that activate the embed processor.
 * Users can write ![embed](url), ![spotify](url), ![gist](url), etc.
 */
const TRIGGER_KEYWORDS = new Set([
	"embed",
	"youtube",
	"spotify",
	"soundcloud",
	"codepen",
	"gist",
	"github",
	"opengraph",
]);

/**
 * Parse the alt text to extract the trigger keyword and optional width.
 * Supports: "embed", "embed|400", "embed|400x300", "spotify", "gist|600", etc.
 * Returns null if the alt text doesn't match a trigger.
 */
function parseAltText(alt: string): { width?: number; height?: number } | null {
	const parts = alt.split("|");
	const keyword = (parts[0] ?? "").trim().toLowerCase();

	if (!TRIGGER_KEYWORDS.has(keyword)) return null;

	if (parts.length > 1) {
		const sizePart = (parts[1] ?? "").trim();
		const dimMatch = sizePart.match(/^(\d+)(?:x(\d+))?$/);
		if (dimMatch) {
			const w = dimMatch[1];
			const h = dimMatch[2];
			if (w) {
				return {
					width: parseInt(w, 10),
					height: h ? parseInt(h, 10) : undefined,
				};
			}
		}
	}

	return {};
}

function isExternalUrl(src: string): boolean {
	return src.startsWith("http://") || src.startsWith("https://");
}

/**
 * Walk up from an element to find the nearest block-level ancestor
 * that we should insert our embed wrapper after.
 * In reading mode this is a <p>; in Live Preview this is a .cm-line.
 */
function findBlockAncestor(el: HTMLElement): HTMLElement {
	let current: HTMLElement | null = el.parentElement;
	while (current) {
		if (current.tagName === "P" || current.classList.contains("cm-line")) {
			return current;
		}
		// Don't climb past major containers
		if (current.classList.contains("markdown-preview-section") ||
			current.classList.contains("cm-content") ||
			current.classList.contains("cm-editor")) {
			break;
		}
		current = current.parentElement;
	}
	return el.parentElement ?? el;
}

/** Marker attribute to avoid processing an image twice. */
const PROCESSED_ATTR = "data-extended-embed";

export default class ExtendedEmbedsPlugin extends Plugin {
	settings: ExtendedEmbedsSettings;
	private cache: CacheManager;
	private embedManager: EmbedManager;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.cache = createCacheManager(this.settings.cacheTtlMinutes);
		this.embedManager = new EmbedManager(this.settings, this.cache);

		this.addSettingTab(new ExtendedEmbedsSettingTab(this.app, this));

		this.registerInsertCommands();

		// Reading mode: standard post-processor
		this.registerMarkdownPostProcessor((el) => {
			this.processImages(el);
		});

		// Live Preview: observe DOM mutations for dynamically inserted images
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const node of Array.from(mutation.addedNodes)) {
					if (!(node instanceof HTMLElement)) continue;
					if (node.tagName === "IMG") {
						this.processImages(node.parentElement ?? node);
					} else if (node.querySelector?.("img")) {
						this.processImages(node);
					}
				}
			}
		});

		const workspace = document.querySelector(".workspace");
		if (workspace) {
			observer.observe(workspace, { childList: true, subtree: true });
		}

		this.register(() => observer.disconnect());
	}

	private registerInsertCommands(): void {
		const commands: Array<{ id: string; name: string; alt: string }> = [
			{ id: "insert-embed", name: "Insert embed", alt: "embed" },
			{ id: "insert-github-repo", name: "Insert GitHub repo embed", alt: "github" },
			{ id: "insert-github-issue", name: "Insert GitHub issue/PR embed", alt: "github" },
			{ id: "insert-gist", name: "Insert GitHub Gist embed", alt: "gist" },
			{ id: "insert-spotify", name: "Insert Spotify embed", alt: "spotify" },
			{ id: "insert-youtube", name: "Insert YouTube embed", alt: "youtube" },
			{ id: "insert-codepen", name: "Insert CodePen embed", alt: "codepen" },
			{ id: "insert-soundcloud", name: "Insert SoundCloud embed", alt: "soundcloud" },
		];

		for (const cmd of commands) {
			this.addCommand({
				id: cmd.id,
				name: cmd.name,
				editorCallback: (editor: Editor) => {
					const cursor = editor.getCursor();
					const template = `![${cmd.alt}]()`;
					editor.replaceRange(template, cursor);
					// Place cursor between the parentheses
					editor.setCursor({ line: cursor.line, ch: cursor.ch + cmd.alt.length + 4 });
				},
			});
		}
	}

	/**
	 * Scan a container element for img tags matching our trigger keywords
	 * and replace them with rich embeds.
	 */
	private processImages(container: HTMLElement): void {
		const images = container.querySelectorAll("img");

		for (const img of Array.from(images)) {
			if (img.hasAttribute(PROCESSED_ATTR)) continue;

			const alt = img.alt ?? img.getAttribute("alt") ?? "";
			const src = img.src ?? img.getAttribute("src") ?? "";

			if (!src || !isExternalUrl(src)) continue;

			const parsed = parseAltText(alt);
			if (!parsed) continue;

			const provider = this.embedManager.findProvider(src);
			if (!provider) continue;

			img.setAttribute(PROCESSED_ATTR, provider.id);
			img.addClass("extended-embed-hidden");

			// Obsidian strips ![alt|400] into alt="alt" width="400" on the <img>.
			// Read width/height from img attributes as fallback.
			const imgWidth = parsed.width ?? (img.hasAttribute("width") ? parseInt(img.getAttribute("width") ?? "", 10) : undefined);
			const imgHeight = parsed.height ?? (img.hasAttribute("height") ? parseInt(img.getAttribute("height") ?? "", 10) : undefined);

			const wrapper = createDiv("extended-embed-wrapper");

			if (imgWidth) {
				wrapper.addClass("extended-embed-custom-width");
				wrapper.setCssProps({ "--embed-width": `${imgWidth}px` });
			}
			if (imgHeight) {
				wrapper.setCssProps({ "--embed-height": `${imgHeight}px` });
			}

			// Insert wrapper AFTER the nearest block ancestor (<p> or .cm-line).
			// Putting a <div> inside a <p> or inline context breaks layout.
			const blockAncestor = findBlockAncestor(img);
			blockAncestor.after(wrapper);

			void this.embedManager.render(src, wrapper);
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ExtendedEmbedsSettings>);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		if (this.embedManager) {
			this.cache = createCacheManager(this.settings.cacheTtlMinutes);
			this.embedManager = new EmbedManager(this.settings, this.cache);
		}
	}
}
