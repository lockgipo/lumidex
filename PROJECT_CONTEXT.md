# PROJECT_CONTEXT.md

## Project
- Name: LumiDex
- Repository: https://github.com/lockgipo/lumidex
- Website URL: https://lockgipo.github.io/lumidex/
- Version: 0.4.0 (2026-11-08); embedded game-data snapshot remains 0.3.0 (no game-data changes)
- Deployment: GitHub Pages, main branch, root; public static site. No production backend or user accounts.
- Purpose: Traditional Chinese searchable companion reference for Lumivara Online. Unofficial.

## Implementation status
- `index.html`: self-contained UI and embedded JSON dataset, responsive for mobile and desktop.
- `data.json`: same game-data snapshot (88 cards / 90 monsters and Leaders / 18 maps / 72 materials).
- `manifest.webmanifest`: browser installed-web-app metadata. Not full offline support.
- Features: alias-aware search, card effects, filters, card/monster/map relationships, detail drawer, local favorites, 4-card compare.
- V0.2: all indexed 88 card / 90 monster / 18 map names have Traditional Chinese (using V107 player vocabulary as a reference) and English, 3-way display selector, cross-language search; no new IDs; previous local favorites remain compatible. Names are stored as `nameZh` / `nameEnglish` alongside unchanged canonical `name`. The old map `zh` label is preserved in `previousZh`; the new `zh` points at V107 reference wording.
- V0.3: full card equip slot arrays / tier / NPC sale value from official Wiki; 72 cards map to verified existing monster drops, 2 special-source cards (Hollow and world boss Terragorn) without inventing a map. 72 monster-specific ETC materials each have verified NPC sell prices, 30% drop rate, and a reverse link to the monster & map. Materials tab sorts by NPC sale value and shows expected NPC Silver per 100 identical-monster kills. Quick card previews in map & monster drawers show equip slot text.
- V0.4: remove per-100 monster material yield UI in list/drawers/maps while retaining material NPC unit prices and drop rates. Cards show a distinct user-recorded (not live) two-field market section: lowest current ask and actual 7-day sold average. Record is scoped by one of SEA/East Asia/EU/NA/AU, stored only in browser localStorage with timestamp and manual provenance (`lumidex-v04-market`, `lumidex-v04-region`); no unknown prices are inferred. Optional price sorting and comparison use local records. No backend or live account access.
- Data checked: 2026-11-08. Explorer publicly offers rare item/limited card Gold auctions and Gold exchange, but not general Silver card listings. Game FAQ mentions actual sale-volume weighted 7-day card price for detach fee, but it is not confirmed as a public read-only API. **NPC values and Gold auction bids are not comparable to normal player card prices**. No auto-sync scheduled.

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
- Re-check official Wiki snapshots only when needed (manual). For any future auto-price source, confirm authorized/public read-only access, market region, freshness, actual trades vs asking prices, and transaction volume before feeding the UI; do not scrape authenticated game sessions or commit credentials. If verified, replace manual records with clearly sourced automated snapshots without mixing Silver and Gold. Equipment prices remain out-of-scope due to high-dimensional affixes and upgrades.
- Add visual assets only when licensed/permissioned; avoid scraping unlicensed images.
