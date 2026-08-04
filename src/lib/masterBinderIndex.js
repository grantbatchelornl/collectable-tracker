import { MASTER_BINDERS } from './masterBinders';

// Popular character → set mappings for smart suggestions
const POPULAR_KEYWORDS = {
  charizard: { sets: ['Base Set', 'Team Rocket', 'Celebrations', '151', "Champion's Path", 'Darkness Ablaze', 'Crown Zenith', 'Evolving Skies', 'Hidden Fates', 'Shining Fates', 'Paldean Fates', 'Obsidian Flames', 'Shrouded Fable', 'Destined Rivals', 'Black Bolt', 'Mega Evolution'], categories: ['pokemon'] },
  pikachu: { sets: ['Base Set', '151', 'Prismatic Evolutions', 'Journey Together', 'Vivid Voltage', 'Shining Fates', 'Hidden Fates', 'Scarlet & Violet', 'Surging Sparks', 'Mega Evolution'], categories: ['pokemon'] },
  mewtwo: { sets: ['Base Set', '151', 'Shining Fates', 'Crown Zenith', 'BREAKthrough'], categories: ['pokemon'] },
  mew: { sets: ['151', 'Shining Legends', 'Hidden Fates', 'Crown Zenith', 'Celestial Storm'], categories: ['pokemon'] },
  eevee: { sets: ['Crown Zenith', '151', 'Evolving Skies', 'Hidden Fates', 'Fusion Strike'], categories: ['pokemon'] },
  blastoise: { sets: ['Base Set', 'Crown Zenith', '151'], categories: ['pokemon'] },
  venusaur: { sets: ['Base Set', 'Crown Zenith', '151'], categories: ['pokemon'] },
  batman: { sets: ['DC Comics'], categories: ['funko'] },
  'star wars': { sets: ['Star Wars'], categories: ['funko'] },
  marvel: { sets: ['Marvel'], categories: ['funko'] },
  disney: { sets: ['Disney'], categories: ['funko'] },
  'harry potter': { sets: ['Harry Potter'], categories: ['funko'] },
  naruto: { sets: ['Naruto'], categories: ['funko'] },
  'dragon ball': { sets: ['Dragon Ball'], categories: ['funko'] },
  'one piece': { sets: ['One Piece'], categories: ['funko'] },
  'silver eagle': { sets: ['American Silver Eagles'], categories: ['coins'] },
  'morgan dollar': { sets: ['Morgan Dollars'], categories: ['coins'] },
  fleer: { sets: ['1986 Fleer Basketball'], categories: ['sports'] },
  'upper deck': { sets: ['1989 Upper Deck Baseball', '1991 Upper Deck Baseball', '1994 Upper Deck Baseball'], categories: ['sports'] },
  topps: { sets: ['1952 Topps Baseball', '1984 Topps Football', '1998 Topps Chrome Basketball', '2003 Topps Chrome Football', '2011 Topps Chrome Football', '2001 Topps Baseball'], categories: ['sports'] },
  panini: { sets: ['2017 Panini Prizm Basketball', '2020 Panini Prizm Football', '2019 Panini National Treasures Football'], categories: ['sports'] },
};

