import { base44 } from '@/api/base44Client';

export async function calculateGoalProgress(goal) {
  const filter = { created_by_id: goal.user_id, is_deleted: false };
  if (goal.category_name) filter.category_name = goal.category_name;
  if (goal.set_name) filter.set_name = goal.set_name;
  if (goal.character_athlete_name) filter.character_athlete_name = goal.character_athlete_name;
  if (goal.product_line) filter.product_line = goal.product_line;
  if (goal.year) filter.year = goal.year;

  const items = await base44.entities.Collectible.filter(filter, '-estimated_value', 500);
  const uniqueKeys = new Set();
  items.forEach((item) => {
    uniqueKeys.add(item.card_number || item.item_name);
  });

  const currentCount = uniqueKeys.size;
  const targetCount = goal.target_count || 1;
  const progress = Math.min(100, Math.round((currentCount / targetCount) * 100));
  const totalValue = items.reduce((s, i) => s + (i.estimated_value || 0), 0);

  return { currentCount, targetCount, progress, ownedItems: items, totalValue };
}

export async function getGoalRecommendation(goal, ownedItems) {
  const criteria = [];
  if (goal.category_name) criteria.push(`Category: ${goal.category_name}`);
  if (goal.set_name) criteria.push(`Set: ${goal.set_name}`);
  if (goal.character_athlete_name) criteria.push(`Character/Player: ${goal.character_athlete_name}`);
  if (goal.product_line) criteria.push(`Product Line: ${goal.product_line}`);
  if (goal.year) criteria.push(`Year: ${goal.year}`);

  const ownedList = ownedItems.slice(0, 50).map((i) =>
    `${i.item_name}${i.card_number ? ` (#${i.card_number})` : ''} - $${i.estimated_value || 0}`
  ).join('\n');

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `I'm a collector working on this goal: "${goal.title}"
Goal type: ${goal.goal_type}
Target: ${goal.target_count} items
Current: ${ownedItems.length} items
Criteria: ${criteria.join(', ')}

Items I already own:
${ownedList || 'None yet'}

Based on your knowledge of this collectible category:
1. What specific items am I likely missing to complete this goal? List 5-10 items with estimated values.
2. What's the most cost-effective strategy to finish?
3. What's the estimated total cost to acquire the remaining items?

Return as JSON.`,
    response_json_schema: {
      type: 'object',
      properties: {
        missing_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              estimated_value: { type: 'number' },
              rarity: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        strategy: { type: 'string' },
        estimated_total_cost: { type: 'number' }
      }
    }
  });
  return response;
}