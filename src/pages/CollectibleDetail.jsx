import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import ValueChart from '@/components/ValueChart';
import PrivacyBadge from '@/components/PrivacyBadge';
import {
  ArrowLeft,
  Pencil,
  Share2,
  Trash2,
  Loader2,
  Lock,
  Users,
  Globe,
  DollarSign,
  Calendar,
  Hash,
  Award,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { estimatePrice } from '@/lib/collectibleAI';

export default function CollectibleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collectible, setCollectible] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState('front');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const c = await base44.entities.Collectible.get(id);
      setCollectible(c);
      const [photosData, historyData] = await Promise.all([
        base44.entities.CollectiblePhoto.filter({ collectible_id: id }),
        base44.entities.PricingHistory.filter({ collectible_id: id }, '-created_date', 100),
      ]);
      setPhotos(photosData);
      setHistory(historyData);
      if (!photosData.some((p) => p.photo_type === 'front') && photosData.length > 0) {
        setActivePhoto('back');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.entities.CollectiblePhoto.deleteMany({ collectible_id: id });
      await base44.entities.PricingHistory.deleteMany({ collectible_id: id });
      await base44.entities.Collectible.delete(id);
      navigate('/');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: collectible.item_name, url });
      } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch (err) {}
    }
  };

  const handleRefreshPricing = async () => {
    setRefreshing(true);
    try {
      const result = await estimatePrice(collectible);
      const newValue = result.estimated_value || 0;
      const newLow = result.low_value || 0;
      const newHigh = result.high_value || 0;
      const source = result.pricing_source || 'AI Estimate';

      await base44.entities.PricingHistory.create({
        collectible_id: id,
        collectible_name: collectible.item_name,
        estimated_value: newValue,
        low_value: newLow,
        high_value: newHigh,
        pricing_source: source,
        confidence: result.confidence || 'low',
        comparables_count: result.comparables_count || 0,
        valuation_notes: result.valuation_notes || undefined,
      });

      if (!collectible.value_locked) {
        const updated = await base44.entities.Collectible.update(id, {
          estimated_value: newValue,
          low_value: newLow,
          high_value: newHigh,
          value_source: source,
          value_confidence: result.confidence || 'low',
          comparables_count: result.comparables_count || 0,
          valuation_notes: result.valuation_notes || undefined,
        });
        setCollectible(updated);
      }

      const historyData = await base44.entities.PricingHistory.filter(
        { collectible_id: id },
        '-created_date',
        100
      );
      setHistory(historyData);
    } catch (err) {
      console.error('Pricing refresh failed', err);
      alert('Could not refresh pricing. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  const toggleValueLock = async () => {
    const updated = await base44.entities.Collectible.update(id, {
      value_locked: !collectible.value_locked,
    });
    setCollectible(updated);
  };

  const cyclePrivacy = async () => {
    const order = ['private', 'friends', 'public'];
    const next = order[(order.indexOf(collectible.privacy_status) + 1) % 3];
    const updated = await base44.entities.Collectible.update(id, {
      privacy_status: next,
    });
    setCollectible(updated);
  };

  const toggleForSale = async () => {
    const updated = await base44.entities.Collectible.update(id, {
      for_sale: !collectible.for_sale,
    });
    setCollectible(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!collectible) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Collectible not found.
      </div>
    );
  }

  const frontPhoto = photos.find((p) => p.photo_type === 'front');
  const backPhoto = photos.find((p) => p.photo_type === 'back');
  const currentPhoto =
    activePhoto === 'front'
      ? frontPhoto?.photo_url || backPhoto?.photo_url || collectible.primary_photo_url
      : backPhoto?.photo_url || frontPhoto?.photo_url || collectible.primary_photo_url;

  const detailRows = [
    { icon: Tag, label: 'Character / Athlete', value: collectible.character_athlete_name },
    { icon: Tag, label: 'Brand', value: collectible.brand },
    { icon: Tag, label: 'Product Line', value: collectible.product_line },
    { icon: Hash, label: 'Set Name', value: collectible.set_name },
    { icon: Hash, label: 'Set / Card Number', value: [collectible.set_number, collectible.card_number].filter(Boolean).join(' / ') },
    { icon: Calendar, label: 'Year', value: collectible.year?.toString() },
    { icon: Tag, label: 'Team', value: collectible.team },
    { icon: Tag, label: 'Variant', value: collectible.variant },
    { icon: Tag, label: 'Edition', value: collectible.edition },
    { icon: Tag, label: 'Parallel', value: collectible.parallel },
    { icon: Hash, label: 'Serial Number', value: collectible.serial_number },
    { icon: Award, label: 'Grading Company', value: collectible.grading_company },
    { icon: Award, label: 'Grade', value: collectible.grade },
    { icon: Tag, label: 'Box Condition', value: collectible.box_condition },
    { icon: Tag, label: 'Item Condition', value: collectible.item_condition },
    { icon: Award, label: 'Authentication', value: collectible.authentication_company },
  ].filter((r) => r.value);

  return (
    <div className="pb-4">
      {/* Photo */}
      <div className="relative aspect-square -mx-4 overflow-hidden bg-muted">
        <Image src={currentPhoto} fittingType="fill" className="w-full h-full" alt={collectible.item_name} />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/70 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute top-4 right-4">
          <PrivacyBadge status={collectible.privacy_status} />
        </div>
        {frontPhoto && backPhoto && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-background/70 backdrop-blur rounded-full p-1">
            <button
              onClick={() => setActivePhoto('front')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium ${activePhoto === 'front' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Front
            </button>
            <button
              onClick={() => setActivePhoto('back')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium ${activePhoto === 'back' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Back
            </button>
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Title + value */}
        <div>
          <p className="text-xs text-muted-foreground font-medium">{collectible.category_name}</p>
          <h1 className="font-display text-2xl font-bold mt-0.5">{collectible.item_name}</h1>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Estimated Value</p>
              <p className="font-display text-3xl font-extrabold">
                {formatCurrency(collectible.estimated_value)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex gap-1.5 justify-end">
                <span className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground rounded-full px-2.5 py-1 font-medium">
                  <DollarSign className="w-3 h-3" /> {collectible.value_source || 'Manual'}
                </span>
                {collectible.value_locked && (
                  <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 font-medium">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-[10px] text-muted-foreground">Low</p>
              <p className="font-semibold">{formatCurrency(collectible.low_value)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">High</p>
              <p className="font-semibold">{formatCurrency(collectible.high_value)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-muted-foreground">Last Updated</p>
              <p className="font-semibold text-xs">{formatDate(collectible.updated_date)}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border">
            Values are estimates and not guaranteed sale prices.
          </p>
        </div>

        {/* Valuation provenance */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-2.5">
          <h3 className="font-semibold text-sm">Valuation Details</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Source</span>
            <span className="font-medium text-right text-xs">{collectible.value_source || 'Manual'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className={`font-semibold capitalize ${
              collectible.value_confidence === 'high' ? 'text-gain' :
              collectible.value_confidence === 'medium' ? 'text-gold' : 'text-loss'
            }`}>{collectible.value_confidence || 'Unknown'}</span>
          </div>
          {collectible.comparables_count > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sold Comparables</span>
              <span className="font-semibold">{collectible.comparables_count}</span>
            </div>
          )}
          {history.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Refreshed</span>
              <span className="font-semibold text-xs">{formatDate(history[0].created_date)}</span>
            </div>
          )}
          {collectible.valuation_notes && (
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              {collectible.valuation_notes}
            </p>
          )}
        </div>

        {/* Value chart */}
        {history.length > 0 && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <h3 className="font-semibold text-sm mb-3">Value History</h3>
            <ValueChart data={history} />
          </div>
        )}

        {/* For Sale */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className={`w-4 h-4 ${collectible.for_sale ? 'text-gold' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-medium">List for Sale</p>
                <p className="text-[10px] text-muted-foreground">Mark this item as available for purchase</p>
              </div>
            </div>
            <button
              onClick={toggleForSale}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${collectible.for_sale ? 'bg-gold' : 'bg-muted'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${collectible.for_sale ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {collectible.for_sale && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Asking Price</p>
              <p className="font-display text-2xl font-bold text-gold">
                {formatCurrency(collectible.asking_price || collectible.estimated_value)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Set the asking price when editing. Visible to others if set to Public or Friends.
              </p>
            </div>
          )}
        </div>

        {/* Details */}
        {detailRows.length > 0 && (
          <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Item Details</h3>
            {detailRows.map((row, i) => {
              const Icon = row.icon;
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="w-3.5 h-3.5" /> {row.label}
                  </span>
                  <span className="font-medium text-right">{row.value}</span>
                </div>
              );
            })}
            {collectible.has_autograph && (
              <div className="flex items-center gap-2 text-sm pt-2 border-t border-border">
                <Award className="w-4 h-4 text-gold" />
                <span className="font-medium text-gold">Autographed</span>
              </div>
            )}
          </div>
        )}

        {collectible.notes && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <h3 className="font-semibold text-sm mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{collectible.notes}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleRefreshPricing}
            disabled={refreshing}
            className="w-full h-12 font-medium"
          >
            {refreshing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking market prices...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh Pricing
              </>
            )}
          </Button>
          <div className="flex items-center justify-between rounded-xl bg-card border border-border p-3">
            <div className="flex items-center gap-2">
              <Lock className={`w-4 h-4 ${collectible.value_locked ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm font-medium">Lock Value</p>
                <p className="text-[10px] text-muted-foreground">Prevent AI from updating this value</p>
              </div>
            </div>
            <button
              onClick={toggleValueLock}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${collectible.value_locked ? 'bg-primary' : 'bg-muted'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${collectible.value_locked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/collectible/${id}/edit`)}
            className="h-11"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Button>
          <Button variant="outline" onClick={handleShare} className="h-11">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button
            variant="outline"
            onClick={cyclePrivacy}
            className="h-11"
          >
            {collectible.privacy_status === 'private' && <Lock className="w-4 h-4" />}
            {collectible.privacy_status === 'friends' && <Users className="w-4 h-4" />}
            {collectible.privacy_status === 'public' && <Globe className="w-4 h-4" />}
            Privacy
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDelete(true)}
            className="h-11 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this collectible?</DialogTitle>
            <DialogDescription>
              This will permanently remove "{collectible.item_name}" and all its pricing history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}