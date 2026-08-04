import { base44 } from '@/api/base44Client';

export async function generateChecklist(category, setName, franchise, series) {
  const context = series
    ? `${franchise} ${series} (every ${franchise} Pop released in ${series})`
    : `${franchise} ${setName}`;

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `Generate the complete collectible checklist for: ${context}

List every item in the set/series. Include:
- number: The card/item number (e.g., "1/102", "001", etc.)
- name: The full name of the item
- rarity: The rarity (e.g., "Common", "Uncommon", "Rare", "Rare Holo", "Secret Rare", etc.)

Be as complete and accurate as possible. Include all known items in the set.
If this is a Funko series, list every Pop figure in that series.
If this is a coin set, list every coin (e.g., each state quarter).
If this is sports cards, list every card in the set.`,
    model: 'gemini_3_flash',
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              number: { type: 'string' },
              rarity: { type: 'string' },
            },
          },
        },
        total_count: { type: 'number' },
      },
    },
  });

  return {
    items: response.items || [],
    total_count: response.total_count || (response.items || []).length,
  };
}

export function matchChecklist(checklist, collectibles, watchlist) {
  return checklist.map((item) => {
    const ownedMatches = collectibles.filter((c) => {
      const cName = (c.item_name || '').toLowerCase();
      const iName = (item.name || '').toLowerCase();
      return cName.includes(iName) || iName.includes(cName);
    });
    const owned = ownedMatches[0];
    const duplicateCount = ownedMatches.length;
    const isGraded = !!owned?.grading_company;

    const wished = watchlist.find((w) => {
      const wName = (w.item_name || '').toLowerCase();
      const iName = (item.name || '').toLowerCase();
      return wName.includes(iName) || iName.includes(wName);
    });

    let status = 'missing';
    if (owned) {
      status = 'owned';
    } else if (wished) {
      status = 'wishlisted';
    }

    return { ...item, status, collectible: owned, isGraded, duplicateCount, ownedMatches };
  });
}

export function calculateCompletion(matchedChecklist) {
  const total = matchedChecklist.length;
  const owned = matchedChecklist.filter((i) => i.status === 'owned').length;
  const missing = matchedChecklist.filter((i) => i.status === 'missing').length;
  const wishlisted = matchedChecklist.filter((i) => i.status === 'wishlisted').length;
  const graded = matchedChecklist.filter((i) => i.isGraded).length;
  const duplicates = matchedChecklist.filter((i) => i.duplicateCount > 1).length;
  const percent = total > 0 ? Math.round((owned / total) * 100) : 0;

  return { total, owned, missing, wishlisted, graded, duplicates, percent };
}

export async function wishlistAllMissing(binder, user, matchedChecklist) {
  const missing = matchedChecklist.filter((item) => item.status === 'missing');
  if (missing.length === 0) return 0;

  const items = missing.map((item) => ({
    user_id: user.id,
    item_name: item.name,
    category_name: binder.category,
    status: 'active',
    priority: 'medium',
    visibility: 'private',
  }));

  await base44.entities.Watchlist.bulkCreate(items);
  return missing.length;
}

export async function wishlistSingleItem(binder, user, item) {
  await base44.entities.Watchlist.create({
    user_id: user.id,
    item_name: item.name,
    category_name: binder.category,
    status: 'active',
    priority: 'medium',
    visibility: 'private',
  });
}

export async function estimateMissingItemsCost(missingItems, binder) {
  if (missingItems.length === 0) {
    return { items: [], total_estimated_cost: 0, total_median_cost: 0, lowest_market_price: 0 };
  }

  const itemList = missingItems
    .map((i) => `${i.number || '?'} ${i.name} (${i.rarity || 'Unknown rarity'})`)
    .join('\n');

  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `Estimate the market value of each missing collectible in this set:

${itemList}

Set: ${binder.franchise} ${binder.set_name}

For each item, provide:
- name: The item name (must match the input)
- number: The item number (must match the input)
- estimated_price: Current market value based on recent sold listings (in USD)
- median_price: Median sold price (in USD)
- difficulty: How hard to find (one of: "easy", "moderate", "hard", "very_hard", "grail")

Also provide totals:
- total_estimated_cost: Sum of all estimated_price values
- total_median_cost: Sum of all median_price values
- lowest_market_price: The single lowest item price found`,
    model: 'gemini_3_flash',
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              number: { type: 'string' },
              estimated_price: { type: 'number' },
              median_price: { type: 'number' },
              difficulty: { type: 'string' },
            },
          },
        },
        total_estimated_cost: { type: 'number' },
        total_median_cost: { type: 'number' },
        lowest_market_price: { type: 'number' },
      },
    },
  });

  return response;
}

