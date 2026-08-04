import { base44 } from '@/api/base44Client';

const RECOMMENDATION_SCHEMA = {
  type: 'object',
  properties: {
    recommendation: { type: 'string', enum: ['buy', 'hold', 'trade', 'sell'] },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    explanation: { type: 'string' },
    key_factors: { type: 'array', items: { type: 'string' } },
  },
};

export async function getActionRecommendation(collectible, collection, pricingHistory) {
  const validItems = (collection || []).filter((c) => !c.is_deleted);
  const totalValue = validItems.reduce((s, c) => s + (c.estimated_value || 0), 0);
  const duplicates = validItems.filter(
    (c) => c.item_name === collectible.item_name && c.id !== collectible.id
  );

  const recentHistory = (pricingHistory || [])
    .filter((h) => h.collectible_id === collectible.id)
    .slice(0, 10)
    .map((h) => `${h.created_date}: ${h.estimated_value} (${h.value_type})`);

  const prompt = `You are a collectibles advisor. Analyze this item and recommend an action: buy more, hold, trade, or sell.

CRITICAL: Never predict guaranteed profits. All recommendations are based on historical data and market trends. Clearly state that past performance does not guarantee future results. This is not financial advice.

Item details:
- Name: ${collectible.item_name}
- Category: ${collectible.category_name}
- Estimated value: ${collectible.estimated_value}
- Purchase cost: ${collectible.purchase_cost || 0}
- Value type: ${collectible.value_type || 'manual'}
- Value confidence: ${collectible.value_confidence || 'low'}
- Is stale: ${collectible.is_stale}
- For sale: ${collectible.for_sale}
- Graded: ${collectible.grading_company ? `${collectible.grading_company} ${collectible.grade}` : 'Raw/Ungraded'}

Portfolio context:
- Total items: ${validItems.length}
- Total portfolio value: ${totalValue.toFixed(2)}
- This item as % of portfolio: ${totalValue > 0 ? ((collectible.estimated_value / totalValue) * 100).toFixed(1) : 0}%
- Duplicates of this item: ${duplicates.length}

Recent price history for this item:
${recentHistory.length > 0 ? recentHistory.join('\n') : 'No pricing history available'}

Analyze these factors:
1. Value trend (up/down/stable based on history)
2. Profit/loss vs purchase cost
3. Portfolio concentration (is this item too large a % of portfolio?)
4. Duplicate holdings (do they own multiple of this item?)
5. Data quality (verified sold vs manual pricing, stale status)
6. Whether selling makes sense if for_sale

Provide a clear recommendation (buy/hold/trade/sell) with confidence level and explanation. Include 2-4 key factors.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: RECOMMENDATION_SCHEMA,
    model: 'gemini_3_1_pro',
  });

  return result;
}