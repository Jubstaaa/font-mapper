<div align="center">

<img src="public/icon-128.png" width="96" height="96" alt="FontMapper" />

# FontMapper

**Replace any website's fonts with the fonts installed on your computer — per domain, instantly.**

<sub>System fonts, downloaded fonts, anything — FontMapper reads them directly via Chrome's Local Font Access API and lets you assign any of them as a replacement on any site.</sub>

<p>
  <a href="https://chromewebstore.google.com/detail/gfdmhpidmomcbghfoejkcpjdklbdcdnn"><img alt="Chrome Web Store" src="https://img.shields.io/chrome-web-store/v/gfdmhpidmomcbghfoejkcpjdklbdcdnn?label=Chrome%20Web%20Store&logo=googlechrome&logoColor=white&color=4285F4"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-4285F4"></a>
  <a href="https://github.com/Jubstaaa/font-mapper/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/Jubstaaa/font-mapper?color=4285F4"></a>
</p>

<p>
  <a href="https://chromewebstore.google.com/detail/gfdmhpidmomcbghfoejkcpjdklbdcdnn"><img alt="Add to Chrome — it's free" src="https://img.shields.io/badge/Add%20to%20Chrome-it's%20free-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white"></a>
</p>

</div>

<p align="center">
  <img src="store/screenshot-1280x800.png" alt="FontMapper hero" />
</p>

---

## What it does

FontMapper is a Chrome extension that lets you change website fonts using the fonts already installed on your computer. Open the popup on any page, see every font family the site is using, swap each one for any font on your machine, and FontMapper remembers your choices — per domain, applied automatically on every visit.

Built for people who care about typography, accessibility, or just don't like how a particular site renders its body text.

## Features

- **Per-domain mapping** — different replacements for different sites, applied automatically
- **Cross-device sync** — mappings follow your Chrome profile to every device signed in to the same Google account, no export/import needed
- **Searchable font picker** — type to filter through every font on your machine; each option previews in its own typeface
- **Per-mapping typography** — tweak scale, bold/italic, line-height, letter-spacing, word-spacing, and text color for each remapped family
- **Hover to identify** — hover any detected font in the popup and every element using it gets highlighted on the page
- **Instant preview** — changes apply in real time, no reload
- **One-click reset** — wipe all mappings for a site
- **Zero data collection** — no FontMapper servers, no analytics, no accounts; mappings ride Chrome's encrypted profile sync

<p align="center">
  <img src="store/screenshot-popup-1280x800.jpg" alt="FontMapper popup detecting fonts on a GitHub PR page, with per-mapping scale and bold/italic toggles" width="900" />
</p>

<p align="center">
  <img src="store/screenshot-options-1280x800.jpg" alt="FontMapper options page with local font cache and backup &amp; restore controls" width="900" />
</p>

## How it works

FontMapper walks every element on the page, reads its computed `font-family` chain, and applies an inline override on each element whose chain references a mapped family:

```js
el.style.setProperty('font-family', '"Product Sans"', 'important')
```

This intercepts named families (Arial, Sohne), generic keywords (`sans-serif`, `serif`, `monospace`), and system aliases (`-apple-system`, `system-ui`) — anywhere a page's font stack falls back, your mapping wins. A `MutationObserver` keeps it up to date as the page injects new content.

Per-domain preferences are persisted via `chrome.storage.sync` so they follow your Chrome profile across devices. There are no FontMapper servers — Google's encrypted profile sync is the only network path.

## Install

### From the Chrome Web Store

