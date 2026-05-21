# Extended Embeds

Embed rich media from GitHub, Spotify, CodePen, and more directly in your notes.

## Features

Use fenced code blocks with the `embed` language identifier to embed rich media previews in reading mode. Extended Embeds detects the URL and renders the appropriate embed automatically.

### Supported Providers

- **Vimeo** - Video player (supports standard and manage URLs)
- **Spotify** - Track, album, playlist, episode, show, and podcast players
- **Steam** - Store app, bundle, and package widgets
- **SoundCloud** - Track player
- **CodePen** - Pen embeds with theme support
- **GitHub Gist** - Gist code embeds
- **GitHub Repository** - Rich card with description, stars, forks, and language
- **GitHub Issue/PR** - Card with state badge, labels, author, and date
- **Generic URL** - Open Graph card fallback for any URL (title, description, image, favicon)

### Usage

In your Markdown notes, use a fenced code block with the `embed` language identifier:

````markdown
```embed
https://github.com/obsidianmd/obsidian-api
```

```embed
https://github.com/obsidianmd/obsidian-api/issues/1
```

```embed
https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
```

```embed
https://creators.spotify.com/pod/profile/davidvkimball/episodes/Free-Trials-e26r5r5/a-aa459st
```

```embed
https://store.steampowered.com/app/440
```

```embed
https://codepen.io/pen/abcdef
```

```embed
https://gist.github.com/user/abc123
```

```embed
https://vimeo.com/133845089
```

```embed
https://soundcloud.com/artist/track
```

```embed
https://example.com
```
````

You can optionally specify a width (or width and height) on the second line:

````markdown
```embed
https://codepen.io/pen/abcdef
600x400
```
````

### Dark Mode

Embeds automatically follow your Obsidian theme. You can also force dark or light mode in settings.

### Settings

- **Provider toggles** - Enable or disable individual providers
- **GitHub token** - Optional personal access token for higher API rate limits (60 to 5,000 requests/hour)
- **Theme mode** - Auto (follow Obsidian), always dark, or always light
- **Cache duration** - How long fetched data is cached in memory (0 to disable)

## Installation

### Community Plugins Search

1. In Obsidian, go to Settings > Community plugins (enable it if you haven't already).
2. Search for [Extended Embeds](https://obsidian.md/plugins?id=extended-embeds) and click Install and then Enable.

### Manual

1. Download the latest release from the [Releases page](https://github.com/davidvkimball/obsidian-extended-embeds/releases) and navigate to your Obsidian vault's `.obsidian/plugins/` directory.
2. Create a new folder called `extended-embeds` and ensure `manifest.json`, `main.js`, and `styles.css` are in there.
3. In Obsidian, go to Settings > Community plugins (enable it if you haven't already) and then enable "Extended Embeds."

## Development

1. Clone this repository
2. Run `pnpm install`
3. Run `pnpm dev` to start compilation in watch mode

### Building

```bash
pnpm build
```

### Linting

```bash
pnpm lint
```
