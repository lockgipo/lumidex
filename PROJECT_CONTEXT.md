# PROJECT_CONTEXT.md

## Project
- Name: LumiDex
- Repository: https://github.com/lockgipo/lumidex
- Website URL: https://lockgipo.github.io/lumidex/
- Version: 0.2.0 (2026-11-07)
- Deployment: GitHub Pages, main branch, root; public static site. No production backend or user accounts.
- Purpose: Traditional Chinese searchable companion reference for Lumivara Online. Unofficial.

## Implementation status
- `index.html`: self-contained UI and embedded JSON dataset, responsive for mobile and desktop.
- `data.json`: same game-data snapshot (88 cards / 90 monsters and Leaders / 18 maps).
- `manifest.webmanifest`: browser installed-web-app metadata. Not full offline support.
- Features: alias-aware search, card effects, filters, card/monster/map relationships, detail drawer, local favorites, 4-card compare.
- V0.2: all indexed 88 card / 90 monster / 18 map names have Traditional Chinese (using V107 player vocabulary as a reference) and English, 3-way display selector, cross-language search; no new IDs; previous local favorites remain compatible. Names are stored as `nameZh` / `nameEnglish` alongside unchanged canonical `name`. The old map `zh` label is preserved in `previousZh`; the new `zh` points at V107 reference wording.
- Data checked: 2026-11-07. Verified vs inferred drop data is explicitly distinguished; most drop rates remain unverified.

## Safety
- Personal-use phase: not promoted to any community. Nonetheless GitHub repo and Pages website are publicly accessible (not private).
- Public site contains only non-sensitive game-reference data and client-side UI.
- V107 source ASAR and full 27k-term localization dictionary are **local only**, never commit binary archives, tokens, game secrets, or entire unlicensed translation dictionaries; only 196 selected short labels were referenced. If public promotion is planned, revisit source-content permission/attribution.
- Do not commit tokens/secrets, game login info, or internal local paths.
- Before modifying check main, README, PROJECT_CONTEXT, AGENTS, index, data and GitHub Pages settings.
- Keep deployment inexpensive: branch-based Pages publishing, no extra macOS build or unnecessary CI.
- Public sharing requires attribution as unofficial and ongoing scrutiny of third-party source-content rights.

## Next tasks
- Test on the user's actual iPhone Safari and record defects before further changes.
- Verify translation terms against in-game Traditional Chinese and reconcile erroneous drop correlations; maintain stable canonical names and IDs.
- Add data-sync validation and more source-backed individual card drop pages.
- Add visual assets only when licensed/permissioned; avoid scraping unlicensed images.
