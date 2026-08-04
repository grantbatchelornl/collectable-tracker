import { Heart, Calendar } from 'lucide-react';

export default function MemoryFields({ data, update }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Collection Memory</p>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Capture the story behind this collectible — why it's special to you.
      </p>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Why is this special?</label>
          <textarea
            value={data.why_special || ''}
            onChange={(e) => update('why_special', e.target.value)}
            placeholder="What makes this collectible meaningful to you?"
            rows={2}
            className="w-full rounded-lg bg-background border border-border text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Memory / Story</label>
          <textarea
            value={data.memory || ''}
            onChange={(e) => update('memory', e.target.value)}
            placeholder="Tell the story of how you got it, a moment it reminds you of, etc."
            rows={3}
            className="w-full rounded-lg bg-background border border-border text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Memory Date
            </label>
            <input
              type="date"
              value={data.memory_date || ''}
              onChange={(e) => update('memory_date', e.target.value)}
              className="w-full h-10 rounded-lg bg-background border border-border text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1 flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={data.memory_shared || false}
                onChange={(e) => update('memory_shared', e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-xs font-medium">Share publicly</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}