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
    language: { type: 'string' },
    franchise: { type: 'string' },
    box_number: { type: 'string' },
    series: { type: 'string' },
    is_exclusive: { type: 'boolean' },
    has_sticker: { type: 'boolean' },
    is_chase: { type: 'boolean' },
    is_boxed: { type: 'boolean' },
    country: { type: 'string' },
    denomination: { type: 'string' },
    mint_mark: { type: 'string' },
    composition: { type: 'string' },
    sport: { type: 'string' },
    is_rookie: { type: 'boolean' },
    has_patch: { type: 'boolean' },
    item_type: { type: 'string' },
    is_game_used: { type: 'boolean' },
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
    fraud_warning: { type: 'boolean' },
    fraud_type: { type: 'string', enum: ['none', 'counterfeit', 'fake_slab', 'altered', 'reproduction', 'suspicious'] },
    fraud_details: { type: 'string' },
    fraud_confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
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

REPORT ALL FIELDS: comparables_count, comparable_date_range, most_recent_sale_date, low_value, high_value, average_price, matching_criteria, includes_shipping, pricing_source, valuation_notes.

TCGplayer may be used for identification and product matching, but only use its value as pricing if it provides completed-sale evidence.`;

const CATEGORY_ID_PROMPTS = {
  pokemon: `POKÉMON CARD IDENTIFICATION: Identify the Pokémon character, card name, set name, set symbol, card number, edition (1st Edition/Unlimited), variant (Holo/Reverse Holo/Non-Holo), language, and grading if present. Look for set symbols, energy types, and HP values.`,
  magic: `MAGIC: THE GATHERING IDENTIFICATION: Identify the card name, set name, set symbol, card number, rarity, edition, language, and finish (Foil/Non-foil). Look for mana cost, card type, and set symbols.`,
  lorcana: `DISNEY LORCANA IDENTIFICATION: Identify the character, card name, set name, card number, rarity, language, and ink color. Look for set symbols and ink type indicators.`,
  sports_cards: `SPORTS CARD IDENTIFICATION: Identify the athlete, sport, year, manufacturer, product line, set, card number, parallel, rookie status, and any autograph or memorabilia patches. Look for team logos, player names, and card numbering.`,
  funko: `FUNKO POP! IDENTIFICATION: Use ALL provided photos (front, back, left, right, top, bottom) to identify the character, franchise, box number, series, exclusive status, sticker, chase variant, boxed/unboxed status, and box/figure condition. Check all angles carefully for exclusive stickers, chase indicators, and box number.`,
  coins: `COIN IDENTIFICATION: Identify the country, denomination, year, mint mark, variety, composition, and grading if present. Look for mint marks, denomination text, and date.`,
  sports_memorabilia: `SPORTS MEMORABILIA IDENTIFICATION: Identify the athlete or team, sport, item type (jersey, ball, helmet, etc.), manufacturer, year/era, autograph status, authentication company, and game-used status. Look for holograms, certificates, and authentication stickers.`,
};

function normalizeCategory(name) {
  if (!name) return 'default';
  const lower = name.toLowerCase();
  if (lower.includes('pokémon') || lower.includes('pokemon')) return 'pokemon';
  if (lower.includes('magic')) return 'magic';
  if (lower.includes('lorcana')) return 'lorcana';
  if (lower.includes('sports card')) return 'sports_cards';
  if (lower.includes('funko')) return 'funko';
  if (lower.includes('coin')) return 'coins';
  if (lower.includes('memorabilia')) return 'sports_memorabilia';
  return 'default';
}

export async function identifyAndPrice(photoUrls, categoryName) {
  const photos = Array.isArray(photoUrls) ? photoUrls.filter(Boolean) : [photoUrls].filter(Boolean);
  if (photos.length === 0) throw new Error('No photos provided');

  const catKey = normalizeCategory(categoryName);
  const categoryPrompt = CATEGORY_ID_PROMPTS[catKey] || '';
  const photoDesc = photos.length > 1
    ? `${photos.length} photos from different angles`
    : 'this photo';

  const prompt = `${PRICING_RULES}

${categoryPrompt}

Analyze ${photoDesc} of a collectible${categoryName ? ` (category: ${categoryName})` : ''}. Identify it and find its current market value based on sold sales only.

Set identification_confidence based on how certain you are of the identification:
- "high": You are very confident in the exact identification
- "medium": Likely match but some uncertainty
- "low": Uncertain or unable to identify

If you cannot identify the item, return null for all identification fields, set identification_confidence to "low", and explain in identification_notes.

If you cannot determine a field from the image, use null. Do not guess.

FRAUD & COUNTERFEIT DETECTION: Carefully examine the photos for signs of fraud, counterfeiting, or tampering. Check for:
- Fake or tampered grading slabs (PSA, BGS, CGC, etc.) — look for incorrect fonts, misaligned labels, missing holograms, fake barcodes, incorrect slab dimensions or textures
- Counterfeit trading cards — wrong cardstock, incorrect holographic patterns, missing set symbols, font irregularities, color mismatches, wrong back design
- Counterfeit Funko Pop! figures — wrong materials, missing licensing info, incorrect paint applications, fake boxes or stickers
- Altered cards — trimmed edges, re-backed cards, fake autographs, added holo foil, surface manipulation
- Counterfeit coins — wrong weight/appearance, fake mint marks, casting seams, incorrect metal composition
- Reproductions or reprints being sold as originals
- Any suspicious elements that don't match known authentic versions

Set fraud_warning to true if you detect ANY signs of counterfeiting or tampering. Set fraud_type to the most likely category, fraud_details to a specific explanation of what you observed, and fraud_confidence to how certain you are. If the item appears authentic, set fraud_warning to false and fraud_type to "none".`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    file_urls: photos,
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