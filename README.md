# Auto Dark Mode Chrome Extension

Automatically inverts colors on websites with white/light backgrounds.

## Features

- Auto-detects light backgrounds (brightness > 200)
- Global toggle for auto-inversion
- Per-site override settings
- Preserves images and videos

## Install

1. Run `pnpm install && pnpm build`
2. Open `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" → select `dist/` folder

## Development

```bash
pnpm install    # Install dependencies
pnpm build      # Build extension to dist/
```

## Usage

Click extension icon to:
- Toggle global auto-invert
- Override settings for current site