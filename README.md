# Tiglet

A clean, no-login collection of small browser tools — and a personal portfolio piece.
Built with Astro + React islands + Tailwind CSS v4, deployed on Vercel.

> 🔗 **Live demo:** [tiglet.vercel.app](https://tiglet.vercel.app)

Everything runs entirely in your browser. No accounts, no servers, no tracking — your input never leaves your device.

## Features

- **⌘K command palette** — jump to any tool from anywhere
- **Light / dark mode** — warm, low-contrast theme with a one-click toggle (no flash on load)
- **Favorites & recently used** — pin the tools you use, surfaced on the home page
- **One-click copy** — every result has a copy button
- **Shareable deep links** — tool state lives in the URL (e.g. the wheel's options)
- **Installable PWA** — add to your home screen and use it offline

## Tools

| Category | Tool | What it does |
|----------|------|--------------|
| Calculators | **Calculator** | Four-function calculator with keyboard input |
| Calculators | **Text Calculator** | Type an expression, get the result (safe parser — no `eval`) |
| Games | **Tic-Tac-Toe** | Two-player or vs. an unbeatable computer (minimax) |
| Random | **Decision Wheel** | Spin a wheel of options; share the options via the URL |
| Random | **Name Raffle** | Draw winners from a list or an imported **Excel / CSV** file |
| Utilities | **Timer** | Countdown (with presets) and stopwatch, with a beep on finish |
| Utilities | **Dice** | Roll any number of d4–d20 dice and total them |
| Utilities | **QR Code** | Turn text or a URL into a downloadable QR code |
| Utilities | **Password Generator** | Customizable, ambiguity-free random passwords with a strength meter |

## Tech stack

- **[Astro](https://astro.build)** — static output, near-zero JS on the home page
- **React** — one interactive island per tool
- **Tailwind CSS v4** — design tokens via `@tailwindcss/vite`
- **Vitest** — unit tests for every tool's core logic
- **[@vite-pwa/astro](https://vite-pwa-org.netlify.app)** — manifest + service worker
- Client-side **SheetJS** (`xlsx`) and **`qrcode`**, both dynamically imported

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm test         # run the unit tests
npm run build    # build static output to dist/
npm run preview  # preview the production build
```

Requires Node 22.12+.

## Project structure

```
src/
├─ data/tools.ts        # tool registry — the single source of truth for the launcher
├─ lib/                 # pure, unit-tested logic (one module per tool engine)
│  └─ __tests__/        # Vitest specs
├─ components/          # shared UI (Header, SearchBar, CommandPalette, CopyButton, …)
├─ tools/               # one React island per tool (UI only)
├─ pages/
│  ├─ index.astro       # home launcher
│  └─ tools/            # one page per tool
├─ layouts/BaseLayout.astro
└─ styles/global.css    # Tailwind + design tokens (incl. dark overrides)
```

The guiding principle is a strict split between **logic and UI**: each tool's behavior
lives in a pure module under `src/lib/` (easy to test in isolation), while `src/tools/`
holds only the React presentation. The home page, search, and command palette are all
driven by the single registry in `src/data/tools.ts`.

## Adding a new tool

1. Add an entry to `src/data/tools.ts` (with `status: 'available'`).
2. Put the core logic in `src/lib/<tool>.ts` and a spec in `src/lib/__tests__/`.
3. Build the UI island in `src/tools/<Tool>.tsx`.
4. Create the page `src/pages/tools/<tool>.astro`, passing `toolId` to `BaseLayout`
   so visits are tracked in "recently used".

## Deployment

The site is a static Astro build and deploys to **Vercel** with zero configuration —
import the repository and Vercel auto-detects Astro. `vercel.json` pins the build
command and output directory, and `.npmrc` keeps installs reproducible.

## Privacy

Tiglet is 100% client-side. The raffle's Excel import, the QR generator, and every
other tool process your data locally in the browser — nothing is uploaded.

---

Made by [TTigger](https://github.com/TTigger).
