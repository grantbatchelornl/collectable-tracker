export function buildPortfolioTimeSeries(collectibles, pricingHistory) {
  if (!collectibles.length || !pricingHistory.length) return [];

  const historyByCollectible = {};
  pricingHistory.forEach((h) => {
    if (!historyByCollectible[h.collectible_id]) {
      historyByCollectible[h.collectible_id] = [];
    }
    historyByCollectible[h.collectible_id].push(h);
  });

  Object.values(historyByCollectible).forEach((h) => {
    h.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  });

  const allDates = new Set();
  Object.values(historyByCollectible).forEach((history) => {
    history.forEach((h) => allDates.add(new Date(h.created_date).getTime()));
  });

  const sortedDates = Array.from(allDates).sort((a, b) => a - b);

  const series = [];
  for (const date of sortedDates) {
    let total = 0;
    for (const collectible of collectibles) {
      const history = historyByCollectible[collectible.id] || [];
      let value = 0;
      for (const h of history) {
        if (new Date(h.created_date).getTime() <= date) {
          value = h.estimated_value;
        } else break;
      }
      total += value;
    }
    series.push({ date, value: total });
  }

  return series;
}

export function getCategoryBreakdown(collectibles, categories) {
  const breakdown = {};
  collectibles.forEach((c) => {
    const catName = c.category_name || 'Uncategorized';
    breakdown[catName] = (breakdown[catName] || 0) + (c.estimated_value || 0);
  });
  return Object.entries(breakdown)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function getTopMovers(collectibles, pricingHistory) {
  const historyByCollectible = {};
  pricingHistory.forEach((h) => {
    if (!historyByCollectible[h.collectible_id]) {
      historyByCollectible[h.collectible_id] = [];
    }
    historyByCollectible[h.collectible_id].push(h);
  });

  const movers = collectibles
    .map((c) => {
      const history = (historyByCollectible[c.id] || []).sort(
        (a, b) => new Date(a.created_date) - new Date(b.created_date)
      );
      if (history.length < 2) return null;
      const prev = history[history.length - 2].estimated_value;
      const curr = history[history.length - 1].estimated_value;
      if (prev === 0) return null;
      const change = curr - prev;
      const percent = (change / prev) * 100;
      return { collectible: c, change, percent };
    })
    .filter(Boolean);

  const gainers = movers
    .filter((m) => m.change > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);
  const losers = movers
    .filter((m) => m.change < 0)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 5);

  return { gainers, losers };
}