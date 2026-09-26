import { base44 } from '@/api/base44Client';

const GRADE_SCHEMA = {
  type: 'object',
  properties: {
    estimated_grade: { type: 'string' },
    grading_company: { type: 'string' },
    estimated_graded_value: { type: 'number' },
    current_raw_value: { type: 'number' },
    grading_cost: { type: 'number' },
    break_even_value: { type: 'number' },
    potential_profit: { type: 'number' },

    psa_9_value: { type: 'number' },
    psa_10_value: { type: 'number' },
    psa_9_net_change: { type: 'number' },
    psa_10_net_change: { type: 'number' },

    recommendation: {
      type: 'string',
      enum: ['grade', 'do_not_grade', 'marginal']
    },
    confidence: {
      type: 'string',
      enum: ['high', 'medium', 'low']
    },
    pricing_basis: { type: 'string' },
    explanation: { type: 'string' },
  },
};

export async function analyzeGradeWorthiness(collectible, photoUrls) {
  const photos = (photoUrls || []).filter(Boolean);
  const isGraded = !!(collectible.grading_company && collectible.grade);

  const prompt = `You are a collectibles grading consultant. Analyze this ${collectible.category_name || 'collectible'} and estimate whether professional grading is worthwhile.

CRITICAL: You are NOT an official grading service. This is an AI estimation only. Never claim to provide official grading. Clearly state this is an estimate.

Item: ${collectible.item_name}
Category: ${collectible.category_name}
Current estimated value: ${collectible.estimated_value}
Current condition: ${collectible.item_condition || collectible.box_condition || 'Not specified'}
Currently graded: ${isGraded ? `${collectible.grading_company} ${collectible.grade}` : 'Ungraded/Raw'}

${isGraded
    ? 'This item is already graded. Assess whether re-grading with a different company might yield a better result.'
    : 'Assess whether this raw item would benefit from professional grading.'}

Based on the photos and details:
1. Estimate the likely grade if professionally graded.
2. For trading cards and sports cards, use PSA as the comparison grading company.
3. For cards, estimate BOTH a PSA 9 value and PSA 10 value.
4. Estimate typical grading cost including service fee plus reasonable shipping/insurance.
5. Calculate:
   psa_9_net_change = psa_9_value - current_raw_value - grading_cost
   psa_10_net_change = psa_10_value - current_raw_value - grading_cost
6. Set estimated_graded_value to the value corresponding to the most likely estimated grade.
7. Set potential_profit to the net change corresponding to the most likely estimated grade.
8. Recommend "grade" only when the risk-adjusted economics are favorable, "do_not_grade" when grading is likely to reduce value after costs, and "marginal" when the result is close or highly grade-dependent.
9. In pricing_basis, briefly state what the estimate is based on. Never claim that live sold comparables were verified unless actual market data was supplied to you.
10. Do not invent a verified sale, auction result, population count, or PSA price-guide value.

Always include in the explanation that this is an AI estimate, the eventual PSA grade is not guaranteed, and this is not an official grading assessment.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    file_urls: photos.length > 0 ? photos : (collectible.primary_photo_url ? [collectible.primary_photo_url] : []),
    add_context_from_internet: true,
    response_json_schema: GRADE_SCHEMA,
    model: 'gemini_3_1_pro',
  });

  return result;
}