// Known release years for sets without years in the name
const KNOWN_YEARS = {
  // Pokémon
  'Base Set': 1999, 'Jungle': 1999, 'Fossil': 1999, 'Base Set 2': 2000, 'Team Rocket': 2000,
  'Gym Heroes': 2000, 'Gym Challenge': 2000,
  'Neo Genesis': 2000, 'Neo Discovery': 2001, 'Neo Revelation': 2001, 'Neo Destiny': 2002,
  'Expedition': 2002, 'Aquapolis': 2003, 'Skyridge': 2003,
  'EX Ruby & Sapphire': 2003, 'EX Sandstorm': 2003, 'EX Dragon': 2003,
  'EX Team Magma vs Team Aqua': 2004, 'EX Hidden Legends': 2004, 'EX FireRed & LeafGreen': 2004,
  'EX Team Rocket Returns': 2004, 'EX Deoxys': 2005, 'EX Emerald': 2005, 'EX Unseen Forces': 2005,
  'EX Delta Species': 2005, 'EX Legend Maker': 2006, 'EX Holon Phantoms': 2006,
  'EX Crystal Guardians': 2006, 'EX Dragon Frontiers': 2006, 'EX Power Keepers': 2007,
  'Diamond & Pearl': 2007, 'Mysterious Treasures': 2007, 'Secret Wonders': 2007,
  'Great Encounters': 2008, 'Majestic Dawn': 2008, 'Legends Awakened': 2008, 'Stormfront': 2008,
  'Platinum': 2009, 'Rising Rivals': 2009, 'Supreme Victors': 2009, 'Arceus': 2009,
  'HeartGold SoulSilver': 2010, 'Undaunted': 2010, 'Triumphant': 2010, 'Call of Legends': 2011,
  'Black & White': 2011, 'Emerging Powers': 2011, 'Noble Victories': 2011, 'Next Destinies': 2012,
  'Dark Explorers': 2012, 'Dragons Exalted': 2012, 'Boundaries Crossed': 2012,
  'Plasma Storm': 2013, 'Plasma Freeze': 2013, 'Plasma Blast': 2013, 'Legendary Treasures': 2013,
  'XY': 2014, 'Flashfire': 2014, 'Furious Fists': 2014, 'Phantom Forces': 2014, 'Primal Clash': 2015,
  'Roaring Skies': 2015, 'Ancient Origins': 2015, 'BREAKthrough': 2015, 'BREAKpoint': 2015,
  'Generations': 2016, 'Fates Collide': 2016, 'Steam Siege': 2016, 'Evolutions': 2016,
  'Sun & Moon': 2017, 'Guardians Rising': 2017, 'Burning Shadows': 2017, 'Crimson Invasion': 2017,
  'Ultra Prism': 2018, 'Forbidden Light': 2018, 'Celestial Storm': 2018, 'Cosmic Eclipse': 2019,
  'Team Up': 2019, 'Unbroken Bonds': 2019, 'Unified Minds': 2019, 'Hidden Fates': 2019,
  'Shining Legends': 2017, 'Dragon Majesty': 2018, 'Lost Thunder': 2018,
  'Sword & Shield': 2020, 'Rebel Clash': 2020, 'Darkness Ablaze': 2020, "Champion's Path": 2020,
  'Vivid Voltage': 2020, 'Shining Fates': 2021, 'Battle Styles': 2021, 'Chilling Reign': 2021,
  'Evolving Skies': 2021, 'Celebrations': 2021, 'Fusion Strike': 2021,
  'Brilliant Stars': 2022, 'Astral Radiance': 2022, 'Pokemon GO': 2022, 'Lost Origin': 2022,
  'Crown Zenith': 2023, '151': 2023, 'Scarlet & Violet': 2023, 'Paldea Evolved': 2023, 'Obsidian Flames': 2023,
  'Paldean Fates': 2024, 'Temporal Forces': 2024, 'Twilight Masquerade': 2024, 'Shrouded Fable': 2024,
  'Stellar Crown': 2024, 'Surging Sparks': 2024, 'Prismatic Evolutions': 2025, 'Journey Together': 2025, 'Destined Rivals': 2025,
  'Black Bolt': 2025, 'White Flare': 2025, 'Mega Evolution': 2025,
  'Mega Evolution—Phantasmal Flames': 2025, 'Mega Evolution—Chaos Rising': 2026,
  // Magic (recent)
  'Foundations': 2024, 'Modern Horizons': 2019, 'Modern Horizons 2': 2021, 'Modern Horizons 3': 2024,
  'Bloomburrow': 2024, 'Duskmourn': 2024, 'The Lost Caverns of Ixalan': 2023, 'Wilds of Eldraine': 2023,
  'March of the Machine': 2023, 'Phyrexia: All Will Be One': 2023, "The Brothers' War": 2022,
  'Dominaria United': 2022, 'Streets of New Capenna': 2022, 'Kamigawa: Neon Dynasty': 2022,
  // Lorcana
  'The First Chapter': 2023, 'Rise of the Floodborn': 2023, 'Into the Inklands': 2024,
  "Ursula's Return": 2024, 'Shimmering Skies': 2024, 'Azurite Sea': 2025,
  // Coins
  'State Quarters': 1999, 'Morgan Dollars': 1878, 'American Silver Eagles': 1986,
  'Peace Dollars': 1921, 'Lincoln Cents': 1909, 'Buffalo Nickels': 1913, 'Mercury Dimes': 1916,
};

const POPULAR_SETS = [
  'Base Set', '151', 'Crown Zenith', 'Prismatic Evolutions', 'Journey Together',
  'Destined Rivals', 'Black Bolt', 'White Flare', 'Mega Evolution', 'Crown Zenith',
  'Evolving Skies', 'Hidden Fates', 'Shining Fates', 'Scarlet & Violet',
  'Foundations', 'Bloomburrow', 'The First Chapter',
  '1986 Fleer Basketball', 'American Silver Eagles', 'State Quarters',
];

