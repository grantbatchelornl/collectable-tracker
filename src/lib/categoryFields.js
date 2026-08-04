const PHOTO_TYPES = {
  trading_cards: [
    { key: 'front', label: 'Front', required: true },
    { key: 'back', label: 'Back', required: true },
  ],
  funko: [
    { key: 'front', label: 'Front', required: true },
    { key: 'back', label: 'Back', required: true },
    { key: 'left', label: 'Left', required: false },
    { key: 'right', label: 'Right', required: false },
    { key: 'top', label: 'Top', required: false },
    { key: 'bottom', label: 'Bottom', required: false },
  ],
  coins: [
    { key: 'obverse', label: 'Obverse', required: true },
    { key: 'reverse', label: 'Reverse', required: true },
    { key: 'edge', label: 'Edge', required: false },
  ],
  sports_memorabilia: [
    { key: 'front', label: 'Front', required: true },
    { key: 'back', label: 'Back', required: true },
    { key: 'certificate', label: 'Certificate', required: false },
    { key: 'autograph', label: 'Autograph', required: false },
    { key: 'additional', label: 'Additional', required: false },
  ],
};

const DEFAULT_PHOTOS = PHOTO_TYPES.trading_cards;

const FORM_FIELDS = {
  pokemon: {
    basic: ['character_athlete_name', 'set_name', 'card_number', 'language', 'product_line'],
    details: ['edition', 'variant', 'parallel'],
    grading: ['grading_company', 'grade', 'item_condition'],
  },
  magic: {
    basic: ['character_athlete_name', 'set_name', 'card_number', 'language', 'product_line'],
    details: ['edition', 'variant', 'parallel'],
    grading: ['grading_company', 'grade', 'item_condition'],
  },
  lorcana: {
    basic: ['character_athlete_name', 'set_name', 'card_number', 'language', 'product_line'],
    details: ['edition', 'variant', 'parallel'],
    grading: ['grading_company', 'grade', 'item_condition'],
  },
  sports_cards: {
    basic: ['character_athlete_name', 'brand', 'year', 'team', 'sport'],
    details: ['product_line', 'set_name', 'card_number', 'parallel', 'serial_number', 'is_rookie', 'has_patch'],
    grading: ['has_autograph', 'grading_company', 'grade', 'item_condition', 'authentication_company'],
  },
  funko: {
    basic: ['character_athlete_name', 'brand', 'franchise', 'box_number', 'series'],
    details: ['variant', 'is_exclusive', 'has_sticker', 'is_chase', 'is_boxed'],
    grading: ['has_autograph', 'box_condition', 'item_condition'],
  },
  coins: {
    basic: ['year', 'country', 'denomination'],
    details: ['mint_mark', 'variant', 'composition'],
    grading: ['grading_company', 'grade', 'item_condition'],
  },
  sports_memorabilia: {
    basic: ['character_athlete_name', 'team', 'year', 'sport'],
    details: ['brand', 'item_type', 'authentication_company', 'is_game_used'],
    grading: ['has_autograph', 'item_condition'],
  },
};

const DEFAULT_FIELDS = {
  basic: ['character_athlete_name', 'brand', 'year'],
  details: ['product_line', 'set_name', 'card_number', 'variant', 'edition', 'parallel', 'serial_number', 'team', 'authentication_company'],
  grading: ['has_autograph', 'grading_company', 'grade', 'box_condition', 'item_condition'],
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

export function getPhotoTypes(categoryName) {
  const cat = normalizeCategory(categoryName);
  if (['pokemon', 'magic', 'lorcana'].includes(cat)) return PHOTO_TYPES.trading_cards;
  return PHOTO_TYPES[cat] || DEFAULT_PHOTOS;
}

export function getFormFields(categoryName) {
  const cat = normalizeCategory(categoryName);
  return FORM_FIELDS[cat] || DEFAULT_FIELDS;
}