---
name: Industria mini app project
description: Stack, key paths, fonts, icon library, and QA tooling for the «Индустрия» Telegram Mini App
type: project
---

App: «Индустрия» Telegram Mini App, Russian-language, music-industry marketplace.

**Why:** This is a recurring polish project — the user iterates on Figma fidelity between sessions, so knowing the stack and tooling avoids re-discovery.

**How to apply:** When the user references "Индустрия" / "industria" / `Goluboy\industria`, assume this stack and don't re-ask basics.

- App root: `C:\Users\user\Documents\Goluboy\industria\` (React + TS + Vite, HashRouter, no backend wired up yet).
- Build/QA helpers: `C:\Users\user\Documents\Goluboy\industria-build\`
  - `figma_full.json` is the raw Figma API document (use this — `specs.json` is a custom flattened summary missing `fills`/`style` data).
  - File key `8R0Uvtglbzq82ZA2TVQdSU`. `/v1/files/{key}/images` returns imageRef→S3-URL (works reliably). `/v1/images/{key}?ids=...` for vector node renders is HEAVILY rate-limited (often 429s for hours; treat as a daily quota).
  - Image fills already extracted to `industria/src/assets/figma/` (role_artist/studio/composer/customer.png, loader_logo.png, avatar_*.png, isometric_cherry.png, screenshot_decor.png). 15 unique imageRefs in the whole file.
  - `qa.mjs` Playwright at 390x844 → `qa-actual.json`. `qa-fonts.mjs` checks Fixel face loading + 404s. `qa-final.mjs` is a per-complaint check matrix.
- Brand colors are FIXED (do NOT follow Telegram theme); the app stays dark across all clients. Tokens in `src/styles/tokens.css`.
- Typography: self-hosted **Fixel Display** (woff2 weights 100–900 in `public/fonts/` + variable TTF for arbitrary weights like Figma's 590). Declared in `src/styles/fonts.css`. Manrope kept only as a fallback in the font stack.
- Icons: **`iconsax-react`** (v0.0.8), Bold variant by default — maps 1:1 to the `vuesax/bold/*` instances Figma uses. Note the package has typos like `Send2` (Figma's `send-sqaure-2`) and no plain "X" glyph — use the inline `<CloseGlyph />` SVG in `src/components/TopBar.tsx` (NOT `<Add />` rotated; that hack was rejected by the user). For chevrons use `ArrowDown2`/`ArrowRight2` Linear variant.

**Figma → page typography (verified 2026-05):**
- Onboarding intro headings (Выберите язык / Выберите свою роль / Заполните профиль / От идеи до гонорара) → 28/700/lh=28 → CSS class `.h1`.
- Page titles on lists, modals, sub-screens (Заявки / Отклики / Заказы / Уведомления / Фильтр / Лента-detail / Создать заявку / Bea Studio profile header / Выберите дату / Проверьте данные / История заказов): **20 / 500 / lh=27.6** → CSS class `.h1-page`. Some popovers are 20/700.
- Subtitles under intro headings (Позже его можно поменять / На данный момент / Эти данные нужны) → fill=#fff @ **opacity 0.6**, weight 500/16/lh≈22 → use `rgba(255,255,255,0.6)`.
- Заявки/Отклики/Заказы list spacing: H1 frame paddingBottom=12 → 12px gap to first card. Cards container item-spacing=12. Use a `display:flex; flex-direction:column; gap:12px` wrapper to avoid CSS-cascade margin issues.
- OrderCard meta-row: Figma keeps it on a single line. Use `flex-wrap:nowrap; min-width:0; overflow:hidden` on `.ocard-meta-right` and `.ocard-meta` to prevent the "По договору 12-18 апр" stack-wrap regression.
- Dev server runs on `http://localhost:5173`. Vite HMR is reliable — do not restart it between edits.
- Figma frame width is 390px; the app centers a 390px max-width `#root` on wider browsers.
