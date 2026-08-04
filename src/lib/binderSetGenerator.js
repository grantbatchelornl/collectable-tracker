import { base44 } from '@/api/base44Client';
import { MASTER_BINDERS } from './masterBinders';
import { getCategoryColor, SET_METADATA, DIFFICULTY_TIERS } from './masterBinderIndex';

const CACHE_KEY = 'binder-set-cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const POKEMON_API_URL = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json';

const CATEGORY_PROMPTS = {
  magic: 'Magic: The Gathering TCG',
  lorcana: 'Disney Lorcana TCG',
  sports: 'Sports Trading Cards (Topps, Panini, Upper Deck, Fleer)',
  funko: 'Funko Pop! collectibles',
  coins: 'Numismatic coin collecting (US Mint)',
  memorabilia: 'Sports Memorabilia and autographed collectibles',
};

/**
 * Fetches all Pokémon sets directly from the Pokémon TCG data repository.
 * Returns real release dates, card counts, and logo images.
 */
async function fetchPokemonSetsFromAPI() {
  const response = await fetch(POKEMON_API_URL);
  const apiSets = await response.json();

  const colors = getCategoryColor('pokemon');
  const category = MASTER_BINDERS.pokemon;

  // Build a lookup of static set names for name-matching
  const staticNames = new Set(category.sets.map(s => normalize(s)));

  return apiSets.map(apiSet => {
    const releaseDate = (apiSet.releaseDate || '').replace(/\//g, '-');
    const year = releaseDate ? parseInt(releaseDate.substring(0, 4)) : null;
    const totalCards = apiSet.total || apiSet.printedTotal || 100;
    const meta = findMetadata(apiSet.name, apiSet.series);

    return {
      id: `pokemon::${apiSet.id}`,
      apiId: apiSet.id,
      name: apiSet.name,
      category: 'pokemon',
      categoryLabel: 'Pokémon',
      icon: category.icon,
      franchise: 'Pokémon',
      series: apiSet.series,
      ptcgoCode: apiSet.ptcgoCode,
      keywords: apiSet.name.toLowerCase().split(/\s+/).concat(['pokemon', apiSet.series?.toLowerCase() || '']),
      colors,
      releaseDate,
      year,
      estimatedCollectibles: totalCards,
      estimatedValue: meta.value || Math.round(totalCards * 15),
      difficulty: meta.difficulty || guessDifficulty(apiSet, totalCards),
      popularity: meta.popularity || guessPopularity(year, apiSet.series),
      featured: meta.featured || false,
      trending: meta.trending || isRecent(year),
      popular: meta.popularity >= 80 || false,
      comingSoon: false,
      hidden: false,
      logo: apiSet.images?.logo,
      symbol: apiSet.images?.symbol,
      dynamic: true,
    };
  }).sort((a, b) => {
    const dateA = a.releaseDate || '9999-01-01';
    const dateB = b.releaseDate || '9999-01-01';
    return dateA.localeCompare(dateB);
  });
}

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findMetadata(name, series) {
  // Try exact match
  if (SET_METADATA[name]) return SET_METADATA[name];
  // Try without "EX" prefix etc
  const stripped = name.replace(/^(EX|XY|SM|SWSH|SV)\s+/i, '');
  if (SET_METADATA[stripped]) return SET_METADATA[stripped];
  return {};
}

function guessDifficulty(apiSet, totalCards) {
  if (totalCards > 250) return 'expert';
  if (totalCards > 150) return 'advanced';
  if (totalCards < 50) return 'beginner';
  return 'moderate';
}

function guessPopularity(year, series) {
  if (!year) return 50;
  if (year >= 2025) return 85;
  if (year >= 2023) return 75;
  if (year >= 2020) return 65;
  if (year >= 2010) return 55;
  if (year >= 2000) return 50;
  return 60; // older sets are collectible
}

function isRecent(year) {
  if (!year) return false;
  const currentYear = new Date().getFullYear();
  return year >= currentYear - 1;
}

/**
 * Fetches complete set lists with release dates from the web via LLM.
 * Used for categories without a dedicated API (Magic, Lorcana, etc.).
 */
async function fetchCategorySetsViaLLM(categoryKey) {
  const category = MASTER_BINDERS[categoryKey];
  const promptLabel = CATEGORY_PROMPTS[categoryKey] || category.label;

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

  return result.sets || [];
}

/**
 * Main entry point: fetches dynamic set data for a category.
 * Uses the Pokémon TCG API for Pokémon, LLM web search for other categories.
 * Merges with static data, deduplicates, and sorts chronologically.
 */
export async function fetchCategorySetsDynamic(categoryKey) {
  const category = MASTER_BINDERS[categoryKey];
  if (!category) return null;

  const cacheKey = `${CACHE_KEY}::${categoryKey}`;

  // Check cache
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  } catch { /* ignore */ }

  try {
    let result;

    if (categoryKey === 'pokemon') {
      // Use the official Pokémon TCG data API
      result = await fetchPokemonSetsFromAPI();
    } else {
      // Use LLM web search for other categories
      const dynamicSets = await fetchCategorySetsViaLLM(categoryKey);
      result = mergeLLMWithStatic(categoryKey, dynamicSets);
    }

    localStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }));
    return result;
  } catch (e) {
    console.error('Failed to fetch dynamic sets:', e);
    return null;
  }
}

/**
 * Merges LLM-fetched sets with static sets for non-Pokémon categories.
 */
function mergeLLMWithStatic(categoryKey, dynamicSets) {
  const category = MASTER_BINDERS[categoryKey];
  const colors = getCategoryColor(categoryKey);
  const staticSets = category.sets;

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
    });
  }

  // Merge dynamic sets
  for (const dyn of dynamicSets) {
    if (!dyn.name) continue;
    const key = normalize(dyn.name);
    const existing = mergedMap.get(key);

    if (existing) {
      mergedMap.set(key, {
        ...existing,
        name: dyn.name,
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

  // Sort chronologically
  const merged = Array.from(mergedMap.values());
  merged.sort((a, b) => {
    const dateA = a.releaseDate || `${a.year || '9999'}-01-01`;
    const dateB = b.releaseDate || `${b.year || '9999'}-01-01`;
    return dateA.localeCompare(dateB);
  });

  return merged;
}