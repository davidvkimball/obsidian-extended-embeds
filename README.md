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

Extended Embeds is not yet available in the Community plugins section. Install using [BRAT](https://github.com/TfTHacker/obsidian42-brat) or manually:

### BRAT

1. Download the [Beta Reviewers Auto-update Tester (BRAT)](https://github.com/TfTHacker/obsidian42-brat) plugin from the [Obsidian community plugins directory](https://obsidian.md/plugins?id=obsidian42-brat) and enable it.
2. In the BRAT plugin settings, select `Add beta plugin`.
3. Paste the following: `https://github.com/davidvkimball/obsidian-extended-embeds` and select `Add plugin`.

### Manual Installation

1. Download the latest release
2. Extract the files to your vault's `.obsidian/plugins/extended-embeds/` folder
3. Reload Obsidian
4. Enable the plugin in Settings > Community plugins

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
