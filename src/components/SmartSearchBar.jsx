import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, Sparkles, X } from 'lucide-react';

const NATURAL_LANGUAGE_PATTERNS = /\b(worth|over|under|above|below|psa|psa\s?\d|gem|mint|near|from|year|rookie|auto|graded|raw|missing|cheapest|most expensive|oldest|newest)\b/i;

export default function SmartSearchBar({ collectibles, onFilterChange, placeholder = 'Search or ask AI...' }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSmart, setIsSmart] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      onFilterChange(null);
      setIsSmart(false);
      return;
    }

    // Check if query looks like natural language
    const isNaturalLanguage = NATURAL_LANGUAGE_PATTERNS.test(query) || query.split(' ').length > 3;

    if (!isNaturalLanguage) {
      // Basic text search
      const q = query.toLowerCase();
      const filtered = collectibles.filter(
        (c) =>
          c.item_name?.toLowerCase().includes(q) ||
          c.category_name?.toLowerCase().includes(q) ||
          c.character_athlete_name?.toLowerCase().includes(q) ||
          c.brand?.toLowerCase().includes(q) ||
          c.set_name?.toLowerCase().includes(q) ||
          c.franchise?.toLowerCase().includes(q)
      );
      onFilterChange(filtered.map((c) => c.id));
      setIsSmart(false);
      return;
    }

    // AI-powered search
    setIsSmart(true);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a smart search engine for a collectibles collection. 

The user's collection contains these items (ID, name, category, value, grade, year, franchise, set, brand, sport, team, character, acquisition_source):

${collectibles.map((c) => `ID:${c.id} | ${c.item_name} | ${c.category_name} | $${c.estimated_value || 0} | grade:${c.grade || 'raw'} | year:${c.year || ''} | ${c.franchise || ''} | ${c.set_name || ''} | ${c.brand || ''} | ${c.sport || ''} | ${c.team || ''} | ${c.character_athlete_name || ''} | ${c.acquisition_source || ''}`).join('\n')}

User query: "${query}"

Return the IDs of collectibles that match the query. Interpret natural language like:
- "Cards worth over $100" → items with estimated_value > 100
- "PSA 10 Charizard" → items with grading_company=PSA, grade=10, name contains Charizard
- "Disney Funko" → items with franchise containing Disney and category containing Funko
- "Missing cards from Base Set" → items in Base Set that user doesn't own (return empty if none)
- "Coins from 1921" → coin category items with year=1921
- "Tom Brady rookies" → items with character_athlete_name containing Tom Brady and is_rookie=true

Only return IDs that exist in the collection above.`,
          response_json_schema: {
            type: 'object',
            properties: {
              matching_ids: { type: 'array', items: { type: 'string' } },
              explanation: { type: 'string' },
            },
          },
        });
        onFilterChange(response.matching_ids || [], response.explanation);
      } catch (e) {
        console.error(e);
        onFilterChange(null);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, collectibles, onFilterChange]);

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        {isSearching ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : isSmart ? (
          <Sparkles className="w-4 h-4 text-primary" />
        ) : (
          <Search className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-11 pl-10 pr-10 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}