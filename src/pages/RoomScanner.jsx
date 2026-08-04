import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Upload, Loader2, Sparkles, ScanLine, Check, Plus, AlertCircle } from 'lucide-react';

export default function RoomScanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [collectibles, setCollectibles] = useState([]);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(result.file_url);
      setResults(null);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleScan = async () => {
    if (!photoUrl) return;
    setScanning(true);
    try {
      // Load user's collectibles for cross-referencing
      const items = await base44.entities.Collectible.filter({ created_by_id: user.id }, '-created_date', 500);
      setCollectibles(items.filter((c) => !c.is_deleted));

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this photo of a shelf, display case, or room containing collectibles. 

Identify ALL collectibles visible in the image. For each item detected, provide:
- name: The name/title of the collectible
- category: Best category match (pokemon, magic, lorcana, sports, funko, coins, memorabilia, other)
- franchise: The franchise (e.g., Pokemon, Marvel, Star Wars)
- position: Approximate location (top-left, top-center, top-right, middle-left, etc.)
- confidence: How confident you are (high, medium, low)
- estimated_value: Estimated value if you can determine it, otherwise 0
- description: Brief description of what you see

Also note how many total items you can detect.

Be thorough — look for cards, figures, coins, memorabilia, and any other collectibles.`,
        file_urls: [photoUrl],
        model: 'gemini_3_flash',
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            total_detected: { type: 'number' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  category: { type: 'string' },
                  franchise: { type: 'string' },
                  position: { type: 'string' },
                  confidence: { type: 'string' },
                  estimated_value: { type: 'number' },
                  description: { type: 'string' },
                },
              },
            },
            scene_description: { type: 'string' },
          },
        },
      });
      setResults(response);
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const isInCollection = (item) => {
    return collectibles.some(
      (c) =>
        c.item_name?.toLowerCase().includes(item.name?.toLowerCase()) ||
        item.name?.toLowerCase().includes(c.item_name?.toLowerCase())
    );
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold">Room Scanner</h1>
            <span className="text-[9px] font-bold bg-gold/20 text-gold rounded-full px-1.5 py-0.5">BETA</span>
          </div>
          <p className="text-xs text-muted-foreground">Detect multiple collectibles on shelves</p>
        </div>
      </div>

      <div className="rounded-2xl bg-gold/5 border border-gold/20 p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">
          Beta feature — results may not be accurate. This does not replace single-item or binder scanning.
        </p>
      </div>

      {/* Photo capture */}
      {!photoUrl ? (
        <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-3">
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="flex gap-3">
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
                >
                  <Camera className="w-6 h-6 text-primary-foreground" />
                </button>
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center"
                >
                  <Upload className="w-6 h-6" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Take a photo of your shelf or display</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="relative rounded-2xl overflow-hidden">
            <Image src={photoUrl} fittingType="fill" className="w-full aspect-[4/3]" alt="Shelf scan" />
            <button
              onClick={() => { setPhotoUrl(null); setResults(null); }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
            >
              <span className="text-sm">✕</span>
            </button>
          </div>

          {!results && (
            <Button onClick={handleScan} disabled={scanning} className="w-full h-12">
              {scanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Scanning shelf...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Detect Collectibles
                </>
              )}
            </Button>
          )}
        </>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {/* Results */}
      {results && (
        <div className="space-y-3">
          {results.scene_description && (
            <div className="rounded-xl bg-card border border-border p-3">
              <p className="text-xs text-muted-foreground">{results.scene_description}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold flex items-center gap-1">
              <ScanLine className="w-4 h-4 text-primary" />
              {results.total_detected || (results.items || []).length} items detected
            </h2>
          </div>

          {(results.items || []).map((item, idx) => {
            const inCollection = isInCollection(item);
            const confidencePct = item.confidence === 'high' ? 90 : item.confidence === 'medium' ? 60 : 30;
            return (
              <div key={idx} className="rounded-xl bg-card border border-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.franchise && <p className="text-[10px] text-muted-foreground">{item.franchise}</p>}
                    {item.description && <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>}
                  </div>
                  <span className={`text-[10px] font-bold flex-shrink-0 ${
                    confidencePct >= 60 ? 'text-gain' : confidencePct >= 40 ? 'text-gold' : 'text-loss'
                  }`}>
                    {confidencePct}%
                  </span>
                </div>
                {item.position && (
                  <p className="text-[10px] text-muted-foreground">📍 {item.position}</p>
                )}
                <div className="flex items-center justify-between">
                  {item.estimated_value > 0 && (
                    <span className="text-xs font-bold text-primary">
                      ~{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.estimated_value)}
                    </span>
                  )}
                  {inCollection ? (
                    <span className="text-[10px] font-medium text-gain flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> In your collection
                    </span>
                  ) : (
                    <Button
                      onClick={() => navigate('/add', { state: { prefill: { item_name: item.name, franchise: item.franchise } } })}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}