export function mergeCostEstimates(matchedChecklist, costEstimates) {
  if (!costEstimates?.items) return matchedChecklist;
  const estimateMap = {};
  costEstimates.items.forEach((e) => {
    const key = (e.name || '').toLowerCase();
    estimateMap[key] = e;
  });

  return matchedChecklist.map((item) => {
    const key = (item.name || '').toLowerCase();
    const estimate = estimateMap[key];
    if (estimate) {
      return {
        ...item,
        estimated_price: estimate.estimated_price || 0,
        median_price: estimate.median_price || 0,
        difficulty: estimate.difficulty || 'moderate',
      };
    }
    return item;
  });
}

export function getDuplicateSuggestions(matchedChecklist) {
  return matchedChecklist.filter((i) => i.duplicateCount > 1).map((item) => {
    const tradeCount = Math.max(0, item.duplicateCount - 2);
    const keepCount = item.duplicateCount - tradeCount;
    return {
      ...item,
      owned: item.duplicateCount,
      trade: tradeCount,
      keep: keepCount,
      tradeableIds: (item.ownedMatches || []).slice(keepCount).map((c) => c.id),
    };
  });
}

const MILESTONES = [10, 25, 50, 75, 90, 95, 100];

export async function checkAndNotifyMilestones(binder, completion, user) {
  const percent = completion.percent;
  const lastNotified = binder.last_milestone_notified || 0;

  const crossed = MILESTONES.filter((m) => percent >= m).pop();
  if (!crossed || crossed <= lastNotified) return null;

  try {
    await base44.entities.CollectionBinder.update(binder.id, {
      last_milestone_notified: crossed,
      owned_count: completion.owned,
      completion_percent: percent,
    });
  } catch (e) {
    // non-critical
  }

  let title, body;
  if (crossed === 100) {
    title = `Binder Complete! ${binder.name}`;
    body = `You've completed your ${binder.name} binder! 🎉`;
  } else {
    title = `${binder.name} — ${crossed}% Complete!`;
    body = completion.missing > 0 && completion.missing <= 10
      ? `You are ${completion.missing} cards away from completion.`
      : `Great progress on your ${binder.name} binder!`;
  }

  try {
    await base44.entities.Notification.create({
      recipient_id: user.id,
      type: 'binder_milestone',
      title,
      body,
      destination_route: `/binder/${binder.id}`,
      destination_id: binder.id,
      icon: '🎉',
    });
  } catch (e) {
    // non-critical
  }

  return { milestone: crossed, title, body };
}

export async function updateBinderStats(binder, completion) {
  if (
    binder.owned_count === completion.owned &&
    binder.completion_percent === completion.percent
  ) {
    return;
  }
  try {
    await base44.entities.CollectionBinder.update(binder.id, {
      owned_count: completion.owned,
      completion_percent: completion.percent,
    });
  } catch (e) {
    // non-critical
  }
}

/**
 * Handles 100% binder completion:
 * - Records the completion date
 * - Takes a snapshot of the completed binder state
 * - Awards a completion achievement badge (via backend function)
 * - Creates a Hall of Fame entry (binder stays in My Binders)
 * Returns { newlyCompleted, snapshot } if this is a newly detected completion.
 */