[**Install FontMapper from the Chrome Web Store →**](https://chromewebstore.google.com/detail/gfdmhpidmomcbghfoejkcpjdklbdcdnn)

One click, no setup. Works on any Chromium-based browser (Chrome, Edge, Brave, Arc).

### From source

```bash
git clone git@github.com:Jubstaaa/font-mapper.git
cd font-mapper
bun install
bun run build
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

## Development

```bash
bun install
bun run dev           # Vite dev server + HMR (dist/ auto-rebuilds)
bun run build         # Production build → dist/
bun run typecheck     # tsc -b --noEmit (TypeScript 7)
bun run lint          # ESLint
bun run format        # Prettier (format:check in CI)
bun run test          # Vitest
bun run audit         # bun audit --audit-level=high
```

CI runs audit, format check, lint, typecheck, tests and build on every pull request.

`typescript` is aliased to `@typescript/typescript6` because typescript-eslint still needs the
TypeScript 6 compiler API; `tsc` itself comes from `@typescript/native` (TypeScript 7).

## Tech stack

| Layer        | Tools                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| Build        | Vite, [@crxjs/vite-plugin](https://crxjs.dev), Bun                                                         |
| UI           | React 19, TypeScript, Tailwind CSS v4                                                                      |
| Components   | shadcn/ui (new-york), Radix UI, cmdk, lucide-react                                                         |
| Browser APIs | Local Font Access, `chrome.storage.sync/local`, `chrome.action`, `chrome.tabs`, MV3 service worker + ports |

## Project structure

Flat per-feature folders, one per extension surface. Code lives next to its only consumer; `lib/` holds what more than one surface shares. Each `*.test.ts` sits next to the file it covers.

```
src/
├── background/                       MV3 service worker
│   ├── background.ts                 Entry — wires the two register fns
│   ├── badge.ts                      Per-tab mapping count badge
│   └── lifecycle.ts                  onInstalled / onStartup / migration trigger
├── content/                          Injected into every page (document_start)
│   ├── content.ts                    Entry — init + IPC + lifecycle listeners
│   ├── font-chain.ts                 Pure parsers: parseFontFamilyChain, matchChain
│   ├── element-override.ts           Apply / restore inline style per element + state
│   ├── used-fonts.ts                 collectUsedFonts + element index for highlighting
│   ├── highlight.ts                  Hover-highlight CSS injection
│   └── observers.ts                  MutationObserver + debounced resize
├── popup/                            Browser action UI
│   ├── main.tsx                      Popup React entry
│   ├── popup.tsx                     JSX wiring
│   ├── popup.hooks.ts                usePopupController owns state + IPC
│   ├── font-mapping-row.tsx          One mapping row (source → target + controls)
│   ├── labeled-slider.tsx            Reused by Scale + Line + Letter + Word
│   ├── use-debounced-commit.ts       Draft value + debounced commit (use-debounce)
│   ├── advanced-color.tsx            Native color picker with reset
│   ├── style-toggles.tsx             Bold + Italic toggles
│   ├── mapping-warning.tsx           Orphan / missing-target banner
│   ├── mapping-warning-state.ts      Which warning a row shows
│   └── font-combobox.tsx             Searchable combobox (cmdk + Radix Popover)
├── options/                          Settings page (Local Font Access + backup)
│   ├── main.tsx                      Options React entry
│   ├── options.tsx                   JSX wiring
│   └── options.hooks.ts              useFontAccess + useBackupActions
├── lib/                              Shared by more than one surface
│   ├── chrome-storage.ts             CRUD over chrome.storage.sync (with local fallback)
│   ├── chrome-storage.types.ts       Stored data shapes
│   ├── chrome-storage-migration.ts   One-shot local → sync migration
│   ├── chrome-fonts.ts               Local Font Access enumeration + variant picking
│   ├── chrome-messaging.ts           Type-safe popup ↔ content messages
│   ├── font-family.ts                CSS font-family quoting + keyword sets
│   ├── page-host.ts                  Hostname of an http(s) tab URL
│   └── utils.ts                      shadcn cn helper
├── components/ui/                    shadcn primitives (slider, popover, tooltip, …)
├── test/setup.ts                     Vitest setup (fake chrome.* APIs)
└── index.css                         Tailwind + design tokens

public/                               Manifest icons (16/32/48/128)
store/                                Chrome Web Store assets (icon, screenshots)
```

## Privacy

FontMapper sends nothing to the developer or any third party: no servers, no analytics, no telemetry, no accounts. Your mappings are saved in `chrome.storage.sync`, so Chrome Sync carries them to your other signed-in Chrome browsers; the cached list of installed fonts stays in `chrome.storage.local` on this device. Details in [PRIVACY.md](PRIVACY.md). The full source is in this repo.

## License

MIT

---

<div align="center">

If FontMapper made your day a little better, [**leave a review on the Chrome Web Store**](https://chromewebstore.google.com/detail/gfdmhpidmomcbghfoejkcpjdklbdcdnn) or ⭐ this repo. It really helps.

</div>
