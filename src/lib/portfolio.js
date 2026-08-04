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

export function getVerifiedManualSplit(collectibles) {
  let verified = 0;
  let manual = 0;
  collectibles.forEach((c) => {
    if (c.value_type === 'verified_sold') {
      verified += c.estimated_value || 0;
    } else {
      manual += c.estimated_value || 0;
    }
  });
  return { verified, manual };
}

export function getRawGradedBreakdown(collectibles) {
  let rawValue = 0, gradedValue = 0, rawCount = 0, gradedCount = 0;
  collectibles.forEach((c) => {
    if (c.grading_company) {
      gradedValue += c.estimated_value || 0;
      gradedCount++;
    } else {
      rawValue += c.estimated_value || 0;
      rawCount++;
    }
  });
  return { rawValue, gradedValue, rawCount, gradedCount };
}

export function getRecentPriceChanges(pricingHistory, collectibles) {
  const collectibleMap = {};
  collectibles.forEach((c) => {
    collectibleMap[c.id] = c;
  });

  const historyByCollectible = {};
  pricingHistory.forEach((h) => {
    if (!historyByCollectible[h.collectible_id]) {
      historyByCollectible[h.collectible_id] = [];
    }
    historyByCollectible[h.collectible_id].push(h);
  });

  const changes = [];
  Object.entries(historyByCollectible).forEach(([id, history]) => {
    const sorted = history.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    if (sorted.length < 2) return;
    const latest = sorted[0];
    const previous = sorted[1];
    const change = latest.estimated_value - previous.estimated_value;
    if (change === 0) return;
    const collectible = collectibleMap[id];
    changes.push({
      id: latest.id,
      name: collectible?.item_name || latest.collectible_name,
      photo: collectible?.primary_photo_url,
      date: latest.created_date,
      change,
      newValue: latest.estimated_value,
      oldValue: previous.estimated_value,
    });
  });

  return changes.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getPurchaseStats(collectibles) {
  const totalCost = collectibles.reduce((sum, c) => sum + (c.purchase_cost || 0), 0);
  const totalValue = collectibles.reduce((sum, c) => sum + (c.estimated_value || 0), 0);
  return { totalCost, totalValue, gainLoss: totalValue - totalCost };
}