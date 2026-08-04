import { base44 } from '@/api/base44Client';

export async function analyzeTrade(myItems, theirItems) {
  const myTotal = myItems.reduce((s, i) => s + (i.estimated_value || 0), 0);
  const theirTotal = theirItems.reduce((s, i) => s + (i.estimated_value || 0), 0);

  if (myItems.length === 0 || theirItems.length === 0) {
    return null;
  }

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an expert collectibles trade advisor. A collector is considering this trade:

GIVING UP (user's side):
${myItems.map((i) => `- ${i.item_name} - $${i.estimated_value || 0} (${i.category_name || 'collectible'})`).join('\n')}
Total given up: $${myTotal}

RECEIVING:
${theirItems.map((i) => `- ${i.item_name} - $${i.estimated_value || 0} (${i.category_name || 'collectible'})`).join('\n')}
Total received: $${theirTotal}

Value difference: $${Math.abs(myTotal - theirTotal)} ${myTotal > theirTotal ? '(user giving more)' : '(user receiving more)'}

Give your HONEST expert opinion. Be direct. Don't sugarcoat a bad trade.
1. Is this trade beneficial, fair, or not recommended for the user?
2. Should they trade NOW or WAIT? Consider if either side has items likely to appreciate (rookies, vintage, low pop count, trending players).
3. Any specific red flags or concerns about the items?

Keep it punchy — like a knowledgeable friend giving quick advice at a card show.`,
    response_json_schema: {
      type: 'object',
      properties: {
        recommendation: { type: 'string', enum: ['beneficial', 'fair', 'not_recommended'] },
        title: { type: 'string' },
        advice: { type: 'string' },
        timing: { type: 'string' },
        concerns: { type: 'string' }
      }
    }
  });
  return response;
}