import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import PhotoUploader from '@/components/PhotoUploader';
import CollectibleFormFields from '@/components/CollectibleFormFields';
import AIConfidenceBanner from '@/components/AIConfidenceBanner';
import SaveAnimation from '@/components/SaveAnimation';
import { identifyAndPrice } from '@/lib/collectibleAI';
import { getPhotoTypes } from '@/lib/categoryFields';
import { checkAndAwardBadges } from '@/lib/achievements';
import { ArrowLeft, ArrowRight, Check, Loader2, Tag, Sparkles } from 'lucide-react';

const EMPTY = {
  category_id: '',
  category_name: '',
  photos: {},
  item_name: '',
  character_athlete_name: '',
  brand: '',
  product_line: '',
  set_name: '',
  set_number: '',
  card_number: '',
  year: '',
  team: '',
  variant: '',
  edition: '',
  parallel: '',
  serial_number: '',
  has_autograph: false,
  grading_company: '',
  grade: '',
  box_condition: '',
  item_condition: '',
  authentication_company: '',
  estimated_value: '',
  low_value: '',
  high_value: '',
  privacy_status: 'private',
  for_sale: false,
  asking_price: '',
  purchase_cost: '',
  value_confidence: '',
  value_type: '',
  comparables_count: 0,
  average_price: 0,
  most_recent_sale_date: '',
  comparable_date_range: '',
  matching_criteria: '',
  includes_shipping: false,
  valuation_notes: '',
  language: '',
  franchise: '',
  box_number: '',
  series: '',
  is_exclusive: false,
  has_sticker: false,
  is_chase: false,
  is_boxed: false,
  country: '',
  denomination: '',
  mint_mark: '',
  composition: '',
  sport: '',
  is_rookie: false,
  has_patch: false,
  item_type: '',
  is_game_used: false,
  notes: '',
};

