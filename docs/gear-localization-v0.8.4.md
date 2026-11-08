# LumiDex v0.8.4｜裝備繁中名稱與完整職業

日期：2026-11-08。使用者授權完成後直接發布 GitHub Pages 正式版。

## 起因

iPhone Safari v0.8.3 的 Explorer 匯入裝備仍是英文（例如 `IV Katana`、`IV Night Cloak`、`III Platinum Ring`），職業選單只有 Novice + 6 基礎職業，無法選擇後續 8 種進階職業，導致過濾失準。

## 解法

- 新增 `gear-localization.js`：僅對已辨識的裝備基礎名稱增加繁中顯示對照。保留官方原文、Tier（I/II/III/IV/V 等）、精煉（+4 等）及未辨識名稱；裝備 ID、原始英文名與屬性詞條不更動。候選卡片顯示繁中主標與英文副標、身上裝備下拉也以中文／英文提示；搜尋支援中英文。
- 詞彙參考目前 LumiDex 使用的玩家中文習慣及官方英文字典。**這不是完整的 V107 中文化檔**；個別名稱如 Night Cloak、Explorer Glasses 是暫訂翻譯，需使用者核對遊戲內的實際中文顯示。未對照名稱仍顯示英文，避免錯譯。沒有複製或提交 V107 ASAR、EXE 或第三方完整翻譯表。
- `gear-picker.js` 依官方 Wiki 增加全部 15 個職業：初心者 Novice；6 基礎職業 Swordsman、Mage、Archer、Cleric、Merchant、Thief；8 進階職業 Kensei、Iron Fist、Wicked Necromancer、The King、Sinister、Templar、Nekobaku、Mamushi。
- 各職業「右手／主手武器」的**已核對**規則：
  - Novice：Knife／Sword／Hammer
  - Swordsman：Sword；Mage：Rod／Staff；Archer：Bow；Cleric：Quarterstaff；Merchant：Hammer；Thief：Knife／Dagger Pair
  - Kensei：Katana；Iron Fist：Cestus；Wicked Necromancer：Rune Grimoire；The King：Royal Tablet
  - Sinister：Twin Pistols；Templar：Lionheart Aegis；Nekobaku：Neko Flask；Mamushi：Viper Kunai
- 將職業選單改為依 `gear-picker.js` 中的單一資料來源建立，分為基礎與進階兩組。若 Explorer `classId` 不在已確認清單、裝備種類未知或防具／副手限制尚未確認，持續顯示「尚未完整確認」而不強行判定可裝備。

## 現有界線

- Explorer `classId`、`template` 已由 v0.8.3 Vercel API 回傳，這次只改靜態前端，不需要動後端或任何玩家資料。
- 依然無法直接從 Explorer 讀到每件裝備所屬套裝；需手動選擇套裝及件數。
- 卡片、怪物、地圖、材料資料集及收藏鍵 `lumidex-v1-favs` 不變。
- 顯示繁中不會改變英文字典鍵值、裝備選擇、屬性換算和傷害公式。
- 因無法取得實際遊戲完整中文化對照，本階段的繁中名稱不宣稱與使用者 V107 補丁完全一致。待實機回報逐筆核對即可。

## 來源

- 官方 Wiki 主頁：https://lumivaraonline.com/wiki/
- 官方 FAQ：https://lumivaraonline.com/faq/
- 官方裝備清單：https://lumivaraonline.com/wiki/equipment/

## 測試與發布

- `node --test`：中文／英文名稱與 Tier／精煉保留、15 職業、8 進階武器限制、未知裝備保留、中文搜尋與舊功能全量回歸。
- `git diff --check`，GitHub Actions Linux CI。
- GitHub Pages 正式部署完成後，核對首頁／比較器版本與 `gear-localization.js` 200，iPhone Safari 實測仍由使用者回報。
