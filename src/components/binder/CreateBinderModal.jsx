import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { BINDER_CATEGORIES } from '@/lib/binderCategories';
import { generateChecklist } from '@/lib/binderChecklist';
import { Loader2, ChevronRight } from 'lucide-react';

export default function CreateBinderModal({ user, onClose, onCreated }) {
  const [step, setStep] = useState('category');
  const [category, setCategory] = useState(null);
  const [setName, setSetName] = useState('');
  const [customSet, setCustomSet] = useState('');
  const [series, setSeries] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const categoryConfig = BINDER_CATEGORIES.find((c) => c.key === category);
  const selectedSet = customSet || setName;

  const handleSelectCategory = (cat) => {
    setCategory(cat.key);
    setStep('set');
  };

  const handleCreate = async () => {
    if (!selectedSet) return;
    setCreating(true);
    setError('');
    try {
      const checklistResponse = await generateChecklist(
        category,
        selectedSet,
        categoryConfig.label,
        series
      );
      const checklist = checklistResponse.items || [];

      const binder = await base44.entities.CollectionBinder.create({
        user_id: user.id,
        name: `${categoryConfig.label} ${selectedSet}${series ? ' ' + series : ''}`,
        category,
        franchise: categoryConfig.label,
        set_name: selectedSet,
        series: series || undefined,
        target_count: checklistResponse.total_count || checklist.length,
        checklist_json: JSON.stringify(checklist),
        icon: categoryConfig.icon,
      });

      onCreated(binder);
    } catch (e) {
      console.error(e);
      setError('Could not generate checklist. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Collection Binder</DialogTitle>
          <DialogDescription>
            {step === 'category' && 'Choose a category for your binder'}
            {step === 'set' && `Select a set for ${categoryConfig?.label}`}
          </DialogDescription>
        </DialogHeader>

        {creating ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium">Generating checklist...</p>
            <p className="text-xs text-muted-foreground mt-1">
              AI is finding every item in {categoryConfig?.label} {selectedSet}
            </p>
          </div>
        ) : step === 'category' ? (
          <div className="grid grid-cols-2 gap-2">
            {BINDER_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleSelectCategory(cat)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 hover:bg-accent ${cat.color}`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              {categoryConfig?.sets.map((set) => (
                <button
                  key={set}
                  onClick={() => { setSetName(set); setCustomSet(''); }}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    setName === set && !customSet
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {set}
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Or enter a custom set:</p>
              <Input
                value={customSet}
                onChange={(e) => setCustomSet(e.target.value)}
                placeholder="Custom set name"
                className="text-sm"
              />
            </div>

            {categoryConfig?.supportsSeries && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Series / Year (e.g., "2025" for entire series):
                </p>
                <Input
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  placeholder="e.g., 2025"
                  className="text-sm"
                />
              </div>
            )}

            {error && <p className="text-xs text-loss">{error}</p>}
          </div>
        )}

        {!creating && step === 'set' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep('category')}>
              Back
            </Button>
            <Button onClick={handleCreate} disabled={!selectedSet}>
              Generate Binder <ChevronRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}