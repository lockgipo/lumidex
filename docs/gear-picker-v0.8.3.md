# LumiDex v0.8.3 開發規格｜裝備挑選器與官方資料欄位

狀態：**Dev／尚未上正式**（2026-11-08），正式版本仍是 v0.8.2。關聯 PR #5： https://github.com/lockgipo/lumidex/pull/5

## 實際查證（不是推測）

由 GitHub Actions 在獨立的 read-only 驗證工作中讀取官方公開 Explorer `/api/explorer/player?name=Gipo`。僅輸出欄位結構、出現次數與少量非私密的裝備類型代碼，沒有上傳個人原始物品／裝備清單。

- Gipo 裝備 842 件：背包 264、倉庫 578；背包 10 件有 `worn: true`。
- 原始每件裝備欄位：`name`、`serial`、`slot`、`bonuses`、`top`；其中 834 件有 `tier`、457 件有 `template`、834 件有 `finder`、少數有 `cards`／`refine`／`worn`。
- `template` 值的實例：`obsidian_ring`、`sword`、`cestus`、`bow`、`hammer`、`rod`、`staff` 等，**是裝備種類，不是套裝名稱**。`top` 是如 `resBleed` 的能力代碼陣列，也非套裝。
- 此 API 裝備物件**沒有** `set`／`setName`／`setId`、適用職業、裝備需求等級的獨立欄位。不能透過同名、Tier 或 `top` 猜測套裝。
- 角色層級的 `classId` 為 `"archer"` 這種字串，v0.8.2 的 `Number.isInteger(p.classId)` 會誤將它變成 `null`。
- 公開 `serial` 為單件識別用途，仍只在當次瀏覽器記憶體處理，**不會保存於 Git 或 localStorage**；尚未驗證跨角色或跨時間的唯一性。

## 資料過濾策略

- Dev `edge/explorer-proxy.mjs` 僅回傳名稱、職業、等級、`gear`／`storage.gear` 及必要裝備欄位：`serial`、`template`、`top`、`slot`、`tier`、`worn`、`bonuses`、`cards`、`refine`。
- **不返回** `finder`（可能涉及其他人名稱）、貨幣、消耗品、交易、登入或帳戶資料。原始 API 沒有的套裝歸屬不會捏造。
- 前端 `explorer-import.js` 驗證欄位、保留裝備來源，`gear-picker.js` 提供職業判斷與詞條排序。
- 部署中的 Vercel API 仍是 **v0.8.2 舊過濾程式**，未重新部署；前端在 classId 缺失時，對獨佔武器（例：Bow）只做保守的職業推測，其他情況不強迫篩選。

## 手機選裝介面

1. 仍以 Gipo 輸入角色名稱一鍵匯入，預設 A 是穿戴的 10 件裝備之一。
2. 候選由原生長下拉改為可點擊的卡片：名稱、背包／倉庫來源與原清單位置、Tier、精煉及主要能力詞條。
3. 可以依 DEX、ATK、物理穿透、爆傷、HIT、AGI、INT、MATK 排序，搜尋名字／詞條／數值，切換背包／倉庫。
4. 自動辨識已知 `archer` 職業，或依穿戴 Bow 近似推測；預設隱藏官方明確規定不可用的主武器，如 Sword、Cestus、Kunai。可取消篩選查看其他職業裝備。
5. 只對官方已核對的一部分職業套用武器表；其他職業、未確認主武器、所有未確認副手與防具限制標記「未完整確認」，避免誤判。
6. 同一名稱與詞條若重複，依來源及原清單位置辨識；畫面一次顯示 24 件並可載入更多。選定 B 後保留 v0.8.2 的 A/B 差異計算，不自動更改遊戲裝備。

## 套裝（v0.8.3 手動設定，官方規則）

官方 Wiki 的 Gear Sets 規則明確存在，共 11 套，依 2／4／6 件啟動；不同 Tier 可混搭。**Explorer 此公開角色端點沒有逐件套裝歸屬**，不會自行推測套裝或認定沒有套裝。

新增 `gear-sets.js` 與 `tradeoff.html` 的「套裝效果（選填）」：
- A（目前）與 B（替換後）分開設定，使用者可新增多個套裝及各自穿戴件數；A 可一鍵複製到 B。每側合計不得超過 6 件（頭上、頭中、頭下、身體、披肩、鞋子）。不含武器、盾、飾品、商店／商城裝備與損壞的裝備。
- 2 件套裝（Warlord、Archmage、Lucky Star、Iron Bastion、Executioner、Armor Breaker、Spellbreaker）每滿 2 件啟動一層，最多 3 層（2/4/6 件）；4 件套裝（Phantom Dancer、Hawkeye、Mystic Sage）滿 4 件啟動一次；6 件套裝（Blood Lord）滿 6 件啟動一次。
- 未達標顯示「尚未啟動」；已達標即時列出效果。**預設不把套裝加進傷害比較**，只有使用者勾選「我已核對 A／B 套裝件數」才加入已知效益。頁面內存，不儲存 localStorage／遠端資料，也不會修改遊戲裝備。
- 可直接加入條件模型：Warlord／Archmage／Hawkeye 等 ATK%／MATK%，Armor Breaker／Spellbreaker 穿透，Executioner 爆傷，Hawkeye HIT，Mystic Sage DEX（變動時仍需面板校準），Blood Lord 的 0.7 傷害倍率。使用者填寫的 A/B 手動數值應**不含套裝加成**，避免重複計算。
- Lucky Star 的 CRIT 是點數而非技能實際爆擊率：若 A/B 的套裝 CRIT 點數不同且技能可爆擊，總效益暫不顯示。FLEE、HP、DEF、MDEF、SP 恢復、負重、移動速度、吸血與 SP 消耗只顯示，不會誤算為每次攻擊傷害或 EXP/h。
- 由於 2/4/6 件規則是從 Wiki 讀取的靜態快照，遊戲改版時需人工更新。UI 顯示官方 Wiki 連結，方便核對。

手動設定不代表 API 可取得套裝欄位；本階段不對單件裝備自動標註所屬套裝。

## 測試與發布界線

- 純函式單元測試涵蓋 Archer 務必只看 Bow、不同武器不因同 `slot: "sword"` 就視為相容、未知職業不亂過濾、詞條排序、來源搜尋、文字職業代碼、公開裝備欄位裁減及 XSS 安全顯示。
- Linux CI `node --test`，暫時性的公開 API 欄位調查步驟已完成，最後應從 workflow 移除避免每次 PR 重複查詢。
- **尚未發布 main／GitHub Pages，尚未更新正式 Vercel Function。** 待使用者同意發布再安排後端更新及 iPhone Safari 實測。
