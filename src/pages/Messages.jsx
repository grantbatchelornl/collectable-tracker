import { MessageCircle, Sparkles } from 'lucide-react';

export default function Messages() {
  return (
    <div className="px-4 py-4">
      <h2 className="font-display text-xl font-bold mb-1">Messages</h2>
      <p className="text-sm text-muted-foreground mb-8">Chat with your collector friends in real time.</p>
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-bold mb-2">Coming in Phase 3</h3>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Friends, real-time messaging, and collectible sharing in conversations are on the way.
        </p>
        <div className="inline-flex items-center gap-1.5 mt-6 text-xs text-primary bg-primary/10 rounded-full px-3 py-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5" /> Phase 3 Feature
        </div>
      </div>
    </div>
  );
}