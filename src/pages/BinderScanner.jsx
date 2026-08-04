import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import PhotoUploader from '@/components/PhotoUploader';
import { scanBinderPage } from '@/lib/binderScanner';
import { checkAndAwardBadges } from '@/lib/achievements';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Tag,
  Sparkles,
  AlertTriangle,
  Copy,
  Camera,
  Package,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';

const SUPPORTED_KEYWORDS = ['pokémon', 'pokemon', 'magic', 'lorcana', 'sports card'];

export default function BinderScanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [binderPhoto, setBinderPhoto] = useState({});
  const [scanning, setScanning] = useState(false);
  const [detectedCards, setDetectedCards] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.CollectibleCategory.list('sort_order', 50).then((cats) => {
      setCategories(
        cats.filter(
          (c) =>
            c.active &&
            SUPPORTED_KEYWORDS.some((kw) => c.name.toLowerCase().includes(kw))
        )
      );
    });
  }, []);

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    setStep(2);
  };

  const handleScan = async () => {
    const photoUrl = binderPhoto.front;
    if (!photoUrl) return;
    setScanning(true);
    setError('');
    try {
      const result = await scanBinderPage(photoUrl, selectedCategory.name);
      const cards = (result.cards || []).map((card, idx) => ({
        ...card,
        id: `detected-${idx}`,
        position: card.position || idx + 1,
        confirmed: card.identification_confidence === 'high',
      }));
      setDetectedCards(cards);
      setStep(3);
    } catch (err) {
      console.error('Binder scan failed', err);
      setError('Could not scan binder page. Please try a clearer photo.');
    } finally {
      setScanning(false);
    }
  };

  const duplicates = useMemo(() => {
    const seen = {};
    const dupIds = new Set();
    detectedCards.forEach((card) => {
      const key = `${card.item_name}_${card.set_name}_${card.card_number}`.toLowerCase();
      if (key !== 'unknown card__' && seen[key]) {
        dupIds.add(card.id);
        dupIds.add(seen[key]);
      }
      seen[key] = card.id;
    });
    return dupIds;
  }, [detectedCards]);

  const toggleConfirm = (cardId) => {
    setDetectedCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, confirmed: !c.confirmed } : c))
    );
  };

  const updateCard = (cardId, field, value) => {
    setDetectedCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, [field]: value } : c))
    );
  };

  const handleImport = async () => {
    const confirmed = detectedCards.filter((c) => c.confirmed);
    if (confirmed.length === 0) return;
    setImporting(true);
    setError('');
    try {
      for (const card of confirmed) {
        const collectible = await base44.entities.Collectible.create({
          item_name: card.item_name || 'Unknown Card',
          category_id: selectedCategory.id,
          category_name: selectedCategory.name,
          character_athlete_name: card.character_athlete_name || undefined,
          set_name: card.set_name || undefined,
          card_number: card.card_number || undefined,
          year: card.year || undefined,
          variant: card.variant || undefined,
          edition: card.edition || undefined,
          estimated_value: card.estimated_value || 0,
          low_value: card.low_value || 0,
          high_value: card.high_value || 0,
          value_source: 'AI Estimate',
          value_type: 'manual',
          value_confidence: card.confidence || 'low',
          privacy_status: 'private',
          primary_photo_url: binderPhoto.front || '',
        });
        await base44.entities.PricingHistory.create({
          collectible_id: collectible.id,
          collectible_name: card.item_name || 'Unknown Card',
          estimated_value: card.estimated_value || 0,
          low_value: card.low_value || 0,
          high_value: card.high_value || 0,
          pricing_source: 'AI Estimate',
          value_type: 'manual',
          confidence: card.confidence || 'low',
          valuation_notes: card.identification_notes || undefined,
        });
      }
      await checkAndAwardBadges(user);
      setImportedCount(confirmed.length);
      setStep(4);
    } catch (err) {
      console.error('Import failed', err);
      setError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const confirmedCount = detectedCards.filter((c) => c.confirmed).length;

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-8 bg-primary' : s < step ? 'w-4 bg-primary/50' : 'w-4 bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="w-10" />
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold mb-1">Binder Scanner</h2>
            <p className="text-sm text-muted-foreground">
              Scan a binder page to detect and import multiple cards at once.
            </p>
          </div>
          <div className="rounded-2xl bg-accent/50 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Binder scanning supports Pokémon, Magic, Lorcana, and Sports Cards. Funko is not supported.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat)}
                className="p-4 rounded-2xl border border-border bg-card text-left transition-all active:scale-[0.98] hover:border-primary/50"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3 text-lg">
                  {cat.icon || '📦'}
                </div>
                <p className="font-semibold text-sm">{cat.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Photo */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold mb-1">Scan Binder Page</h2>
            <p className="text-sm text-muted-foreground">
              Photograph or upload an image of your binder page. Ensure good lighting and that all cards are visible.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium">
            <Tag className="w-3 h-3" /> {selectedCategory.name}
          </div>
          <PhotoUploader
            photoTypes={[{ key: 'front', label: 'Binder Page', required: true }]}
            photos={binderPhoto}
            onChange={(p) => setBinderPhoto(p)}
          />
          {binderPhoto.front && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Scanning page...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Scan Page
                </>
              )}
            </button>
          )}
          {error && <p className="text-sm text-loss text-center">{error}</p>}
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold mb-1">
              {detectedCards.length} Card{detectedCards.length !== 1 ? 's' : ''} Detected
            </h2>
            <p className="text-sm text-muted-foreground">
              Review each card and confirm before importing. {confirmedCount} confirmed.
            </p>
          </div>
          {duplicates.size > 0 && (
            <div className="rounded-2xl bg-gold/5 border border-gold/20 p-3 flex items-start gap-2">
              <Copy className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Possible duplicates detected. Review cards marked with the duplicate badge.
              </p>
            </div>
          )}
          <div className="space-y-3">
            {detectedCards
              .sort((a, b) => a.position - b.position)
              .map((card) => (
                <div
                  key={card.id}
                  className={`rounded-2xl border p-3 transition-colors ${
                    card.confirmed
                      ? 'bg-card border-primary'
                      : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleConfirm(card.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        card.confirmed
                          ? 'bg-primary border-primary'
                          : 'border-border'
                      }`}
                    >
                      {card.confirmed && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-muted-foreground">#{card.position}</span>
                        <input
                          value={card.item_name || ''}
                          onChange={(e) => updateCard(card.id, 'item_name', e.target.value)}
                          className="text-sm font-semibold bg-transparent border-none outline-none flex-1 min-w-0"
                        />
                        {duplicates.has(card.id) && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-gold/10 text-gold rounded-full px-1.5 py-0.5 font-medium flex-shrink-0">
                            <Copy className="w-2.5 h-2.5" /> Dup
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            card.identification_confidence === 'high'
                              ? 'bg-gain/10 text-gain'
                              : card.identification_confidence === 'medium'
                              ? 'bg-gold/10 text-gold'
                              : 'bg-loss/10 text-loss'
                          }`}
                        >
                          ID: {card.identification_confidence || 'low'}
                        </span>
                        {card.estimated_value > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                            {formatCurrency(card.estimated_value)}
                          </span>
                        )}
                      </div>
                      {card.set_name && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {card.set_name}
                          {card.card_number ? ` · #${card.card_number}` : ''}
                          {card.year ? ` · ${card.year}` : ''}
                        </p>
                      )}
                      {card.identification_notes && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                          {card.identification_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          <button
            onClick={handleImport}
            disabled={importing || confirmedCount === 0}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40 sticky bottom-24"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Importing {confirmedCount} cards...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" /> Import {confirmedCount} Card{confirmedCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
          {error && <p className="text-sm text-loss text-center">{error}</p>}
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-gain/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gain" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">
            {importedCount} Card{importedCount !== 1 ? 's' : ''} Imported
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Your cards have been added to your collection. You can edit each card's details from its detail page.
          </p>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <button
              onClick={() => navigate('/collection')}
              className="bg-primary text-primary-foreground rounded-full px-6 py-3 font-medium"
            >
              View Collection
            </button>
            <button
              onClick={() => {
                setStep(1);
                setDetectedCards([]);
                setBinderPhoto({});
                setImportedCount(0);
              }}
              className="text-primary font-medium text-sm py-2"
            >
              Scan Another Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}