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
    recommendation: { type: 'string', enum: ['grade', 'do_not_grade', 'marginal'] },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
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
1. Estimate the likely grade if professionally graded (e.g., PSA 9, BGS 9.5, NGC MS65)
2. Estimate the value if graded at that level (based ONLY on sold comparables, never active listings)
3. Estimate typical grading cost (service fee + shipping/insurance)
4. Calculate break-even: grading_cost + current_raw_value vs estimated_graded_value
5. Recommend: "grade" if potential profit is significant (>20% of current value), "do_not_grade" if likely a loss, "marginal" if within 20%

Always include in the explanation that this is an AI estimate and not an official grading assessment.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    file_urls: photos.length > 0 ? photos : (collectible.primary_photo_url ? [collectible.primary_photo_url] : []),
    add_context_from_internet: true,
    response_json_schema: GRADE_SCHEMA,
    model: 'gemini_3_1_pro',
  });

  return result;
}