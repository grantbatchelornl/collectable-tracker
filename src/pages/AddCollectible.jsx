import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import PhotoUploader from '@/components/PhotoUploader';
import CollectibleFormFields from '@/components/CollectibleFormFields';
import AIConfidenceBanner from '@/components/AIConfidenceBanner';
import FraudWarningBanner from '@/components/FraudWarningBanner';
import AcquisitionFields from '@/components/AcquisitionFields';
import MemoryFields from '@/components/MemoryFields';
import SaveAnimation from '@/components/SaveAnimation';
import { identifyAndPrice } from '@/lib/collectibleAI';
import { getPhotoTypes } from '@/lib/categoryFields';
import { checkAndAwardBadges } from '@/lib/achievements';
import { awardXP, XP_REWARDS } from '@/lib/xpSystem';
import { ArrowLeft, ArrowRight, Check, Loader2, Tag, Sparkles, AlertTriangle } from 'lucide-react';

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
  acquisition_source: 'purchase',
  seller_name: '',
  purchase_date: '',
  memory: '',
  why_special: '',
  memory_date: '',
  memory_shared: false,
};

export default function AddCollectible() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [aiIdentified, setAiIdentified] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [data, setData] = useState(EMPTY);
  const [verified, setVerified] = useState(false);
  const [fraudAcknowledged, setFraudAcknowledged] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [categoryTransition, setCategoryTransition] = useState(null);

  useEffect(() => {
    base44.entities.CollectibleCategory.list('sort_order', 50)
      .then((cats) => setCategories(cats.filter((c) => c.active)))
      .catch((err) => console.error('Failed to load categories', err));

    // Handle prefill from review queue
    if (location.state?.prefill) {
      const prefill = location.state.prefill;
      setData((d) => ({ ...d, ...prefill }));
      if (prefill.item_name) {
        setAiIdentified(true);
        setStep(3);
      }
    }
  }, []);

  const update = (field, value) => setData((d) => ({ ...d, [field]: value }));

  const selectCategory = (cat) => {
    update('category_id', cat.id);
    update('category_name', cat.name);

    setCategoryTransition({
      name: cat.name,
      slug: cat.slug,
    });

    window.setTimeout(() => {
      setStep(2);
      setCategoryTransition(null);
    }, 850);
  };

  const handleAutoIdentify = async () => {
    const photoUrls = Object.values(data.photos || {}).filter(Boolean);
    if (photoUrls.length === 0) return;
    setIdentifying(true);
    setVerified(false);
    try {
      const result = await identifyAndPrice(photoUrls, data.category_name);

      // Low confidence → send to AI Review Queue instead of auto-saving
      if (result.identification_confidence === 'low' || result.confidence === 'low') {
        await base44.entities.AIReviewQueue.create({
          user_id: user.id,
          photo_urls_json: JSON.stringify(data.photos || {}),
          ai_suggestions_json: JSON.stringify([{ ...result, confidence: result.confidence || 'low' }]),
          low_confidence_reason: result.identification_notes || 'Low confidence — multiple possible matches detected.',
          category_id: data.category_id,
          category_name: data.category_name,
          form_data_json: JSON.stringify(data),
          status: 'pending',
        });
        navigate('/review-queue');
        return;
      }

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
    setSaveError('');
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
        acquisition_source: data.acquisition_source || 'purchase',
        seller_name: data.seller_name || undefined,
        purchase_date: data.purchase_date || undefined,
        memory: data.memory || undefined,
        why_special: data.why_special || undefined,
        memory_date: data.memory_date || undefined,
        memory_shared: data.memory_shared || false,
      });

      // Mark review queue item as confirmed if applicable
      if (location.state?.reviewQueueItem) {
        await base44.entities.AIReviewQueue.update(location.state.reviewQueueItem, {
          status: 'confirmed',
          selected_match_json: JSON.stringify(data),
        });
      }

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
      await awardXP(user, XP_REWARDS.ADD_COLLECTIBLE, 'Added collectible');
      setShowAnimation(true);
      setTimeout(() => navigate('/'), 1400);
    } catch (err) {
      console.error('Failed to save collectible', err);
      setSaving(false);
      setSaveError('Could not save collectible. Please check your connection and try again.');
    }
  };

  if (categoryTransition) {
    return (
      <div className="fixed inset-0 z-50 bg-[#08080a] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(216,181,112,0.18),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(216,181,112,0.07),transparent_25%)]" />

        <div className="relative min-h-full flex flex-col items-center justify-center px-8 text-center">
          <p className="text-[10px] tracking-[0.38em] uppercase text-[#d8b570] mb-3">
            COLLECTABLE
          </p>

          <h1 className="font-display text-3xl font-bold">
            Preparing Your Vault
          </h1>

          <p className="text-sm text-white/50 mt-2">
            Setting up your {categoryTransition.name} workspace
          </p>

          <div className="relative mt-10 w-40 h-40 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#d8b570]/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#d8b570] animate-spin" />

            <div className="w-28 h-28 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl">
              <Sparkles className="w-7 h-7 text-[#e3c486]" />
            </div>
          </div>

          <div className="mt-10 w-full max-w-xs rounded-2xl border border-[#d8b570]/20 bg-[#d8b570]/[0.035] backdrop-blur-xl p-4">
            <div className="flex justify-between text-[10px] uppercase tracking-[0.14em]">
              <span className="text-white/45">
                Preparing collector tools
              </span>
              <span className="text-[#d8b570]">
                Loading
              </span>
            </div>

            <div className="mt-3 h-1 rounded-full bg-[#d8b570]/10 overflow-hidden">
              <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-[#8d6c35] via-[#d8b570] to-[#f3dda8] animate-pulse" />
            </div>
          </div>

          <p className="absolute bottom-10 text-[10px] tracking-[0.2em] uppercase text-white/25">
            Your collection. Elevated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#070709] text-[#f5f1e8] overflow-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_12%,rgba(216,181,112,0.13),transparent_28%),radial-gradient(circle_at_82%_28%,rgba(171,142,214,0.035),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(216,181,112,0.06),transparent_35%)]" />
      <div className="fixed -top-24 -left-28 w-80 h-80 rounded-full bg-[#d8b570]/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 -right-28 w-96 h-96 rounded-full bg-[#b99ad9]/[0.025] blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 pt-5 pb-10">
        <SaveAnimation show={showAnimation} />

      {/* Premium Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
          className="w-10 h-10 rounded-full border border-[#d8b570]/20 bg-[#d8b570]/[0.035] backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-[#e3c486] hover:border-[#d8b570]/30 transition-all"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center">
          <p className="text-[9px] tracking-[0.32em] uppercase text-[#b99a61]">
            COLLECTABLE
          </p>

          <div className="flex items-center gap-1.5 mt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-9 bg-gradient-to-r from-[#a67d3d] to-[#e3c486] shadow-[0_0_10px_rgba(216,181,112,0.25)]'
                    : s < step
                      ? 'w-4 bg-[#d8b570]/45'
                      : 'w-4 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="w-10 h-10 flex items-center justify-center">
          <span className="text-[9px] tracking-[0.12em] text-white/25">
            {step}/3
          </span>
        </div>
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] tracking-[0.28em] uppercase text-[#b99a61] mb-2">
              Add to your vault
            </p>
            <h2 className="font-display text-2xl font-bold mb-1">
              What are you collecting?
            </h2>
            <p className="text-sm text-[#b8ad98]">
              Choose a category to open your collector workspace.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat)}
                className={`group p-2 rounded-[22px] border text-left transition-all active:scale-[0.98] overflow-hidden backdrop-blur-xl ${
                  data.category_id === cat.id
                    ? 'border-[#e4c27a]/80 bg-[#d8b570]/10 shadow-[0_0_28px_rgba(216,181,112,0.12)]'
                    : 'border-[#d8b570]/35 bg-[#11100e]/90 hover:border-[#e4c27a]/65 hover:shadow-[0_0_24px_rgba(216,181,112,0.10)]'
                }`}
              >
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#0d0c0a] mb-2 ring-1 ring-inset ring-[#f0d594]/20">
                  <img
                    src={{
                      'pokemon': '/categories/pokemon.png',
                      'magic': '/categories/magic.png',
                      'lorcana': '/categories/lorcana.png',
                      'sports-cards': '/categories/scards.png',
                      'funko': '/categories/pop.png',
                      'coins': '/categories/coins.png',
                      'sports-memorabilia': '/categories/sports.png',
                    }[cat.slug] || '/collectable-icon.png'}
                    alt={cat.name}
                    className="w-full h-full object-cover brightness-[0.72] saturate-[0.72] contrast-[1.08] transition-all duration-500 group-hover:scale-105 group-hover:brightness-[0.82]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080704]/90 via-[#171006]/10 to-[#d8b570]/10" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-[#e4c27a]/20 rounded-2xl" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="font-semibold text-sm text-[#f5ead0] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                      {cat.name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Photos */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#17171c] via-[#111114] to-[#0c0c0f] p-5 overflow-hidden relative">
            <div className="absolute -top-16 -right-12 w-40 h-40 rounded-full bg-[#d8b570]/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-12 w-40 h-40 rounded-full bg-[#d8b570]/[0.06] blur-3xl" />

            <div className="relative">
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#d8b570]">
                {data.category_name}
              </p>

              <h2 className="font-display text-2xl font-bold mt-2">
                Show us your collectible
              </h2>

              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Clear front and back photos help Collector AI identify,
                value, and evaluate your item.
              </p>

              <div className="flex items-center gap-2 mt-4">
                <div className="h-px flex-1 bg-gradient-to-r from-[#d8b570]/50 to-transparent" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#a99f8d]">
                  Scan • Identify • Value
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#d8b570]/20 bg-[#12110e]/80 backdrop-blur-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-sm">Item Photos</p>
                <p className="text-[11px] text-muted-foreground">
                  Camera or photo library
                </p>
              </div>

              <div className="rounded-full border border-[#d8b570]/25 bg-[#d8b570]/10 px-2.5 py-1">
                <span className="text-[10px] font-medium text-[#d8b570]">
                  AI READY
                </span>
              </div>
            </div>

            <PhotoUploader
              photoTypes={getPhotoTypes(data.category_name)}
              photos={data.photos}
              onChange={(p) => setData((d) => ({ ...d, photos: p }))}
            />
          </div>

          {Object.values(data.photos || {}).some(Boolean) && (
            <button
              onClick={handleAutoIdentify}
              disabled={identifying}
              className="relative w-full min-h-[64px] rounded-2xl overflow-hidden border border-[#d8b570]/30 bg-gradient-to-r from-[#1a1610] via-[#221b10] to-[#12100c] text-white font-medium disabled:opacity-50 shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(216,181,112,0.16),transparent_30%),radial-gradient(circle_at_85%_50%,rgba(216,181,112,0.07),transparent_28%)]" />

              <div className="relative flex items-center justify-center gap-3 px-4 py-3">
                {identifying ? (
                  <>
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 rounded-full border border-[#d8b570]/20" />
                      <div className="absolute inset-0 rounded-full border-t-2 border-[#d8b570] animate-spin" />
                      <Sparkles className="absolute inset-0 m-auto w-3.5 h-3.5 text-[#e3c486]" />
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-semibold">
                        Collector AI is analyzing
                      </p>
                      <p className="text-[10px] text-white/45">
                        Identifying item and estimating value…
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-[#d8b570]/10 border border-[#d8b570]/25 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#e3c486]" />
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-semibold">
                        Identify with Collector AI
                      </p>
                      <p className="text-[10px] text-white/45">
                        Recognition, details & estimated value
                      </p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#d8b570] ml-auto" />
                  </>
                )}
              </div>
            </button>
          )}

          <button
            onClick={() => setStep(3)}
            disabled={!canProceed()}
            className="w-full h-12 rounded-2xl border border-[#d8b570]/20 bg-[#12110e]/80 font-medium flex items-center justify-center gap-2 disabled:opacity-30"
          >
            Enter Details Manually
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-[10px] text-center text-muted-foreground px-5">
            Collector AI provides estimates only. You review and approve all
            details before anything is added to your collection.
          </p>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <div className="space-y-5 pb-28">
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#17171c] via-[#111114] to-[#0b0b0e] p-5 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#d8b570]/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-12 w-44 h-44 rounded-full bg-[#d8b570]/[0.06] blur-3xl" />

            <div className="relative">
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#d8b570]">
                Final Review
              </p>

              <h2 className="font-display text-2xl font-bold mt-2">
                Complete your collectible
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                Review Collector AI's findings and add anything that makes
                this item uniquely yours.
              </p>

              <div className="flex items-center gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8b570]/20 bg-[#d8b570]/10 px-3 py-1 text-[10px] font-medium text-[#d8b570]">
                  <Tag className="w-3 h-3" />
                  {data.category_name}
                </span>

                {aiIdentified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8b570]/25 bg-[#d8b570]/10 px-3 py-1 text-[10px] font-medium text-[#e3c486]">
                    <Sparkles className="w-3 h-3" />
                    AI Identified
                  </span>
                )}
              </div>
            </div>
          </div>

          {aiIdentified && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#d8b570]/20 bg-[#12110e]/80 backdrop-blur-xl p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Identified As
                </p>
                <p className="text-sm font-semibold mt-1 line-clamp-2">
                  {data.item_name || 'Review item details'}
                </p>
              </div>

              <div className="rounded-2xl border border-[#d8b570]/20 bg-[#d8b570]/[0.06] p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#b99a61]">
                  Est. Value
                </p>
                <p className="text-lg font-semibold text-[#e3c486] mt-1">
                  {data.estimated_value !== ''
                    ? `$${Number(data.estimated_value || 0).toLocaleString()}`
                    : 'Review'}
                </p>
              </div>
            </div>
          )}

          {aiResult && <AIConfidenceBanner result={aiResult} />}

          {aiResult && aiResult.fraud_warning && (
            <FraudWarningBanner
              result={aiResult}
              acknowledged={fraudAcknowledged}
              onAcknowledge={setFraudAcknowledged}
            />
          )}

          {aiResult &&
            (aiResult.identification_confidence === 'low' ||
              aiResult.identification_confidence === 'medium') && (
              <div className="rounded-2xl bg-gold/5 border border-gold/20 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />

                  <div>
                    <p className="text-xs font-medium text-gold">
                      Verification Required
                    </p>

                    <p className="text-[11px] text-muted-foreground">
                      Collector AI confidence is{' '}
                      {aiResult.identification_confidence}. Please verify the
                      information before saving.
                      {aiResult.identification_notes &&
                        ` ${aiResult.identification_notes}`}
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                    className="w-4 h-4 rounded border-border"
                  />

                  <span className="text-xs font-medium">
                    I've verified these details are correct
                  </span>
                </label>
              </div>
            )}

          {saveError && (
            <div className="rounded-2xl bg-loss/5 border border-loss/30 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-loss flex-shrink-0 mt-0.5" />
              <p className="text-xs text-loss">{saveError}</p>
            </div>
          )}

          <div className="rounded-[24px] border border-[#d8b570]/20 bg-[#12110e]/80 backdrop-blur-xl p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold">Collectible Details</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Identification, condition, grading and value
              </p>
            </div>

            <CollectibleFormFields data={data} update={update} />
          </div>

          <div className="rounded-[24px] border border-[#d8b570]/20 bg-[#12110e]/80 backdrop-blur-xl p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold">Acquisition</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Where this collectible came from
              </p>
            </div>

            <AcquisitionFields data={data} update={update} />
          </div>

          <div className="rounded-[24px] border border-[#d8b570]/20 bg-[#12110e]/80 backdrop-blur-xl p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold">Collector Story</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Optional memories and why this item matters
              </p>
            </div>

            <MemoryFields data={data} update={update} />
          </div>

          <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pointer-events-none">
            <div className="max-w-lg mx-auto rounded-[22px] border border-[#d8b570]/25 bg-[#0b0a08]/95 backdrop-blur-xl p-2 shadow-2xl pointer-events-auto">
              <button
                onClick={handleConfirm}
                disabled={
                  saving ||
                  !canProceed() ||
                  (aiResult &&
                    (aiResult.identification_confidence === 'low' ||
                      aiResult.identification_confidence === 'medium') &&
                    !verified) ||
                  (aiResult &&
                    aiResult.fraud_warning &&
                    !fraudAcknowledged)
                }
                className="relative w-full h-13 min-h-[52px] rounded-2xl overflow-hidden bg-gradient-to-r from-[#9a7539] via-[#d8b570] to-[#b88b43] text-[#17120a] font-semibold flex items-center justify-center gap-2 disabled:opacity-35"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Securing in your vault…
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Add to My Collection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}