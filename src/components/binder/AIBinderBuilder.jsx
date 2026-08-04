import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { buildBinderFromPrompt } from '@/lib/binderChecklist';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';

const AI_EXAMPLES = [
  'Every Charizard',
  'Every Pikachu',
  'Every Eeveelution',
  'PSA 10 Collection',
  'Cards To Grade',
  'Investment Collection',
  'Dallas Cowboys',
  'Marvel Blacklight',
  'Every Disney Villain',
  'Convention Binder',
  'Signed Memorabilia',
  'Top 100 Collection',
  'My Trade Binder',
  'Vault Collection',
];

export default function AIBinderBuilder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');

  const handleBuild = async (promptText) => {
    const finalPrompt = (promptText || prompt).trim();
    if (!finalPrompt) return;
    setBuilding(true);
    setError('');
    try {
      const response = await buildBinderFromPrompt(finalPrompt);
      const checklist = response.items || [];

      const binder = await base44.entities.CollectionBinder.create({
        user_id: user.id,
        name: response.suggested_name || finalPrompt,
        category: response.category || 'custom',
        franchise: 'Custom',
        set_name: finalPrompt,
        target_count: response.total_count || checklist.length,
        checklist_json: JSON.stringify(checklist),
        icon: '🎨',
        binder_type: 'custom',
        ai_prompt: finalPrompt,
        privacy_status: 'private',
      });

      navigate(`/binder/${binder.id}`);
    } catch (e) {
      console.error(e);
      setError('Could not build binder. Please try again.');
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-primary">AI Binder Builder</p>
          <span className="text-[10px] bg-primary/20 text-primary rounded-full px-1.5 py-0.5 font-bold">⭐⭐⭐⭐⭐</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Type what you want to collect. AI finds every matching item and builds the binder for you.
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Every Charizard ever printed"
          className="w-full h-20 rounded-xl border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={building}
        />
        <Button
          onClick={() => handleBuild()}
          disabled={building || !prompt.trim()}
          className="w-full h-12 font-medium"
        >
          {building ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> AI is building your binder...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Build Binder with AI</>
          )}
        </Button>
      </div>

      {error && <p className="text-xs text-loss text-center">{error}</p>}

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Try these:</p>
        <div className="flex flex-wrap gap-1.5">
          {AI_EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                if (!building) {
                  setPrompt(ex);
                  handleBuild(ex);
                }
              }}
              disabled={building}
              className="text-xs bg-card border border-border rounded-full px-2.5 py-1 hover:bg-accent disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {building && (
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            Finding every matching collectible... This may take a few seconds.
          </p>
        </div>
      )}
    </div>
  );
}