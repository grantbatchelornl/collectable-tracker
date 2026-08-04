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

    return { ...item, status, collectible: owned, isGraded, duplicateCount };
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