import { base44 } from '@/api/base44Client';

const IDENTIFY_SCHEMA = {
  type: 'object',
  properties: {
    item_name: { type: 'string' },
    character_athlete_name: { type: 'string' },
    brand: { type: 'string' },
    product_line: { type: 'string' },
    set_name: { type: 'string' },
    card_number: { type: 'string' },
    year: { type: 'number' },
    team: { type: 'string' },
    variant: { type: 'string' },
    edition: { type: 'string' },
    parallel: { type: 'string' },
    has_autograph: { type: 'boolean' },
    grading_company: { type: 'string' },
    grade: { type: 'string' },
    estimated_value: { type: 'number' },
    low_value: { type: 'number' },
    high_value: { type: 'number' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    identification_confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    identification_notes: { type: 'string' },
    comparables_count: { type: 'number' },
    pricing_source: { type: 'string' },
    valuation_notes: { type: 'string' },
  },
};

const PRICE_SCHEMA = {
  type: 'object',
  properties: {
    estimated_value: { type: 'number' },
    low_value: { type: 'number' },
    high_value: { type: 'number' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    comparables_count: { type: 'number' },
    pricing_source: { type: 'string' },
    valuation_notes: { type: 'string' },
  },
};

export async function identifyAndPrice(photoUrl) {
  const prompt = `You are an expert collectibles appraiser. Follow these rules strictly:

ACCURACY FIRST: Never invent information. If you cannot identify the item from the photo, return null for all identification fields, set identification_confidence to "low", and explain what could not be determined in identification_notes.

IDENTIFICATION: Analyze the photo and identify the collectible. Look for trading cards (Pokémon, Magic: The Gathering, Disney Lorcana, sports cards), Funko Pops, coins, sports memorabilia, and other collectibles. Read any visible text, numbers, logos, grading labels, and holographic patterns.

VALUATION FROM SOLD SALES ONLY: Base the estimated value ONLY on verified completed/sold sales data. NEVER use asking prices, current active listings, retail prices, or seller estimates as the primary value. If you cannot find sufficient sold sales, set confidence to "low", report the actual count in comparables_count, and explain in valuation_notes.

PROVENANCE: Report in comparables_count exactly how many sold comparables were used. Report in pricing_source where the data came from (e.g., "eBay Sold Listings", "PWCC Auctions", "PSA Registry Sales"). Explain any caveats in valuation_notes.

HONEST CONFIDENCE: Set confidence based on actual data: "high" = 5+ recent sold comparables, "medium" = 2-4 comparables, "low" = fewer than 2 or no exact match.

If you cannot determine a field from the image, use null. Do not guess.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    file_urls: [photoUrl],
    add_context_from_internet: true,
    response_json_schema: IDENTIFY_SCHEMA,
    model: 'gemini_3_1_pro',
  });

  return result;
}

export async function estimatePrice(collectible) {
  const prompt = `You are an expert collectibles market analyst. Follow these rules strictly:

SOLD SALES ONLY: Search ONLY for verified completed/sold sales for this item. NEVER base the estimated value on asking prices, current active listings, retail prices, or seller estimates. Only use actual sold transaction prices.

INSUFFICIENT DATA: If there are fewer than 2 sold sales, set confidence to "low", report the actual count in comparables_count, and explain in valuation_notes that insufficient sold sales data was found. If zero sold sales exist, set estimated_value to 0.

PROVENANCE: Report in comparables_count exactly how many sold comparables were used. Report in pricing_source where the data came from. Explain caveats in valuation_notes.

HONEST CONFIDENCE: "high" = 5+ recent sold comparables, "medium" = 2-4, "low" = fewer than 2.

Do not invent data. If you cannot find sold sales, return estimated_value of 0 and confidence "low".

Item: ${collectible.item_name || 'Unknown'}
Character/Athlete: ${collectible.character_athlete_name || 'N/A'}
Brand: ${collectible.brand || 'N/A'}
Product Line: ${collectible.product_line || 'N/A'}
Set: ${collectible.set_name || 'N/A'}
Year: ${collectible.year || 'N/A'}
Card Number: ${collectible.card_number || 'N/A'}
Grading: ${collectible.grading_company || 'N/A'} ${collectible.grade || ''}
Variant: ${collectible.variant || 'N/A'}
Parallel: ${collectible.parallel || 'N/A'}
Edition: ${collectible.edition || 'N/A'}
Autographed: ${collectible.has_autograph ? 'Yes' : 'No'}
Authentication: ${collectible.authentication_company || 'N/A'}`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: PRICE_SCHEMA,
    model: 'gemini_3_1_pro',
  });

  return result;
}