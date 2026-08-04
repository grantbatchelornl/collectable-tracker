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
    average_price: { type: 'number' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    identification_confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    identification_notes: { type: 'string' },
    comparables_count: { type: 'number' },
    most_recent_sale_date: { type: 'string' },
    comparable_date_range: { type: 'string' },
    matching_criteria: { type: 'string' },
    includes_shipping: { type: 'boolean' },
    pricing_source: { type: 'string' },
    valuation_notes: { type: 'string' },
    value_type: { type: 'string', enum: ['verified_sold', 'insufficient'] },
  },
};

const PRICE_SCHEMA = {
  type: 'object',
  properties: {
    estimated_value: { type: 'number' },
    low_value: { type: 'number' },
    high_value: { type: 'number' },
    average_price: { type: 'number' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    comparables_count: { type: 'number' },
    most_recent_sale_date: { type: 'string' },
    comparable_date_range: { type: 'string' },
    matching_criteria: { type: 'string' },
    includes_shipping: { type: 'boolean' },
    pricing_source: { type: 'string' },
    valuation_notes: { type: 'string' },
    value_type: { type: 'string', enum: ['verified_sold', 'insufficient'] },
  },
};

const PRICING_RULES = `You are an expert collectibles appraiser. Follow these rules STRICTLY:

SOLD SALES ONLY: Use ONLY verified completed/sold sales. NEVER use active listings, Buy It Now asking prices that haven't sold, unsold auction prices, seller estimates, manufacturer retail prices, current marketplace inventory, or price guides based on asking prices.

ACCEPTED EVIDENCE: Verified completed marketplace sales, confirmed auction results, sold-history data from approved providers, documented completed dealer or auction-house transactions.

EXCLUDE unreliable transactions: multi-item lots when individual value cannot be separated, counterfeits, reproductions, proxy cards, empty boxes, replacement packaging, incorrect variants, canceled or refunded sales, unknown Best Offer prices, unknown currency, shipping-only transactions, deposits, duplicate records, extreme outliers, suspicious transactions.

CATEGORY-SPECIFIC MATCHING — require a reasonably exact match:
- Trading Cards (Pokémon, MTG, Disney Lorcana): Match game, set, card name, card number, language, finish, variant, edition, raw or graded status, grading company, grade, condition when raw.
- Sports Cards: Match sport, athlete, year, manufacturer, product line, set, card number, parallel, serial numbering, autograph, patch or memorabilia, rookie status, raw or graded status, grading company, grade.
- Funko Pop!: Match character, franchise, box number, series, exclusive, sticker, chase, variant, boxed or unboxed status, signed status, box condition, figure condition. NEVER use chase, prototype, signed, exclusive, error, convention, or special-variant sales for a normal Funko.
- Coins: Match country, denomination, year, mint mark, variety, composition, raw or graded status, grading company, grade, cleaning or damage designation.
- Sports Memorabilia: Match athlete or team, sport, item type, manufacturer, year or era, autograph status, authentication company, game-used or event-used status, condition.

USE MULTIPLE VALID COMPARABLES when available. Use the MEDIAN (or weighted median) as the primary estimated_value. Weight recent and closer-condition matches more heavily.

CONFIDENCE: "high" = 5+ recent sold comparables with exact matches. "medium" = 2-4 comparables. "low" = fewer than 2 or no exact match.

INSUFFICIENT DATA: If fewer than 2 reliable sold comparables exist, set value_type to "insufficient", estimated_value to 0, confidence to "low", comparables_count to the actual number found, and explain in valuation_notes. Do NOT substitute active listings or asking prices.

REPORT ALL FIELDS: comparables_count, comparable_date_range (e.g. "Jan 2026 - Jul 2026"), most_recent_sale_date, low_value (lowest sold), high_value (highest sold), average_price (mean of sold prices), matching_criteria (what was matched), includes_shipping (whether prices include shipping/buyer premium), pricing_source (where data came from), valuation_notes (caveats).

TCGplayer may be used for identification and product matching, but only use its value as pricing if it provides completed-sale evidence. Do not treat listing-based market numbers as completed-sale estimates.`;

export async function identifyAndPrice(photoUrl) {
  const prompt = `${PRICING_RULES}

Analyze this photo of a collectible. Identify it and find its current market value based on sold sales only.

If you cannot identify the item, return null for all identification fields, set identification_confidence to "low", and explain in identification_notes.

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
  const prompt = `${PRICING_RULES}

Search for completed/sold sales for this specific item and provide a market value estimate based ONLY on those sold transactions.

Item: ${collectible.item_name || 'Unknown'}
Category: ${collectible.category_name || 'N/A'}
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
Serial Number: ${collectible.serial_number || 'N/A'}
Autographed: ${collectible.has_autograph ? 'Yes' : 'No'}
Authentication: ${collectible.authentication_company || 'N/A'}
Team: ${collectible.team || 'N/A'}

Apply the category-specific matching criteria for this item's category. If fewer than 2 reliable sold comparables exist, set value_type to "insufficient" and estimated_value to 0.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: PRICE_SCHEMA,
    model: 'gemini_3_1_pro',
  });

  return result;
}