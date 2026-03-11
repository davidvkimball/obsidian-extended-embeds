/**
 * Simple cache manager with TTL support.
 * Uses in-memory Map with optional persistence via plugin.loadData/saveData.
 */

interface CacheEntry<T> {
	data: T;
	expires: number;
}

export interface CacheManager {
	get<T>(key: string): T | null;
	set<T>(key: string, data: T): void;
	clear(): void;
}

export function createCacheManager(ttlMinutes: number): CacheManager {
	const store = new Map<string, CacheEntry<unknown>>();

	return {
		get<T>(key: string): T | null {
			const entry = store.get(key);
			if (!entry) return null;
			if (Date.now() > entry.expires) {
				store.delete(key);
				return null;
			}
			return entry.data as T;
		},

		set<T>(key: string, data: T): void {
			store.set(key, {
				data,
				expires: Date.now() + ttlMinutes * 60 * 1000,
			});
		},

		clear(): void {
			store.clear();
		},
	};
}
