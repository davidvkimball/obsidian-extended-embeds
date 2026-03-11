---
name: project
description: Project-specific architecture, maintenance tasks, and unique conventions for Extended Embeds.
---

# Extended Embeds Project Skill

Obsidian plugin that intercepts `![embed](url)` syntax in reading mode and renders rich media embeds (GitHub cards, Spotify players, CodePen iframes, etc.).

## Core Architecture

- **MarkdownPostProcessor**: Scans for `<img>` elements where `alt === "embed"` and replaces with rich embeds.
- **Provider Pattern**: Each embed type is a self-contained provider implementing `EmbedProvider` (test + render).
- **URL Routing**: `EmbedManager` checks URLs against providers in priority order (specific first, Open Graph fallback last).
- **Caching**: In-memory cache with configurable TTL to avoid redundant API calls.

## Project-Specific Conventions

- Use `requestUrl` from Obsidian (not `fetch`) for all network requests.
- Sync render methods must not use the `async` keyword (lint rule: `require-await`).
- Settings use `createSettingsGroup()` from `src/utils/settings-compat.ts` for SettingGroup API compatibility.
- CSS classes are prefixed with `extended-embed-`.
- Theme detection: `document.body.classList.contains("theme-dark")` when set to auto.
- No `:::directive` syntax. All embeds use `![embed](url)` exclusively.

## Key Files

- `src/main.ts`: Plugin lifecycle, registers MarkdownPostProcessor.
- `src/settings.ts`: `ExtendedEmbedsSettings` interface, setting tab with provider toggles.
- `src/embed-manager.ts`: Provider registry, URL routing, theme detection.
- `src/cache.ts`: In-memory cache with TTL (`createCacheManager`).
- `src/utils/settings-compat.ts`: `createSettingsGroup()` backward compatibility utility.
- `src/providers/base.ts`: `EmbedProvider` interface (id, name, test, render).
- `src/providers/*.ts`: Individual provider implementations.
- `styles.css`: All embed card and iframe styling using CSS custom properties.

## Maintenance Tasks

- **Adding a New Provider**: Create `src/providers/<name>.ts`, add toggle to settings interface and defaults, import/register in `embed-manager.ts` (before opengraph), add toggle to settings tab, add CSS.
- **API Changes**: Monitor GitHub API and Obsidian API for breaking changes.
- **Provider Testing**: Verify each provider renders correctly in both dark and light modes.
