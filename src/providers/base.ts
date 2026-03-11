/**
 * Base interface and types for embed providers.
 */

export type ThemeMode = "dark" | "light";

export interface EmbedResult {
	container: HTMLElement;
}

export interface EmbedProvider {
	/** Unique identifier for this provider. */
	id: string;
	/** Human-readable name shown in settings. */
	name: string;
	/** Test whether this provider can handle the given URL. */
	test(url: string): boolean;
	/** Render the embed into a container element. */
	render(url: string, container: HTMLElement, theme: ThemeMode): Promise<void> | void;
}
