import { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
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
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';
import { buildBinderFromPrompt } from '@/lib/binderChecklist';
import { Loader2, Camera, Lock, Users, Globe } from 'lucide-react';

const BINDER_COLORS = [
  { name: 'Default', value: null },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Gold', value: '#f59e0b' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Purple', value: '#9333ea' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#ea580c' },
];

const BINDER_ICONS = ['⚡', '🔮', '✨', '⚾', '🎭', '🪙', '🏆', '📚', '🎯', '🎨', '💎', '🔥', '⭐', '🎮', '🃏', '👑', '🐉', '🦊', '🌟', '🎪'];

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: Lock },
  { value: 'friends', label: 'Friends', icon: Users },
  { value: 'public', label: 'Public', icon: Globe },
];

export default function CustomBinderModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [icon, setIcon] = useState('🎨');
  const [color, setColor] = useState(null);
  const [sorting, setSorting] = useState('number');
  const [visibility, setVisibility] = useState('private');
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handlePhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setCoverPhoto(result.file_url);
    } catch (e) {
      setError('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setCreating(true);
    setError('');
    try {
      let checklist = [];
      let targetCount = 0;

      if (aiPrompt.trim()) {
        const response = await buildBinderFromPrompt(aiPrompt.trim());
        checklist = response.items || [];
        targetCount = response.total_count || checklist.length;
      }

      const binder = await base44.entities.CollectionBinder.create({
        user_id: user.id,
        name: name.trim(),
        category: 'custom',
        franchise: 'Custom',
        set_name: name.trim(),
        target_count: targetCount,
        checklist_json: JSON.stringify(checklist),
        icon,
        color,
        sorting,
        view_mode: 'grid',
        privacy_status: visibility,
        binder_type: 'custom',
        ai_prompt: aiPrompt.trim() || undefined,
        cover_photo_url: coverPhoto || undefined,
      });

      onCreated(binder);
    } catch (e) {
      console.error(e);
      setError('Could not create binder. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Binder</DialogTitle>
          <DialogDescription>
            Create your own binder with custom styling. Optionally use AI to auto-populate slots.
          </DialogDescription>
        </DialogHeader>

        {creating ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium">Creating your binder...</p>
            {aiPrompt && <p className="text-xs text-muted-foreground mt-1">AI is finding matching items</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Binder Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Every Charizard"
              />
            </div>

            {/* AI Prompt */}
            <div className="space-y-1.5">
              <Label>AI Auto-Populate (optional)</Label>
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Every Charizard ever printed"
              />
              <p className="text-[10px] text-muted-foreground">
                AI will find all matching items and fill the slots automatically.
              </p>
            </div>

            {/* Cover Photo */}
            <div className="space-y-1.5">
              <Label>Cover Photo (optional)</Label>
              <button
                onClick={() => fileRef.current?.click()}
                className="relative w-full h-20 rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted"
              >
                {coverPhoto ? (
                  <Image src={coverPhoto} fittingType="fill" className="w-full h-full" alt="Cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhoto(e.target.files[0])}
              />
            </div>

            {/* Icon */}
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="grid grid-cols-10 gap-1">
                {BINDER_ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                      icon === ic ? 'bg-primary/20 border border-primary' : 'bg-muted'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {BINDER_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      color === c.value ? 'border-foreground scale-110' : 'border-border'
                    }`}
                    style={{ backgroundColor: c.value || 'hsl(var(--muted))' }}
                  />
                ))}
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-1.5">
              <Label>Default Sorting</Label>
              <select
                value={sorting}
                onChange={(e) => setSorting(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="number">Card Number</option>
                <option value="value">Value (High to Low)</option>
                <option value="name">Name (A-Z)</option>
                <option value="rarity">Rarity</option>
              </select>
            </div>

            {/* Visibility */}
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <div className="grid grid-cols-3 gap-2">
                {VISIBILITY_OPTIONS.map((v) => {
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.value}
                      onClick={() => setVisibility(v.value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs ${
                        visibility === v.value ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-xs text-loss">{error}</p>}
          </div>
        )}

        {!creating && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>Create Binder</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}