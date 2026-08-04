import { base44 } from '@/api/base44Client';
import { MASTER_BINDERS } from './masterBinders';
import { getCategoryColor } from './masterBinderIndex';

const CACHE_KEY = 'binder-set-cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const CATEGORY_PROMPTS = {
  pokemon: 'Pokémon TCG (Trading Card Game)',
  magic: 'Magic: The Gathering TCG',
  lorcana: 'Disney Lorcana TCG',
  sports: 'Sports Trading Cards (Topps, Panini, Upper Deck, Fleer)',
  funko: 'Funko Pop! collectibles',
  coins: 'Numismatic coin collecting (US Mint)',
  memorabilia: 'Sports Memorabilia and autographed collectibles',
};

/**
 * Fetches complete set lists with release dates from the web via LLM.
 * Merges with static data, deduplicates, and sorts chronologically.
 */
export async function fetchCategorySetsDynamic(categoryKey) {
  const category = MASTER_BINDERS[categoryKey];
  if (!category) return null;

  const promptLabel = CATEGORY_PROMPTS[categoryKey] || category.label;
  const cacheKey = `${CACHE_KEY}::${categoryKey}`;

  // Check cache
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return mergeWithStatic(categoryKey, cached.data);
    }
  } catch { /* ignore */ }

  const prompt = `List ALL ${promptLabel} sets/releases in chronological order from oldest to newest.
For each set, provide:
- name: the official set name (exactly as published)
- releaseDate: release date in YYYY-MM-DD format (use YYYY-MM-01 if only month is known, or YYYY-01-01 if only year is known)
- totalCards: total number of cards/items in the set (integer)
- estimatedValue: estimated total set value in USD (integer)
- difficulty: one of "beginner", "moderate", "advanced", "expert", "legendary"
- popularity: 0-100 popularity score (integer)
- featured: true if this is a notable/iconic set
- trending: true if currently trending or recently released

Include EVERY set — main expansions, special sets, promo sets, mini sets, etc.
Do not skip any sets. Return the full list as a JSON array.`;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          sets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                releaseDate: { type: 'string' },
                totalCards: { type: 'number' },
                estimatedValue: { type: 'number' },
                difficulty: { type: 'string' },
                popularity: { type: 'number' },
                featured: { type: 'boolean' },
                trending: { type: 'boolean' },
              },
            },
          },
        },
      },
    });

    const dynamicSets = result.sets || [];
    localStorage.setItem(cacheKey, JSON.stringify({ data: dynamicSets, timestamp: Date.now() }));
    return mergeWithStatic(categoryKey, dynamicSets);
  } catch (e) {
    console.error('Failed to fetch dynamic sets:', e);
    return null;
  }
}

/**
 * Merges dynamic (web-fetched) sets with static sets.
 * Deduplicates by normalized name, prefers dynamic data when available,
 * and sorts chronologically by release date.
 */
function mergeWithStatic(categoryKey, dynamicSets) {
  const category = MASTER_BINDERS[categoryKey];
  const colors = getCategoryColor(categoryKey);
  const staticSets = category.sets;

  // Normalize set name for dedup
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const mergedMap = new Map();

  // Add static sets first
  for (const setName of staticSets) {
    const key = normalize(setName);
    mergedMap.set(key, {
      id: `${categoryKey}::${setName}`,
      name: setName,
      category: categoryKey,
      categoryLabel: category.label,
      icon: category.icon,
      franchise: category.label,
      keywords: setName.toLowerCase().split(/\s+/).concat([category.label.toLowerCase()]),
      colors,
      comingSoon: false,
      hidden: false,
      // Will be enriched with dynamic data below
    });
  }

  // Merge dynamic sets
  for (const dyn of dynamicSets) {
    if (!dyn.name) continue;
    const key = normalize(dyn.name);
    const existing = mergedMap.get(key);

    if (existing) {
      // Enrich existing with dynamic data
      mergedMap.set(key, {
        ...existing,
        name: dyn.name, // prefer official name from web
        releaseDate: dyn.releaseDate,
        estimatedCollectibles: dyn.totalCards || existing.estimatedCollectibles,
        estimatedValue: dyn.estimatedValue || existing.estimatedValue,
        difficulty: dyn.difficulty || existing.difficulty,
        popularity: dyn.popularity || existing.popularity,
        featured: dyn.featured || existing.featured,
        trending: dyn.trending || existing.trending,
        popular: dyn.popularity >= 80 || existing.popular,
        year: dyn.releaseDate ? parseInt(dyn.releaseDate.substring(0, 4)) : existing.year,
        dynamic: true,
      });
    } else {
      // New set from web — add it
      mergedMap.set(key, {
        id: `${categoryKey}::${dyn.name}`,
        name: dyn.name,
        category: categoryKey,
        categoryLabel: category.label,
        icon: category.icon,
        franchise: category.label,
        keywords: dyn.name.toLowerCase().split(/\s+/).concat([category.label.toLowerCase()]),
        colors,
        releaseDate: dyn.releaseDate,
        year: dyn.releaseDate ? parseInt(dyn.releaseDate.substring(0, 4)) : null,
        estimatedCollectibles: dyn.totalCards || 100,
        estimatedValue: dyn.estimatedValue || 1000,
        difficulty: dyn.difficulty || 'moderate',
        popularity: dyn.popularity || 50,
        featured: dyn.featured || false,
        trending: dyn.trending || false,
        popular: dyn.popularity >= 80,
        comingSoon: false,
        hidden: false,
        dynamic: true,
      });
    }
  }

  // Sort chronologically by release date (oldest to newest)
  const merged = Array.from(mergedMap.values());
  merged.sort((a, b) => {
    const dateA = a.releaseDate || `${a.year || '9999'}-01-01`;
    const dateB = b.releaseDate || `${b.year || '9999'}-01-01`;
    return dateA.localeCompare(dateB);
  });

  return merged;
}