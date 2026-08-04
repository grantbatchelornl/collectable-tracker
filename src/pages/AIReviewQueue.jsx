import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { identifyAndPrice } from '@/lib/collectibleAI';
import { checkAndAwardBadges } from '@/lib/achievements';
import { awardXP, XP_REWARDS } from '@/lib/xpSystem';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Search,
  Edit3,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  Inbox,
  Sparkles,
} from 'lucide-react';

export default function AIReviewQueue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [rescanningId, setRescanningId] = useState(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await base44.entities.AIReviewQueue.filter(
        { user_id: user.id, status: 'pending' },
        '-created_date',
        50
      );
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectMatch = async (item, match) => {
    try {
      await base44.entities.AIReviewQueue.update(item.id, {
        status: 'confirmed',
        selected_match_json: JSON.stringify(match),
      });
      // Navigate to AddCollectible with pre-filled data
      const formData = item.form_data_json ? JSON.parse(item.form_data_json) : {};
      const photoUrls = item.photo_urls_json ? JSON.parse(item.photo_urls_json) : {};
      navigate('/add', {
        state: {
          reviewQueueItem: item.id,
          prefill: { ...formData, ...match, photos: photoUrls },
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditManually = (item) => {
    const formData = item.form_data_json ? JSON.parse(item.form_data_json) : {};
    const photoUrls = item.photo_urls_json ? JSON.parse(item.photo_urls_json) : {};
    navigate('/add', {
      state: {
        reviewQueueItem: item.id,
        prefill: { ...formData, photos: photoUrls, _manualEdit: true },
      },
    });
  };

  const handleRescan = async (item) => {
    setRescanningId(item.id);
    try {
      const photoUrls = item.photo_urls_json ? JSON.parse(item.photo_urls_json) : {};
      const photos = Object.values(photoUrls).filter(Boolean);
      const result = await identifyAndPrice(photos, item.category_name);
      const suggestions = result.suggestions || [
        {
          item_name: result.item_name,
          confidence: result.confidence || 'low',
          reason: result.identification_notes || '',
          ...result,
        },
      ];
      await base44.entities.AIReviewQueue.update(item.id, {
        ai_suggestions_json: JSON.stringify(suggestions),
        low_confidence_reason: result.identification_notes || 'Multiple possible matches detected.',
      });
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setRescanningId(null);
    }
  };

  const handleDiscard = async (item) => {
    try {
      await base44.entities.AIReviewQueue.update(item.id, { status: 'discarded' });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e) {
      console.error(e);
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
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold">AI Review Queue</h1>
          <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''} need review</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-lg font-bold mb-2">All Clear</h2>
          <p className="text-muted-foreground text-sm">No items waiting for review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const photos = item.photo_urls_json ? JSON.parse(item.photo_urls_json) : {};
            const photoUrls = Object.values(photos).filter(Boolean);
            const suggestions = item.ai_suggestions_json ? JSON.parse(item.ai_suggestions_json) : [];
            const isExpanded = expandedId === item.id;

            return (
              <div key={item.id} className="rounded-2xl bg-card border border-border overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full flex items-center gap-3 p-3"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {photoUrls[0] ? (
                      <Image src={photoUrls[0]} fittingType="fill" className="w-full h-full" alt="Review item" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium truncate">
                      {suggestions[0]?.item_name || 'Unknown item'}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.category_name || 'Uncategorized'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 text-gold" />
                      <p className="text-[10px] text-gold font-medium">
                        {item.low_confidence_reason || 'Low confidence identification'}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border p-3 space-y-3">
                    {/* Photos */}
                    {photoUrls.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {photoUrls.map((url, idx) => (
                          <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                            <Image src={url} fittingType="fill" className="w-full h-full" alt={`Photo ${idx + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Suggestions */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary" /> Top AI Matches
                      </p>
                      {suggestions.map((match, idx) => {
                        const confidence = match.confidence || 'low';
                        const confidencePct = confidence === 'high' ? 90 : confidence === 'medium' ? 60 : 30;
                        return (
                          <div key={idx} className="rounded-xl border border-border p-2.5 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{match.item_name}</p>
                                {match.brand && <p className="text-[10px] text-muted-foreground">{match.brand}</p>}
                                {match.set_name && <p className="text-[10px] text-muted-foreground">{match.set_name}</p>}
                              </div>
                              <span className={`text-xs font-bold flex-shrink-0 ${
                                confidencePct >= 60 ? 'text-gain' : confidencePct >= 40 ? 'text-gold' : 'text-loss'
                              }`}>
                                {confidencePct}%
                              </span>
                            </div>
                            {match.reason && (
                              <p className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
                                {match.reason}
                              </p>
                            )}
                            <Button
                              onClick={() => handleSelectMatch(item, match)}
                              size="sm"
                              className="w-full h-7 text-xs"
                            >
                              <Check className="w-3 h-3" /> Select This Match
                            </Button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button onClick={() => handleEditManually(item)} variant="outline" size="sm" className="text-xs">
                        <Edit3 className="w-3 h-3" /> Edit
                      </Button>
                      <Button
                        onClick={() => handleRescan(item)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        disabled={rescanningId === item.id}
                      >
                        {rescanningId === item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Rescan
                      </Button>
                      <Button
                        onClick={() => handleDiscard(item)}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}