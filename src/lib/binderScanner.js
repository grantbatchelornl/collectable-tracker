import { base44 } from '@/api/base44Client';

const BINDER_SCHEMA = {
  type: 'object',
  properties: {
    cards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          position: { type: 'number' },
          item_name: { type: 'string' },
          character_athlete_name: { type: 'string' },
          set_name: { type: 'string' },
          card_number: { type: 'string' },
          year: { type: 'number' },
          variant: { type: 'string' },
          edition: { type: 'string' },
          estimated_value: { type: 'number' },
          low_value: { type: 'number' },
          high_value: { type: 'number' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          identification_confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          identification_notes: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
  },
};

export async function scanBinderPage(photoUrl, categoryName) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Analyze this binder page photo. Detect and identify every card visible on the page.

Category: ${categoryName || 'Trading Cards'}

For each card detected:
1. Identify the card (character/athlete, set, card number, year, variant, edition)
2. Estimate its value based on sold sales only (never use active listings or asking prices)
3. Rate your identification confidence (high/medium/low)

Return an array of all detected cards. Use position numbers starting from 1 for the top-left card, counting left-to-right, top-to-bottom.

If you cannot identify a card, still include it with item_name "Unknown Card" and identification_confidence "low".

Be thorough — detect every card you can see, even partially visible ones. Do not include card sleeves or empty slots.`,
    file_urls: [photoUrl],
    add_context_from_internet: true,
    response_json_schema: BINDER_SCHEMA,
    model: 'gemini_3_1_pro',
  });

  return result;
}