export default function AddCollectible() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [aiIdentified, setAiIdentified] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [data, setData] = useState(EMPTY);

  useEffect(() => {
    base44.entities.CollectibleCategory.list('sort_order', 50)
      .then((cats) => setCategories(cats.filter((c) => c.active)))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  const update = (field, value) => setData((d) => ({ ...d, [field]: value }));

  const selectCategory = (cat) => {
    update('category_id', cat.id);
    update('category_name', cat.name);
    setStep(2);
  };

  const handleAutoIdentify = async () => {
    const photo = Object.values(data.photos || {}).find(Boolean);
    if (!photo) return;
    setIdentifying(true);
    try {
      const result = await identifyAndPrice(photo);
      setData((d) => ({
        ...d,
        item_name: result.item_name || d.item_name,
        character_athlete_name: result.character_athlete_name || d.character_athlete_name,
        brand: result.brand || d.brand,
        product_line: result.product_line || d.product_line,
        set_name: result.set_name || d.set_name,
        card_number: result.card_number || d.card_number,
        year: result.year != null ? result.year.toString() : d.year,
        team: result.team || d.team,
        variant: result.variant || d.variant,
        edition: result.edition || d.edition,
        parallel: result.parallel || d.parallel,
        has_autograph: result.has_autograph ?? d.has_autograph,
        grading_company: result.grading_company || d.grading_company,
        grade: result.grade || d.grade,
        estimated_value: result.estimated_value != null ? result.estimated_value.toString() : d.estimated_value,
        low_value: result.low_value != null ? result.low_value.toString() : d.low_value,
        high_value: result.high_value != null ? result.high_value.toString() : d.high_value,
        value_confidence: result.confidence || '',
        value_type: result.value_type === 'verified_sold' ? 'verified_sold' : 'manual',
        comparables_count: result.comparables_count || 0,
        average_price: result.average_price || 0,
        most_recent_sale_date: result.most_recent_sale_date || '',
        comparable_date_range: result.comparable_date_range || '',
        matching_criteria: result.matching_criteria || '',
        includes_shipping: result.includes_shipping || false,
        valuation_notes: result.valuation_notes || '',
      }));
      setAiResult(result);
      setAiIdentified(true);
      setStep(3);
    } catch (err) {
      console.error('Auto-identify failed', err);
      alert('Could not identify collectible. Please fill in details manually.');
    } finally {
      setIdentifying(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!data.category_id;
    if (step === 2) return Object.values(data.photos || {}).some(Boolean);
    if (step === 3) return !!data.item_name && data.estimated_value !== '';
    return false;
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const collectible = await base44.entities.Collectible.create({
        item_name: data.item_name,
        category_id: data.category_id,
        category_name: data.category_name,
        character_athlete_name: data.character_athlete_name || undefined,
        brand: data.brand || undefined,
        product_line: data.product_line || undefined,
        set_name: data.set_name || undefined,
        set_number: data.set_number || undefined,
        card_number: data.card_number || undefined,
        year: data.year ? parseInt(data.year) : undefined,
        team: data.team || undefined,
        variant: data.variant || undefined,
        edition: data.edition || undefined,
        parallel: data.parallel || undefined,
        serial_number: data.serial_number || undefined,
        has_autograph: data.has_autograph,
        grading_company: data.grading_company || undefined,
        grade: data.grade || undefined,
        box_condition: data.box_condition || undefined,
        item_condition: data.item_condition || undefined,
        authentication_company: data.authentication_company || undefined,
        estimated_value: parseFloat(data.estimated_value) || 0,
        low_value: parseFloat(data.low_value) || 0,
        high_value: parseFloat(data.high_value) || 0,
        value_source: (aiResult && aiResult.pricing_source) || (aiIdentified ? 'AI Estimate' : 'Manual'),
        value_confidence: data.value_confidence || undefined,
        value_type: data.value_type || 'manual',
        comparables_count: data.comparables_count || 0,
        average_price: data.average_price || 0,
        most_recent_sale_date: data.most_recent_sale_date || undefined,
        comparable_date_range: data.comparable_date_range || undefined,
        matching_criteria: data.matching_criteria || undefined,
        includes_shipping: data.includes_shipping || false,
        valuation_notes: data.valuation_notes || undefined,
        value_locked: false,
        for_sale: data.for_sale,
        asking_price: parseFloat(data.asking_price) || 0,
        purchase_cost: parseFloat(data.purchase_cost) || 0,
        privacy_status: data.privacy_status,
        primary_photo_url: Object.values(data.photos || {}).find(Boolean) || '',
        language: data.language || undefined,
        franchise: data.franchise || undefined,
        box_number: data.box_number || undefined,
        series: data.series || undefined,
        is_exclusive: data.is_exclusive || false,
        has_sticker: data.has_sticker || false,
        is_chase: data.is_chase || false,
        is_boxed: data.is_boxed || false,
        country: data.country || undefined,
        denomination: data.denomination || undefined,
        mint_mark: data.mint_mark || undefined,
        composition: data.composition || undefined,
        sport: data.sport || undefined,
        is_rookie: data.is_rookie || false,
        has_patch: data.has_patch || false,
        item_type: data.item_type || undefined,
        is_game_used: data.is_game_used || false,
        notes: data.notes || undefined,
      });

      const promises = [];
      Object.entries(data.photos || {}).forEach(([type, url]) => {
        if (url) {
          promises.push(
            base44.entities.CollectiblePhoto.create({
              collectible_id: collectible.id,
              photo_type: type,
              photo_url: url,
            })
          );
        }
      });
      promises.push(
        base44.entities.PricingHistory.create({
          collectible_id: collectible.id,
          collectible_name: data.item_name,
          estimated_value: parseFloat(data.estimated_value) || 0,
          low_value: parseFloat(data.low_value) || 0,
          high_value: parseFloat(data.high_value) || 0,
          pricing_source: (aiResult && aiResult.pricing_source) || (aiIdentified ? 'AI Estimate' : 'Manual'),
          value_type: data.value_type || 'manual',
          confidence: data.value_confidence || 'low',
          comparables_count: data.comparables_count || 0,
          average_price: data.average_price || 0,
          most_recent_sale_date: data.most_recent_sale_date || undefined,
          comparable_date_range: data.comparable_date_range || undefined,
          matching_criteria: data.matching_criteria || undefined,
          includes_shipping: data.includes_shipping || false,
          valuation_notes: data.valuation_notes || undefined,
        })
      );

      await Promise.all(promises);
      await checkAndAwardBadges(user);
      setShowAnimation(true);
      setTimeout(() => navigate('/'), 1400);
    } catch (err) {
      console.error('Failed to save collectible', err);
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-4">
      <SaveAnimation show={showAnimation} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
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
            <h2 className="font-display text-xl font-bold mb-1">Select a Category</h2>
            <p className="text-sm text-muted-foreground">What type of collectible is this?</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat)}
                className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                  data.category_id === cat.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
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

      {/* Step 2: Photos */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold mb-1">Add Photos</h2>
            <p className="text-sm text-muted-foreground">
              Capture or upload photos of your collectible. Required angles are marked with *.
            </p>
          </div>
          <PhotoUploader
            photoTypes={getPhotoTypes(data.category_name)}
            photos={data.photos}
            onChange={(p) => setData((d) => ({ ...d, photos: p }))}
          />
          {Object.values(data.photos || {}).some(Boolean) && (
            <button
              onClick={handleAutoIdentify}
              disabled={identifying}
              className="w-full h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {identifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Identifying & pricing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Auto-Identify & Price
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setStep(3)}
            disabled={!canProceed()}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="font-display text-xl font-bold mb-1">Item Details</h2>
            <p className="text-sm text-muted-foreground">
              Enter the details and estimated value for your collectible.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium">
            <Tag className="w-3 h-3" /> {data.category_name}
          </div>
          {aiResult && <AIConfidenceBanner result={aiResult} />}
          <CollectibleFormFields data={data} update={update} />
          <button
            onClick={handleConfirm}
            disabled={saving || !canProceed()}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40 sticky bottom-24 shadow-lg shadow-primary/20"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" /> Save to Collection
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}