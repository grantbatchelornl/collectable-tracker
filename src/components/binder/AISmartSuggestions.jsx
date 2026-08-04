import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, BookOpen, ChevronRight } from 'lucide-react';

export default function AISmartSuggestions({ collectibles }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);

  const groups = useMemo(() => {
    const map = {};
    collectibles.forEach((c) => {
      const franchise = c.franchise || c.category_name || 'Unknown';
      const setName = c.set_name || '';
      if (!setName) return;
      const key = `${franchise}::${setName}`;
      if (!map[key]) map[key] = { franchise, set_name: setName, category: c.category_id, category_name: c.category_name, items: [] };
      map[key].items.push(c.item_name);
    });
    return Object.values(map).filter((g) => g.items.length >= 3);
  }, [collectibles]);

  useEffect(() => {
    if (groups.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchSuggestions = async () => {
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this collector's collection and suggest binders they should create.

Collection groups (franchise → set → item count):
${groups.map((g) => `${g.franchise} - ${g.set_name}: ${g.items.length} items owned (e.g., ${g.items.slice(0, 3).join(', ')})`).join('\n')}

For each set where the collector owns 3+ items, provide:
- set_name: The set name
- franchise: The franchise
- category: Best category match (pokemon, magic, lorcana, sports, funko, coins, memorabilia, or custom)
- owned_count: Items owned
- estimated_total: Estimated total items in the complete set
- completion_percent: Estimated completion percentage (0-100)
- suggestion_text: A short personalized message like "You own 87% of Jungle. Create binder?"
- missing_count: Estimated number of missing items

Only suggest sets where completion_percent >= 15. Sort by completion_percent descending. Limit to 3 suggestions.`,
          model: 'gemini_3_flash',
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              suggestions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    set_name: { type: 'string' },
                    franchise: { type: 'string' },
                    category: { type: 'string' },
                    owned_count: { type: 'number' },
                    estimated_total: { type: 'number' },
                    completion_percent: { type: 'number' },
                    suggestion_text: { type: 'string' },
                    missing_count: { type: 'number' },
                  },
                },
              },
            },
          },
        });
        if (!cancelled) setSuggestions(response.suggestions || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSuggestions();
    return () => { cancelled = true; };
  }, [groups]);

  const handleCreate = async (suggestion) => {
    setCreating(suggestion.set_name);
    try {
      const cat = suggestion.category || 'custom';
      const checklistResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate the complete collectible checklist for: ${suggestion.franchise} ${suggestion.set_name}

List every item in the set. Include number, name, and rarity.`,
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

      const binder = await base44.entities.CollectionBinder.create({
        user_id: user.id,
        name: `${suggestion.franchise} ${suggestion.set_name}`,
        category: cat,
        franchise: suggestion.franchise,
        set_name: suggestion.set_name,
        target_count: checklistResponse.total_count || (checklistResponse.items || []).length,
        checklist_json: JSON.stringify(checklistResponse.items || []),
        binder_type: 'master',
      });
      navigate(`/binder/${binder.id}`);
    } catch (e) {
      console.error(e);
      setCreating(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <p className="text-sm font-medium text-primary">AI Smart Suggestions</p>
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Analyzing your collection...</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium text-primary">AI Smart Suggestions</p>
      </div>

      {suggestions.map((s, idx) => (
        <div key={idx} className="rounded-xl bg-card border border-border p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium">{s.suggestion_text}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${s.completion_percent}%` }} />
                </div>
                <span className="text-[10px] font-bold text-primary">{s.completion_percent}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {s.owned_count} owned · {s.missing_count} missing · est. {s.estimated_total} total
              </p>
            </div>
          </div>
          {creating === s.set_name ? (
            <div className="flex items-center justify-center gap-1.5 py-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-[10px] text-muted-foreground">Creating binder...</span>
            </div>
          ) : (
            <Button
              onClick={() => handleCreate(s)}
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs"
            >
              <BookOpen className="w-3 h-3" /> Create Binder
              <ChevronRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}