import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import CollectibleFormFields from '@/components/CollectibleFormFields';
import PhotoUploader from '@/components/PhotoUploader';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

export default function EditCollectible() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [existingPhotos, setExistingPhotos] = useState({ front: null, back: null });
  const [photoChanged, setPhotoChanged] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const c = await base44.entities.Collectible.get(id);
      setData({
        item_name: c.item_name || '',
        character_athlete_name: c.character_athlete_name || '',
        brand: c.brand || '',
        product_line: c.product_line || '',
        set_name: c.set_name || '',
        set_number: c.set_number || '',
        card_number: c.card_number || '',
        year: c.year?.toString() || '',
        team: c.team || '',
        variant: c.variant || '',
        edition: c.edition || '',
        parallel: c.parallel || '',
        serial_number: c.serial_number || '',
        has_autograph: c.has_autograph || false,
        grading_company: c.grading_company || '',
        grade: c.grade || '',
        box_condition: c.box_condition || '',
        item_condition: c.item_condition || '',
        authentication_company: c.authentication_company || '',
        estimated_value: c.estimated_value?.toString() || '',
        low_value: c.low_value?.toString() || '',
        high_value: c.high_value?.toString() || '',
        privacy_status: c.privacy_status || 'private',
        for_sale: c.for_sale || false,
        asking_price: c.asking_price?.toString() || '',
        purchase_cost: c.purchase_cost?.toString() || '',
        category_name: c.category_name || '',
        language: c.language || '',
        franchise: c.franchise || '',
        box_number: c.box_number || '',
        series: c.series || '',
        is_exclusive: c.is_exclusive || false,
        has_sticker: c.has_sticker || false,
        is_chase: c.is_chase || false,
        is_boxed: c.is_boxed || false,
        country: c.country || '',
        denomination: c.denomination || '',
        mint_mark: c.mint_mark || '',
        composition: c.composition || '',
        sport: c.sport || '',
        is_rookie: c.is_rookie || false,
        has_patch: c.has_patch || false,
        item_type: c.item_type || '',
        is_game_used: c.is_game_used || false,
        notes: c.notes || '',
        originalValue: c.estimated_value,
      });
      const photos = await base44.entities.CollectiblePhoto.filter({ collectible_id: id });
      const front = photos.find((p) => p.photo_type === 'front');
      const back = photos.find((p) => p.photo_type === 'back');
      setExistingPhotos({ front: front?.photo_url || null, back: back?.photo_url || null });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setData((d) => ({ ...d, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const oldValue = parseFloat(data.estimated_value) || 0;
      const updated = await base44.entities.Collectible.update(id, {
        item_name: data.item_name,
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
        estimated_value: oldValue,
        low_value: parseFloat(data.low_value) || 0,
        high_value: parseFloat(data.high_value) || 0,
        privacy_status: data.privacy_status,
        for_sale: data.for_sale,
        asking_price: parseFloat(data.asking_price) || 0,
        purchase_cost: parseFloat(data.purchase_cost) || 0,
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

      // Create pricing history if value changed
      const newValue = parseFloat(data.estimated_value) || 0;
      if (data.originalValue != null && newValue !== data.originalValue) {
        await base44.entities.PricingHistory.create({
          collectible_id: id,
          collectible_name: data.item_name,
          estimated_value: newValue,
          low_value: parseFloat(data.low_value) || 0,
          high_value: parseFloat(data.high_value) || 0,
          pricing_source: 'Manual',
          value_type: 'manual',
          confidence: 'low',
        });
      }

      // Update photos if changed
      if (photoChanged) {
        await base44.entities.CollectiblePhoto.deleteMany({ collectible_id: id });
        if (existingPhotos.front) {
          await base44.entities.CollectiblePhoto.create({
            collectible_id: id,
            photo_type: 'front',
            photo_url: existingPhotos.front,
          });
        }
        if (existingPhotos.back) {
          await base44.entities.CollectiblePhoto.create({
            collectible_id: id,
            photo_type: 'back',
            photo_url: existingPhotos.back,
          });
        }
        await base44.entities.Collectible.update(id, {
          primary_photo_url: existingPhotos.front || existingPhotos.back || '',
        });
      }

      navigate(`/collectible/${id}`);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/collectible/${id}`)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display text-xl font-bold">Edit Collectible</h2>
      </div>

      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Photos</h3>
        <PhotoUploader
          photos={existingPhotos}
          onChange={(p) => {
            setExistingPhotos(p);
            setPhotoChanged(true);
          }}
        />
      </div>

      <CollectibleFormFields data={data} update={update} />

      <button
        onClick={handleSave}
        disabled={saving || !data.item_name || data.estimated_value === ''}
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40 sticky bottom-24 shadow-lg shadow-primary/20"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Check className="w-5 h-5" /> Save Changes
          </>
        )}
      </button>
    </div>
  );
}