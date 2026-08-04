import { base44 } from '@/api/base44Client';

export async function askCollectorAI(question, collectibles, pricingHistory) {
  const validItems = (collectibles || []).filter((c) => !c.is_deleted);

  const collectionSummary = validItems.slice(0, 50).map((c) => ({
    name: c.item_name,
    category: c.category_name,
    value: c.estimated_value,
    value_type: c.value_type,
    purchase_cost: c.purchase_cost,
    confidence: c.value_confidence,
    year: c.year,
    set_name: c.set_name,
    character: c.character_athlete_name,
    team: c.team,
    is_stale: c.is_stale,
  }));

  const totalValue = validItems.reduce((s, c) => s + (c.estimated_value || 0), 0);
  const verifiedValue = validItems
    .filter((c) => c.value_type === 'verified_sold')
    .reduce((s, c) => s + (c.estimated_value || 0), 0);
  const manualValue = totalValue - verifiedValue;
  const totalCost = validItems.reduce((s, c) => s + (c.purchase_cost || 0), 0);

  const categoryBreakdown = {};
  validItems.forEach((c) => {
    const cat = c.category_name || 'Uncategorized';
    if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { count: 0, value: 0 };
    categoryBreakdown[cat].count++;
    categoryBreakdown[cat].value += c.estimated_value || 0;
  });

  const mostValuable = [...validItems]
    .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
    .slice(0, 5)
    .map((c) => ({ name: c.item_name, value: c.estimated_value }));

  const recentHistory = (pricingHistory || [])
    .slice(0, 20)
    .map((h) => ({
      name: h.collectible_name,
      value: h.estimated_value,
      date: h.created_date,
      type: h.value_type,
    }));

  const prompt = `You are a collector's AI assistant. Answer the user's question using ONLY their collection data provided below. Do not make up information or invent data.

COLLECTION SUMMARY:
- Total items: ${validItems.length}
- Total value: ${totalValue.toFixed(2)}
- Verified sold value: ${verifiedValue.toFixed(2)}
- Manual value: ${manualValue.toFixed(2)}
- Total purchase cost: ${totalCost.toFixed(2)}
- Profit/Loss: ${(totalValue - totalCost).toFixed(2)}

CATEGORY BREAKDOWN:
${JSON.stringify(categoryBreakdown, null, 2)}

TOP 5 MOST VALUABLE:
${JSON.stringify(mostValuable, null, 2)}

ALL ITEMS (first 50):
${JSON.stringify(collectionSummary, null, 2)}

RECENT PRICING HISTORY (last 20):
${JSON.stringify(recentHistory, null, 2)}

USER QUESTION: ${question}

Answer based ONLY on the data above. If the question cannot be answered from this data, say so clearly. Be specific and use exact numbers. For "missing set pieces" questions, identify items that share a set_name and suggest what might be missing. For "best trade" questions, suggest items that are duplicates or have low confidence values.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    model: 'gemini_3_1_pro',
  });

  return result;
}