const MarketSnapshot = (() => {
  'use strict';

  const regions = new Set(['SEA', 'East Asia', 'EU', 'NA', 'AU']);

  function utcTime(value, field) {
    const match = typeof value === 'string' && /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{3}))?Z$/.exec(value);
    if (!match) throw new Error(field + ' 必須是 UTC 時間，例如 2026-11-08T01:00:00Z');
    const canonical = match[1] + '.' + (match[2] ?? '000') + 'Z';
    const date = new Date(canonical);
    if (!Number.isFinite(date.valueOf()) || date.toISOString() !== canonical) {
      throw new Error(field + ' 不是有效的日期時間');
    }
    return canonical;
  }

  function validateSnapshot(input, catalog) {
    const cardIds = new Set(catalog.map(card => card.id));
    if (!input || input.version !== 1 || input.source !== 'manual' || input.currency !== 'Silver') {
      throw new Error('行情批次須使用 version 1、manual 來源和 Silver 幣別');
    }
    if (!regions.has(input.region)) throw new Error('未知的市場區域');

    const startedAt = utcTime(input.startedAt, 'startedAt');
    const finishedAt = utcTime(input.finishedAt, 'finishedAt');
    if (finishedAt < startedAt) throw new Error('觀察結束時間早於開始時間');

    if (!Array.isArray(input.cards) || input.cards.length === 0) {
      throw new Error('至少需要一筆已查核的卡片紀錄');
    }

    const observations = new Map();
    for (const [index, row] of input.cards.entries()) {
      const { cardId, lowestAsk } = row ?? {};
      if (!cardIds.has(cardId)) throw new Error('第 ' + (index + 1) + ' 筆的卡片 ID 無法對應圖鑑');
      if (observations.has(cardId)) throw new Error('卡片重複：' + cardId);
      if (lowestAsk !== null && (!Number.isSafeInteger(lowestAsk) || lowestAsk < 1 || lowestAsk > 1e12)) {
        throw new Error(cardId + ' 的最低掛賣價必須是 1 至 1 兆的整數，或用 null 表示已確認無掛單');
      }
      observations.set(cardId, { cardId, lowestAsk });
    }

    const cards = [...observations.values()].sort((a, b) => a.cardId.localeCompare(b.cardId, 'en'));
    const priced = cards.filter(row => row.lowestAsk !== null).length;
    return {
      version: 1,
      source: 'manual',
      currency: 'Silver',
      region: input.region,
      startedAt,
      finishedAt,
      coverage: {
        priced,
        noListings: cards.length - priced,
        unobserved: catalog.length - cards.length,
        total: catalog.length,
      },
      cards,
    };
  }

  return { validateSnapshot };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MarketSnapshot;