const CATEGORY_COLORS = {
  pokemon: { from: 'from-yellow-500/20', to: 'to-amber-500/10', text: 'text-yellow-600', solid: '#eab308' },
  magic: { from: 'from-purple-500/20', to: 'to-violet-500/10', text: 'text-purple-600', solid: '#9333ea' },
  lorcana: { from: 'from-cyan-500/20', to: 'to-blue-500/10', text: 'text-cyan-600', solid: '#06b6d4' },
  sports: { from: 'from-orange-500/20', to: 'to-red-500/10', text: 'text-orange-600', solid: '#f97316' },
  funko: { from: 'from-pink-500/20', to: 'to-rose-500/10', text: 'text-pink-600', solid: '#ec4899' },
  coins: { from: 'from-amber-500/20', to: 'to-yellow-500/10', text: 'text-amber-600', solid: '#f59e0b' },
  memorabilia: { from: 'from-red-500/20', to: 'to-orange-500/10', text: 'text-red-600', solid: '#ef4444' },
};

function extractYear(setName, catKey) {
  if (KNOWN_YEARS[setName]) return KNOWN_YEARS[setName];
  const match = setName.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : null;
}

function estimateCollectibles(catKey, setName) {
  const estimates = { pokemon: 150, magic: 60, lorcana: 200, sports: 700, funko: 50, coins: 50, memorabilia: 30 };
  if (setName === 'Base Set') return 102;
  if (setName === '151') return 165;
  if (setName === 'State Quarters') return 50;
  if (setName.includes('Quarters') && !setName.includes('State')) return 56;
  if (setName === 'Morgan Dollars') return 97;
  if (setName === 'American Silver Eagles') return 40;
  if (setName === 'Lincoln Cents') return 114;
  if (setName === 'Buffalo Nickels') return 64;
  return estimates[catKey] || 100;
}

function estimateDifficulty(catKey, setName) {
  if (setName.includes('195')) return 'very_hard';
  if (setName.includes('198') && catKey === 'sports') return 'hard';
  if (catKey === 'memorabilia') return 'very_hard';
  if (setName.includes('Morgan') || setName.includes('Barber')) return 'hard';
  return 'moderate';
}

let _index = null;

export function getBinderIndex() {
  if (_index) return _index;
  _index = [];
  for (const [catKey, cat] of Object.entries(MASTER_BINDERS)) {
    for (const setName of cat.sets) {
      _index.push({
        id: `${catKey}::${setName}`,
        name: setName,
        category: catKey,
        categoryLabel: cat.label,
        icon: cat.icon,
        year: extractYear(setName, catKey),
        franchise: cat.label,
        keywords: setName.toLowerCase().split(/\s+/).concat([cat.label.toLowerCase()]),
        estimatedCollectibles: estimateCollectibles(catKey, setName),
        difficulty: estimateDifficulty(catKey, setName),
        popular: POPULAR_SETS.includes(setName),
        colors: CATEGORY_COLORS[catKey] || CATEGORY_COLORS.pokemon,
      });
    }
  }
  return _index;
}

export function getCategoryColor(catKey) {
  return CATEGORY_COLORS[catKey] || CATEGORY_COLORS.pokemon;
}

export function searchBinders(query, filters = {}) {
  const index = getBinderIndex();
  const q = (query || '').toLowerCase().trim();
  let results = index;

  if (q) {
    const popular = POPULAR_KEYWORDS[q];
    if (popular) {
      results = results.filter(r =>
        popular.categories.includes(r.category) && popular.sets.includes(r.name)
      );
    } else {
      results = results.filter(r => {
        if (r.name.toLowerCase().includes(q)) return true;
        if (r.keywords.some(k => k.includes(q))) return true;
        if (r.year && String(r.year).includes(q)) return true;
        return false;
      });
    }
  }

  if (filters.category && filters.category !== 'all') {
    results = results.filter(r => r.category === filters.category);
  }

  switch (filters.sort) {
    case 'newest':
      results = [...results].sort((a, b) => (b.year || 0) - (a.year || 0));
      break;
    case 'oldest':
      results = [...results].sort((a, b) => (a.year || 9999) - (b.year || 9999));
      break;
    case 'alphabetical':
      results = [...results].sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'count_desc':
      results = [...results].sort((a, b) => b.estimatedCollectibles - a.estimatedCollectibles);
      break;
    case 'count_asc':
      results = [...results].sort((a, b) => a.estimatedCollectibles - b.estimatedCollectibles);
      break;
    case 'popular':
      results = [...results].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
      break;
    default:
      break;
  }

  return results;
}

