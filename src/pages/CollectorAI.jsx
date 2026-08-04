import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import CollectorAIChat from '@/components/CollectorAIChat';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export default function CollectorAI() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collectibles, setCollectibles] = useState([]);
  const [pricingHistory, setPricingHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [items, history] = await Promise.all([
        base44.entities.Collectible.filter({ created_by_id: user.id }, '-created_date', 200),
        base44.entities.PricingHistory.list('-created_date', 200),
      ]);
      setCollectibles(items.filter((c) => !c.is_deleted));
      setPricingHistory(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-primary" /> Collector AI
          </h1>
          <p className="text-xs text-muted-foreground">Ask questions about your collection</p>
        </div>
      </div>
      <CollectorAIChat collectibles={collectibles} pricingHistory={pricingHistory} />
    </div>
  );
}