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
  },
};

const PRICE_SCHEMA = {
  type: 'object',
  properties: {
    estimated_value: { type: 'number' },
    low_value: { type: 'number' },
    high_value: { type: 'number' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
};

export async function identifyAndPrice(photoUrl) {
  const prompt = `You are an expert collectibles appraiser and market analyst.

1. Analyze this photo of a collectible and identify it. Look for Funko Pops, trading cards (Pokémon, Magic: The Gathering, Disney Lorcana, sports cards), autographed memorabilia, and other collectibles. Read any visible text, numbers, logos, grading labels, and holographic patterns.

2. Search the web for current market prices for the identified item based on recent sales data and active listings.

Provide all fields. If you cannot determine a field from the image, use null. Be conservative with value estimates — base them on actual recent sold-listing data where available, and set confidence to "low" when data is scarce.`;

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
  const prompt = `You are an expert collectibles market analyst. Search the web for current market prices for the following collectible based on recent sold-listing data and current active listings.

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
Authentication: ${collectible.authentication_company || 'N/A'}

Provide your best estimate of the current market value in USD. Be conservative — base estimates on actual recent sales data where available. If you cannot find specific data for this exact item, provide your best educated estimate and set confidence to "low".`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: PRICE_SCHEMA,
    model: 'gemini_3_1_pro',
  });

  return result;
}