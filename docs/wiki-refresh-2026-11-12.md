# LumiDex 官方圖鑑同步與中文化 — 2026-11-12（v0.8.7）

## 發布界線
- 來源：`dev/wiki-refresh-20261112`，從 GitHub `main` v0.8.6 建立隔離工作樹，保護原本未提交的其他修改。
- 本版經使用者明確授權發布至 GitHub Pages 正式站（資料快照 v0.4.0）。Vercel Explorer API 與正式遊戲資料沒有修改。
- 不重啟玩家市場價錢追蹤；不變更裝備傷害收益公式／ATK% 同乘區假設。

## 官方資料核對
2026-11-12 逐頁校對的公開來源：
- [100 張官方卡片](https://lumivaraonline.com/wiki/cards/)
- [100 種官方怪物（含 Leader）](https://lumivaraonline.com/wiki/monsters/)
- [20 張官方地圖](https://lumivaraonline.com/wiki/maps/)
- [官方 Wiki 物品／掉落／NPC 收購價表](https://lumivaraonline.com/wiki/)

| 資料種類 | 原始 v0.8.6 | 本次 v0.8.7 | 增量 |
|---|---:|---:|---:|
| 卡片 | 88 | 100 | +12 |
| 怪物及 Leader | 90 | 100 | +10（8 種普通怪，2 位 Leader） |
| 地圖 | 18 | 20 | +2 |
| 專屬材料 | 72 | 80 | +8 |
| 特殊機制卡 | 22 | 30 | +8 |

新增地圖與原文：
- `Frostbell Toyworks`（霜鈴玩具工廠，**暫譯**）：Gingerbread Man、Wind-up Teddy、Jack-in-the-Box、Nutcracker Soldier，以及 Leader Nutcracker Soldier。
- `Frostbell Chocolate Works`（霜鈴巧克力工廠，**暫譯**）：Gummy Bear、Cocoa Imp、Marshmallow Brute、Chocolate Golem，以及 Leader Chocolate Golem。
- 所有新怪物的 HP、ATK、MATK、DEF/MDEF、FLEE、HIT、EXP、元素及重生秒數，皆由官方個別怪物頁解析；以名稱／等級校驗後才寫入 `monster-stats.json`。
- 新增 8 件專屬材料及 30% 掉率，NPC 收購價依官方 Wiki 的 ETC 掉落表核對：99／101／105／110 Silver。

## 修正官方卡片名稱／屬性
**這次不是只加 13 張卡片**。原本舊資料將 4 張 `lm01p` 物理系卡片命名為 Fox／Empress，官方目前是 Dragon 系列；同時官方另有 4 張 `lm01m` 魔法系 Fox／Arcane Piercer，兩套卡不同。

| 保留的原 card ID | 既有（舊）名稱 | 本次官方英文正名 |
|---|---|---|
| `card-crystal-fox` | Crystal Fox Card | Crystal Dragon Card |
| `card-rose-fox` | Rose Fox Card | Rose Dragon Card |
| `card-golden-fox` | Golden Fox Card | Golden Dragon Card |
| `card-pierce-empress` | Pierce Empress Card | Pierce Dragon Card |

- 保留這 4 個既有 ID，舊收藏 `lumidex-v1-favs` 不失效；搜尋同時支援 `previousName`／`previousNameZh`。物理卡原本所屬的 Wiki `lm01p` 來源網址仍不變。
- 新增的魔法系卡使用獨立 ID：`card-crystal-fox-arcane`、`card-rose-fox-arcane`、`card-golden-fox-arcane`、`card-arcane-piercer`，對應官方 `lm01m`；效果為 MATK%／**MCRIT**／魔法穿透，不能以 ATK／CRIT／物理穿透來過濾。
- Crimson Knight、Bloodcrystal Dragon、Critical King 官網亦包含 MCRIT；補回文字效果及原文。
- `card-filters.js` 增加獨立 `magicCritRate` 類別，共 15 種分類；MCRIT 不誤判為 CRIT，條件型特殊機制卡不冒充固定增益。
- 8 張 Frostbell 特殊機制卡均按個別 Wiki 詳情的概率、持續時間、Leader／Boss 限制與 PvP 例外整理；與 30 張特殊機制卡一樣不自動換算為固定傷害。

## 中文化來源與未驗收項
- 本機只讀參考的是目前小黑窗 **v119** 的 `app.asar`，僅檢查本站需要的少量英文名稱對照。原有 Crystal Fox、Pierce Empress 等舊名稱存在，但未查到 Gingerbread Man、Frostbell、Golden Dragon、Arcane Piercer 等新用語對照；不能宣稱 2026-11-12 的新增譯名與 v119 一致。
- 新增卡片／怪物／地圖／材料由本站暫擬繁體中文名稱，`nameZh` 加「（暫譯）」；原英文、官方 Wiki URL 與穩定 ID 仍保留。
- **沒有提交、上傳或分發** 小黑窗的 ASAR、EXE、完整字典或作者私有內容；待日後小黑窗更新或遊戲畫面可核對時，只修改相關精簡名稱映射。
- 新 8 張特殊卡的數值是從官方說明整理；中文語句仍需對照實際遊戲效果。尤其 Marshmallow Brute 對「超出 MaxHP 15% 部分減傷 50%」及與其他減傷卡組合上限 30% 的解釋應以官方最終規則與實測為準。
- 正式驗收待辦：iPhone Safari 卡片／怪物／地圖搜尋、篩選、詳情抽屜、收藏保留、快捷計算機能選 141–150 地圖；ATK% 獨立實測依原指引處理。

## 低成本驗證及維護
```sh
node scripts/inspect-official-delta.mjs
node scripts/inspect-official-delta.mjs --verify-cards
node scripts/sync-wiki-catalog.mjs --check
node scripts/sync-monster-stats.mjs --check
node --test
git diff --check
```
- `sync-wiki-catalog.mjs --write` 僅在官方索引仍是 100／100／20、所選個別頁面與固定中文映射通過核對時更新 `data.json` 和 `index.html` 內嵌資料。若官方將來新增資料，須先檢查與調整明確映射，不能默默把未知卡片歸到舊名稱。
- `sync-monster-stats.mjs --write` 只有全部 100 怪物官方頁均符合名稱與等級才寫入統計快照。
- 所有測試只跑 Node（Linux CI）。本階段沒有任何需要 macOS／Xcode 的操作。