export function getSmartSuggestions(query) {
  const index = getBinderIndex();
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];

  const matches = index.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.keywords.some(k => k.includes(q) || q.includes(k))
  );

  const popular = POPULAR_KEYWORDS[q];
  if (popular) {
    const existing = new Set(matches.map(m => m.id));
    for (const r of index) {
      if (popular.categories.includes(r.category) && popular.sets.includes(r.name) && !existing.has(r.id)) {
        matches.push(r);
        existing.add(r.id);
      }
    }
  }
  return matches;
}

export function getFavorites() {
  try { return JSON.parse(localStorage.getItem('binder-favorites') || '[]'); } catch { return []; }
}

export function toggleFavorite(binderId) {
  const favs = getFavorites();
  const idx = favs.indexOf(binderId);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.unshift(binderId);
  localStorage.setItem('binder-favorites', JSON.stringify(favs));
  return favs;
}

export function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem('binder-recently-viewed') || '[]'); } catch { return []; }
}

export function addRecentlyViewed(binderId) {
  let recent = getRecentlyViewed().filter(id => id !== binderId);
  recent.unshift(binderId);
  recent = recent.slice(0, 10);
  localStorage.setItem('binder-recently-viewed', JSON.stringify(recent));
  return recent;
}

// Estimate how many of the user's collectibles match a set
export function estimateOwnership(binderEntry, collectibles) {
  if (!collectibles || collectibles.length === 0) return { count: 0, percent: 0 };
  const setNameLower = binderEntry.name.toLowerCase();
  const matches = collectibles.filter(c => {
    const sn = (c.set_name || '').toLowerCase();
    const pl = (c.product_line || '').toLowerCase();
    const fr = (c.franchise || '').toLowerCase();
    return sn.includes(setNameLower) || pl.includes(setNameLower) ||
           (fr.includes(setNameLower) && sn.includes(setNameLower));
  });
  const count = matches.length;
  const percent = Math.min(100, Math.round((count / binderEntry.estimatedCollectibles) * 100));
  return { count, percent };
}

// Recommend binders based on user's collection, watchlist, and favorites
export function getRecommendations(collectibles, watchlist, existingBinderSets) {
  const index = getBinderIndex();
  const recs = [];

  // Category frequency from collectibles
  const catCounts = {};
  for (const c of collectibles || []) {
    const cat = c.category_name || c.category_id;
    if (cat) catCounts[cat.toLowerCase()] = (catCounts[cat.toLowerCase()] || 0) + 1;
  }

  // Find sets where user already owns matching items
  for (const entry of index) {
    if (existingBinderSets?.has(entry.id)) continue;
    const ownership = estimateOwnership(entry, collectibles);
    if (ownership.count > 0) {
      recs.push({ ...entry, ownership, reason: `You already own ${ownership.count} item${ownership.count !== 1 ? 's' : ''} from this set` });
    }
  }

  // Sort by ownership count descending
  recs.sort((a, b) => b.ownership.count - a.ownership.count);

  // If not enough recs, add popular sets
  if (recs.length < 6) {
    const existing = new Set(recs.map(r => r.id));
    for (const entry of index) {
      if (recs.length >= 8) break;
      if (existing.has(entry.id) || existingBinderSets?.has(entry.id)) continue;
      if (entry.popular) {
        recs.push({ ...entry, ownership: { count: 0, percent: 0 }, reason: 'Trending set' });
        existing.add(entry.id);
      }
    }
  }

  // If still not enough, add from most collected category
  if (recs.length < 4) {
    const existing = new Set(recs.map(r => r.id));
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      const catKey = Object.keys(MASTER_BINDERS).find(k =>
        MASTER_BINDERS[k].label.toLowerCase() === topCat[0]
      );
      if (catKey) {
        for (const entry of index) {
          if (recs.length >= 6) break;
          if (entry.category !== catKey || existing.has(entry.id) || existingBinderSets?.has(entry.id)) continue;
          recs.push({ ...entry, ownership: { count: 0, percent: 0 }, reason: `Matches your ${MASTER_BINDERS[catKey].label} collection` });
          existing.add(entry.id);
        }
      }
    }
  }

  return recs.slice(0, 6);
}