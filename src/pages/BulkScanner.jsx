import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { identifyAndPrice } from '@/lib/collectibleAI';
import { checkAndAwardBadges } from '@/lib/achievements';
import { awardXP, XP_REWARDS } from '@/lib/xpSystem';
import {
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  AlertTriangle,
  Package,
  X,
  RotateCw,
  Copy,
  Plus,
} from 'lucide-react';

const SUPPORTED_CATEGORIES = ['Pokémon', 'Magic: The Gathering', 'Disney Lorcana', 'Sports Cards'];

const BULK_SCAN_CONCURRENCY = 3;

async function mapWithConcurrency(items, concurrency, worker, onProgress) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;

  async function runWorker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
      completed += 1;
      onProgress?.(completed);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

export default function BulkScanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [uploads, setUploads] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [existingItems, setExistingItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.CollectibleCategory.list('sort_order', 50).then((cats) => {
      const filtered = cats.filter(
        (c) => c.active && SUPPORTED_CATEGORIES.some((kw) => c.name.toLowerCase().includes(kw.toLowerCase().split(' ')[0]))
      );
      setCategories(filtered);
    });
  }, []);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file_url,
          file_name: file.name,
          status: 'pending',
          result: null,
        };
      });
      const uploaded = await Promise.all(uploadPromises);
      setUploads((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError('Failed to upload images. Please try again.');
    }
  };

  const removeUpload = (id) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleProcess = async () => {
    if (uploads.length === 0) return;
    setProcessing(true);
    setProcessProgress(0);
    setError('');

    const selectedCat = categories.find((c) => c.id === selectedCategoryId);

    // Mark the entire batch as queued immediately so the user sees progress,
    // then process a small number in parallel to reduce total scan time
    // without flooding the AI integration.
    setUploads((prev) => prev.map((u) => ({ ...u, status: 'processing' })));

    const updatedResults = await mapWithConcurrency(
      uploads,
      BULK_SCAN_CONCURRENCY,
      async (upload) => {
        try {
          const result = await identifyAndPrice([upload.file_url], selectedCat?.name || 'Trading Cards');
          const confidence = result.identification_confidence || result.confidence || 'low';
          return {
            ...upload,
            status: 'done',
            result: {
              item_name: result.item_name || 'Unknown Card',
              character_athlete_name: result.character_athlete_name || '',
              set_name: result.set_name || '',
              card_number: result.card_number || '',
              year: result.year || '',
              variant: result.variant || '',
              edition: result.edition || '',
              estimated_value: result.estimated_value || 0,
              low_value: result.low_value || 0,
              high_value: result.high_value || 0,
              confidence: result.confidence || 'low',
              identification_confidence: confidence,
              identification_notes: result.identification_notes || '',
            },
            confirmed: confidence === 'high',
          };
        } catch (err) {
          console.error('Bulk scan identification failed', upload.file_name, err);
          return { ...upload, status: 'failed', result: null, confirmed: false };
        }
      },
      setProcessProgress
    );

    setUploads(updatedResults);
    setResults(updatedResults);

    // Load the user's existing collection once, after identification, for duplicate detection.
    try {
      const existing = await base44.entities.Collectible.filter(
        { created_by_id: user.id, is_deleted: false },
        '-created_date',
        500
      );
      setExistingItems(existing);
    } catch (e) {
      console.error('Duplicate-check collection load failed', e);
    }

    setProcessing(false);
    setStep(3);
  };

  const duplicates = useMemo(() => {
    const dupIds = new Set();
    const seen = {};
    results.forEach((r) => {
      if (!r.result) return;
      const key = `${r.result.item_name}_${r.result.set_name}_${r.result.card_number}`.toLowerCase();
      if (key !== 'unknown card__' && seen[key]) {
        dupIds.add(r.id);
        dupIds.add(seen[key]);
      }
      seen[key] = r.id;
    });
    return dupIds;
  }, [results]);

  const existingDuplicates = useMemo(() => {
    const dupIds = new Set();
    const existingKeys = new Set(
      existingItems.map((e) => `${e.item_name}_${e.set_name}_${e.card_number}`.toLowerCase())
    );
    results.forEach((r) => {
      if (!r.result) return;
      const key = `${r.result.item_name}_${r.result.set_name}_${r.result.card_number}`.toLowerCase();
      if (key !== 'unknown card__' && existingKeys.has(key)) {
        dupIds.add(r.id);
      }
    });
    return dupIds;
  }, [results, existingItems]);

  const toggleConfirm = (id) => {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, confirmed: !r.confirmed } : r)));
  };

  const updateResult = (id, field, value) => {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, result: { ...r.result, [field]: value } } : r)));
  };

  const retryResult = async (id) => {
    const upload = results.find((r) => r.id === id);
    if (!upload) return;
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'processing' } : r)));
    try {
      const selectedCat = categories.find((c) => c.id === selectedCategoryId);
      const result = await identifyAndPrice([upload.file_url], selectedCat?.name || 'Trading Cards');
      setResults((prev) => prev.map((r) => (r.id === id ? {
        ...r,
        status: 'done',
        result: {
          item_name: result.item_name || 'Unknown Card',
          character_athlete_name: result.character_athlete_name || '',
          set_name: result.set_name || '',
          card_number: result.card_number || '',
          year: result.year || '',
          variant: result.variant || '',
          edition: result.edition || '',
          estimated_value: result.estimated_value || 0,
          low_value: result.low_value || 0,
          high_value: result.high_value || 0,
          confidence: result.confidence || 'low',
          identification_confidence: result.identification_confidence || result.confidence || 'low',
          identification_notes: result.identification_notes || '',
        },
        confirmed: (result.identification_confidence || result.confidence || 'low') === 'high',
      } : r)));
    } catch (err) {
      setResults((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'failed' } : r)));
    }
  };

  const removeResult = (id) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
  };

  const selectAll = () => setResults((prev) => prev.map((r) => (r.status === 'done' ? { ...r, confirmed: true } : r)));
  const deselectAll = () => setResults((prev) => prev.map((r) => ({ ...r, confirmed: false })));

  const handleImport = async () => {
    const confirmed = results.filter((r) => r.confirmed && r.result);
    if (confirmed.length === 0) return;
    setImporting(true);
    setError('');
    const selectedCat = categories.find((c) => c.id === selectedCategoryId);
    let successCount = 0;
    const failed = [];

    for (const item of confirmed) {
      try {
        const collectible = await base44.entities.Collectible.create({
          item_name: item.result.item_name || 'Unknown Card',
          category_id: selectedCat?.id,
          category_name: selectedCat?.name || 'Trading Cards',
          character_athlete_name: item.result.character_athlete_name || undefined,
          set_name: item.result.set_name || undefined,
          card_number: item.result.card_number || undefined,
          year: item.result.year ? parseInt(item.result.year) : undefined,
          variant: item.result.variant || undefined,
          edition: item.result.edition || undefined,
          estimated_value: item.result.estimated_value || 0,
          low_value: item.result.low_value || 0,
          high_value: item.result.high_value || 0,
          value_source: 'AI Estimate',
          value_type: 'manual',
          value_confidence: item.result.confidence || 'low',
          privacy_status: 'private',
          primary_photo_url: item.file_url || '',
        });
        await base44.entities.PricingHistory.create({
          collectible_id: collectible.id,
          collectible_name: item.result.item_name || 'Unknown Card',
          estimated_value: item.result.estimated_value || 0,
          low_value: item.result.low_value || 0,
          high_value: item.result.high_value || 0,
          pricing_source: 'AI Estimate',
          value_type: 'manual',
          confidence: item.result.confidence || 'low',
          valuation_notes: item.result.identification_notes || undefined,
        });
        successCount++;
      } catch (err) {
        failed.push(item.result.item_name || 'Unknown Card');
      }
    }

    if (successCount > 0) {
      await checkAndAwardBadges(user);
      await awardXP(user, XP_REWARDS.ADD_COLLECTIBLE * successCount, 'Bulk scanner import');
    }

    setImportSummary({ successCount, failedCount: failed.length, failed });
    setImporting(false);
    setStep(4);
  };

  const confirmedCount = results.filter((r) => r.confirmed).length;

  return (
    <div className="px-4 py-4">
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
            <h2 className="font-display text-xl font-bold mb-1">Bulk Scanner</h2>
            <p className="text-sm text-muted-foreground">
              Upload multiple card images and import them in a single batch.
            </p>
          </div>
          <div className="rounded-2xl bg-accent/50 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Supports Pokémon, Magic: The Gathering, Disney Lorcana, and Sports Cards.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setStep(2);
                }}
                className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                  selectedCategoryId === cat.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3 text-lg">
                  {cat.icon || '🃏'}
                </div>
                <p className="font-semibold text-sm">{cat.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold mb-1">Upload Card Images</h2>
            <p className="text-sm text-muted-foreground">
              Select multiple card photos. Each will be processed and identified individually.
            </p>
          </div>
          <label className="w-full h-32 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all">
            <Plus className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Add photos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          {uploads.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{uploads.length} image(s) ready</p>
              <div className="grid grid-cols-3 gap-2">
                {uploads.map((upload) => (
                  <div key={upload.id} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                    <img src={upload.file_url} alt={upload.file_name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeUpload(upload.id)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              {processing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing {processProgress} of {uploads.length}...
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(processProgress / uploads.length) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleProcess}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" /> Identify {uploads.length} Card{uploads.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}
          {error && <p className="text-sm text-loss text-center">{error}</p>}
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold mb-1">
              {results.filter((r) => r.status === 'done').length} Card(s) Identified
            </h2>
            <p className="text-sm text-muted-foreground">
              Review each result and confirm before importing. {confirmedCount} confirmed.
            </p>
          </div>
          {(duplicates.size > 0 || existingDuplicates.size > 0) && (
            <div className="rounded-2xl bg-gold/5 border border-gold/20 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                {duplicates.size > 0 && 'Possible duplicates within this batch. '}
                {existingDuplicates.size > 0 && `${existingDuplicates.size} card(s) already exist in your collection.`}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={selectAll} className="flex-1 h-8 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-accent">
              Select All
            </button>
            <button onClick={deselectAll} className="flex-1 h-8 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-accent">
              Deselect All
            </button>
          </div>
          <div className="space-y-3">
            {results.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-3 ${
                  item.status === 'failed'
                    ? 'border-loss/30 bg-loss/5'
                    : duplicates.has(item.id) || existingDuplicates.has(item.id)
                    ? 'border-gold/30 bg-gold/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start gap-3">
                  {item.file_url && (
                    <img src={item.file_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {item.status === 'failed' ? (
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-loss">Identification failed</p>
                        <button
                          onClick={() => retryResult(item.id)}
                          className="text-xs text-primary font-medium flex items-center gap-1"
                        >
                          <RotateCw className="w-3 h-3" /> Retry
                        </button>
                      </div>
                    ) : item.result ? (
                      <>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{item.result.item_name}</p>
                          {item.result.identification_confidence === 'high' && (
                            <span className="text-[9px] bg-gain/10 text-gain rounded-full px-1.5 py-0.5 font-bold">HIGH</span>
                          )}
                          {item.result.identification_confidence === 'medium' && (
                            <span className="text-[9px] bg-gold/10 text-gold rounded-full px-1.5 py-0.5 font-bold">MED</span>
                          )}
                          {item.result.identification_confidence === 'low' && (
                            <span className="text-[9px] bg-loss/10 text-loss rounded-full px-1.5 py-0.5 font-bold">LOW</span>
                          )}
                        </div>
                        {item.result.set_name && <p className="text-xs text-muted-foreground">{item.result.set_name}</p>}
                        <p className="text-sm font-bold mt-0.5">${(item.result.estimated_value || 0).toFixed(2)}</p>
                        {item.result.identification_notes && (
                          <p className="text-[10px] text-muted-foreground mt-1">{item.result.identification_notes}</p>
                        )}
                        {duplicates.has(item.id) && (
                          <p className="text-[10px] text-gold mt-1 flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Possible duplicate in this batch
                          </p>
                        )}
                        {existingDuplicates.has(item.id) && (
                          <p className="text-[10px] text-gold mt-1">Already in your collection</p>
                        )}
                      </>
                    ) : null}
                  </div>
                  {item.status !== 'failed' && (
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleConfirm(item.id)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center ${
                          item.confirmed ? 'bg-primary text-primary-foreground' : 'border border-border'
                        }`}
                      >
                        {item.confirmed && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => removeResult(item.id)}
                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-loss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
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
      {step === 4 && importSummary && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-gain/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gain" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">
            {importSummary.successCount} Card{importSummary.successCount !== 1 ? 's' : ''} Imported
          </h2>
          {importSummary.failedCount > 0 && (
            <p className="text-sm text-loss mb-2">
              {importSummary.failedCount} card(s) failed to import.
            </p>
          )}
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
                setUploads([]);
                setResults([]);
                setImportSummary(null);
              }}
              className="text-primary font-medium text-sm py-2"
            >
              Scan More Cards
            </button>
          </div>
        </div>
      )}
    </div>
  );
}