export async function handleBinderCompletion(binder, completion, user, matchedChecklist) {
  if (completion.percent !== 100) return { newlyCompleted: false };

  // Already completed before — don't re-celebrate
  if (binder.completion_date) return { newlyCompleted: false };

  // Build a snapshot of the completed binder
  const ownedItems = matchedChecklist.filter((i) => i.status === 'owned' && i.collectible);
  const collectionValue = ownedItems.reduce((sum, i) => sum + (i.collectible?.estimated_value || 0), 0);

  const snapshot = {
    binder_name: binder.name,
    franchise: binder.franchise,
    set_name: binder.set_name,
    category: binder.category,
    completion_date: new Date().toISOString().split('T')[0],
    total_items: completion.total,
    owned_items: completion.owned,
    graded_items: completion.graded,
    collection_value: collectionValue,
    items: ownedItems.map((i) => ({
      name: i.name,
      number: i.number,
      rarity: i.rarity,
      item_name: i.collectible?.item_name,
      estimated_value: i.collectible?.estimated_value || 0,
      grading_company: i.collectible?.grading_company,
      grade: i.collectible?.grade,
      primary_photo_url: i.collectible?.primary_photo_url,
      purchase_cost: i.collectible?.purchase_cost || 0,
    })),
  };

  try {
    // Call the backend function to handle secure operations:
    // - Record completion date + snapshot
    // - Award achievement badge (requires service role)
    // - Create Hall of Fame entry
    // - Send notification
    const response = await base44.functions.invoke('completeBinder', {
      binder_id: binder.id,
      snapshot,
      collection_value: collectionValue,
      total_items: completion.total,
      graded_items: completion.graded,
    });

    if (response.data?.already_completed) {
      return { newlyCompleted: false };
    }

    return {
      newlyCompleted: true,
      snapshot: {
        completion_date: response.data?.completion_date || snapshot.completion_date,
        collection_value: collectionValue,
      },
    };
  } catch (e) {
    console.error('Failed to handle binder completion:', e);
    return { newlyCompleted: false };
  }
}

export async function checkBinderMatch(collectibleName, user) {
  const binders = await base44.entities.CollectionBinder.filter({ user_id: user.id });
  for (const binder of binders) {
    if (!binder.checklist_json) continue;
    try {
      const checklist = JSON.parse(binder.checklist_json);
      const match = checklist.find((item) => {
        const iName = (item.name || '').toLowerCase();
        const cName = (collectibleName || '').toLowerCase();
        return cName.includes(iName) || iName.includes(cName);
      });
      if (match) return binder;
    } catch (e) {
      continue;
    }
  }
  return null;
}

export async function subscribeToMasterBinder(user, category, franchise, setName, icon) {
  const checklistResponse = await generateChecklist(category, setName, franchise);
  const binder = await base44.entities.CollectionBinder.create({
    user_id: user.id,
    name: `${franchise} ${setName}`,
    category,
    franchise,
    set_name: setName,
    target_count: checklistResponse.total_count || (checklistResponse.items || []).length,
    checklist_json: JSON.stringify(checklistResponse.items || []),
    icon,
    binder_type: 'master',
  });
  return binder;
}

export async function buildBinderFromPrompt(prompt) {
  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `Find every collectible that matches this description: "${prompt}"

List every matching item. Include:
- name: Full name of the item (including set/series if applicable)
- number: Card/item number if known, or sequential number
- rarity: Rarity level

Be comprehensive. If the prompt is "Every Charizard", find every Charizard card across all Pokémon sets.
If "Every Eeveelution", find all Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, Sylveon cards.
If "PSA 10 Collection", list notable cards commonly found in PSA 10 grade.
If "Convention Binder", list popular convention exclusives and promos.

Also suggest:
- suggested_name: A short, catchy name for this binder
- category: The best category (pokemon, magic, lorcana, sports, funko, coins, memorabilia, or custom)`,
    model: 'gemini_3_flash',
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              number: { type: 'string' },
              rarity: { type: 'string' },
            },
          },
        },
        total_count: { type: 'number' },
        suggested_name: { type: 'string' },
        category: { type: 'string' },
      },
    },
  });
  return response;
}

export const DIFFICULTY_LABELS = {
  easy: { label: 'Easy', class: 'bg-gain/10 text-gain' },
  moderate: { label: 'Moderate', class: 'bg-blue-500/10 text-blue-500' },
  hard: { label: 'Hard', class: 'bg-gold/10 text-gold' },
  very_hard: { label: 'Very Hard', class: 'bg-orange-500/10 text-orange-500' },
  grail: { label: 'Grail', class: 'bg-loss/10 text-loss' },
};