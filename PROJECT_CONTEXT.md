# PROJECT_CONTEXT.md

## Project
- Name: LumiDex
- Repository: https://github.com/lockgipo/lumidex
- Website URL: https://lockgipo.github.io/lumidex/
- Production version: 0.6.3 (2026-11-08); main branch, GitHub Pages root; embedded game-data snapshot 0.3.1 (22 official special-card mechanic descriptions localized)
- Deployment: GitHub Pages, main branch, root; public static site. No production backend or user accounts.
- Purpose: Traditional Chinese searchable companion reference for Lumivara Online. Unofficial.

## Implementation status
- `index.html`: responsive UI and embedded JSON dataset for mobile and desktop. v0.6.2 no longer loads or references the retired card market validation module.
- `data.json`: same game-data snapshot (88 cards / 90 monsters and Leaders / 18 maps / 72 materials).
- `manifest.webmanifest`: browser installed-web-app metadata. Not full offline support.
- Features: alias-aware search, card effects, filters, card/monster/map relationships, detail drawer, local favorites, 4-card compare.
- V0.2: all indexed 88 card / 90 monster / 18 map names have Traditional Chinese (using V107 player vocabulary as a reference) and English, 3-way display selector, cross-language search; no new IDs; previous local favorites remain compatible. Names are stored as `nameZh` / `nameEnglish` alongside unchanged canonical `name`. The old map `zh` label is preserved in `previousZh`; the new `zh` points at V107 reference wording.
- V0.3: full card equip slot arrays / tier / NPC sale value from official Wiki; 72 cards map to verified existing monster drops, 2 special-source cards (Hollow and world boss Terragorn) without inventing a map. 72 monster-specific ETC materials each have verified NPC sell prices, 30% drop rate, and a reverse link to the monster & map. Materials tab sorts by NPC sale value and shows expected NPC Silver per 100 identical-monster kills. Quick card previews in map & monster drawers show equip slot text.
- V0.4: remove per-100 monster material yield UI in list/drawers/maps while retaining material NPC unit prices and drop rates. Cards show a distinct user-recorded (not live) two-field market section: lowest current ask and actual 7-day sold average. Record is scoped by one of SEA/East Asia/EU/NA/AU, stored only in browser localStorage with timestamp and manual provenance (`lumidex-v04-market`, `lumidex-v04-region`); no unknown prices are inferred. Optional price sorting and comparison use local records. No backend or live account access.
- V0.5: translate all 22 special mechanic card effects from their official individual Wiki pages, including trigger conditions, odds, durations and restrictions. Card detail no longer claims complete effects are unavailable; it explains shared monster-only/PvP and stacking rules plus exceptions for Lunar Oracle and Terragorn. Keep 88 existing IDs, sources, slots, favorites and relations unchanged. Market functionality from local V0.4 is retained but no longer the focus.
- V0.6 published first-stage analysis: `monster-stats.json` independently snapshots official public combat stats for all 90 indexed monsters, keyed by stable monster ID; `scripts/sync-monster-stats.mjs` validates official names/levels before snapshot updates; `combat-model.js` implements verified physical/magic armor, pierce, HIT/FLEE and theoretical hits-to-kill math with unit tests; `analyzer.html` presents per-monster, map-specific relative comparisons and optional observed-hit calibration. Linked from public v0.6 index with a direct `analyzer.html` page. Pending iPhone Safari visual QA. See `docs/combat-analysis.md`.
- V0.6.1 released on `main` (from `dev/v0.6.1-card-filters`): `card-filters.js` classifies all 88 existing card effect descriptions into 14 tags, strictly distinguishes 22 conditional special mechanic cards from fixed bonuses, and filters cards by multiple effect categories (AND), verified monster drop/special/unverified source, map and slot. Map/monster drawers link directly to verified-card farming result sets. Stable IDs, original datasets, favorites and manual market records are untouched. Node tests cover data, filtering, UI interactions and backwards compatibility. Published to GitHub Pages. iPhone Safari visual QA remains pending. See `docs/card-filtering.md`.
- V0.6.3: summary stats moved above language controls and search, duplicate keyword chips removed; 14 top-level effect categories preserved, with expandable OR-within-group subfilters for primary stats, HP/SP and DEF/MDEF while retaining AND between groups. CRIT label clarifies Spell Critical usage; no independent MCRIT card effect in 88 entries. IDs, local favorites, other tabs unchanged; added regression tests.
- V0.6.4 in development on `dev/v0.6.4-mobile-ui`, not deployed to main: using OpenChatX `skills.design-taste-review` and `skills.apple-design`, compact iPhone landing information hierarchy (single-row dataset counts, simplified header, search-first); language selector and analyzer moved into a header tools popover; source/slot/map/sort grouped into collapsible advanced filters with active count/reset; five consistent SVG mobile navigation icons; no new dependencies. All 18 Node tests pass, local Chrome responsive 320/375/390/428px and desktop 900/1280px show no horizontal overflow. iPhone Safari visual/touch acceptance still pending. Do not merge to production without fresh authorization.
- V0.6.2 released on `main` (from `dev/remove-card-market`): removes all player card market UI (region, local ask/sold-average inputs, import, sorting, card detail and compare prices), the obsolete `market-snapshot.js` and CLI/testing/research files. Retains NPC sale values and existing card/monster/map features. Does not erase previously stored `lumidex-v04-market` / `lumidex-v04-region` keys from browser localStorage; it simply stops accessing them. Published to GitHub Pages.
- Historical market experiment: `scripts/passive-market-reader.ps1` remains an untracked, local-only file and is not part of LumiDex website, this branch, or any release. Do not stage, publish, run, or reintroduce it unless the user explicitly reopens that work.

## Safety
- Personal-use phase: not promoted to any community. Nonetheless GitHub repo and Pages website are publicly accessible (not private).
- Public site contains only non-sensitive game-reference data and client-side UI.
- V107 source ASAR and full 27k-term localization dictionary are **local only**, never commit binary archives, tokens, game secrets, or entire unlicensed translation dictionaries; only 196 selected short labels were referenced. If public promotion is planned, revisit source-content permission/attribution.
- Do not commit tokens/secrets, game login info, or internal local paths.
- Before modifying check main, README, PROJECT_CONTEXT, AGENTS, index, data and GitHub Pages settings.
- Keep deployment inexpensive: branch-based Pages publishing, no extra macOS build or unnecessary CI.
- Public sharing requires attribution as unofficial and ongoing scrutiny of third-party source-content rights.

## Next tasks
- Card market has been removed from the v0.6.2 public UI by user request; do not reintroduce market features or resume scraping without a new explicit request.
- Next combat-analysis step: user-side iPhone Safari visual/gesture QA on the published v0.6.3 grouped category controls; then verify ATK/MATK, skills and crit/element effects before any quantitative rankings; avoid making unjustified DPS/EXP-hour claims.
- Test on the user's actual iPhone Safari and record defects before further changes.
- Verify translation terms against in-game Traditional Chinese and reconcile erroneous drop correlations; maintain stable canonical names and IDs.
- Re-check official Wiki snapshots only when needed (manual). Avoid unauthorized game automation and do not commit credentials. Equipment valuation remains out of scope due to variable affixes and upgrades.
- Add visual assets only when licensed/permissioned; avoid scraping unlicensed images.
