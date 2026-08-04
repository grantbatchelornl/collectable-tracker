import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Camera, Upload, X, Loader2, ChevronDown, ChevronUp, ZoomIn } from 'lucide-react';
import { useRef } from 'react';

const CONDITION_TYPES = [
  { key: 'corners', label: 'Corners' },
  { key: 'edges', label: 'Edges' },
  { key: 'surface', label: 'Surface' },
  { key: 'centering', label: 'Centering' },
  { key: 'scratches', label: 'Scratches' },
  { key: 'damage', label: 'Damage' },
  { key: 'certificate', label: 'Certificate' },
  { key: 'autograph', label: 'Autograph' },
];

export default function ConditionPhotoSection({ collectibleId, photos = [], onPhotoAdded }) {
  const [expanded, setExpanded] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);
  const [zoomPhoto, setZoomPhoto] = useState(null);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const currentType = useRef(null);

  const existingTypes = new Set(photos.filter((p) => p.photo_type).map((p) => p.photo_type));

  const handleFile = async (file, photoType) => {
    if (!file) return;
    setUploadingType(photoType);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      if (collectibleId) {
        const photo = await base44.entities.CollectiblePhoto.create({
          collectible_id: collectibleId,
          photo_type: photoType,
          photo_url: result.file_url,
        });
        onPhotoAdded?.([...photos, photo]);
      } else {
        onPhotoAdded?.([...photos, { photo_type: photoType, photo_url: result.file_url }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingType(null);
    }
  };

  const openUploader = (type) => {
    currentType.current = type;
    cameraRef.current?.click();
  };

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3"
      >
        <div className="text-left">
          <p className="text-sm font-medium">Condition Photos</p>
          <p className="text-[10px] text-muted-foreground">
            {existingTypes.size > 0 ? `${existingTypes.size} condition photo${existingTypes.size !== 1 ? 's' : ''} added` : 'Optional close-up photos for grading'}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="border-t border-border p-3 space-y-3">
          {/* Existing condition photos */}
          {photos.filter((p) => CONDITION_TYPES.some((ct) => ct.key === p.photo_type)).length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photos
                .filter((p) => CONDITION_TYPES.some((ct) => ct.key === p.photo_type))
                .map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setZoomPhoto(photo)}
                    className="relative aspect-square rounded-lg overflow-hidden border border-border"
                  >
                    <Image src={photo.photo_url} fittingType="fill" className="w-full h-full" alt={photo.photo_type} />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                      <p className="text-[8px] text-white capitalize text-center">{photo.photo_type}</p>
                    </div>
                    <ZoomIn className="absolute top-1 right-1 w-3 h-3 text-white/80" />
                  </button>
                ))}
            </div>
          )}

          {/* Add condition photos */}
          <div className="grid grid-cols-4 gap-2">
            {CONDITION_TYPES.map((type) => {
              const has = existingTypes.has(type.key);
              return (
                <button
                  key={type.key}
                  onClick={() => !has && openUploader(type.key)}
                  disabled={has || uploadingType === type.key}
                  className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                    has ? 'border-gain/30 bg-gain/5 cursor-default' : 'border-border hover:border-primary/50'
                  }`}
                >
                  {uploadingType === type.key ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : has ? (
                    <span className="text-[8px] text-gain font-medium">✓ {type.label}</span>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[8px] text-muted-foreground">{type.label}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground">
            These photos are used by the Grade Worthiness AI for more accurate grading assessments.
          </p>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0], currentType.current)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0], currentType.current)}
      />

      {/* Zoom modal */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomPhoto(null)}
        >
          <div className="relative max-w-md w-full">
            <Image src={zoomPhoto.photo_url} fittingType="fit" className="w-full max-h-[70vh] rounded-xl" alt={zoomPhoto.photo_type} />
            <p className="text-center text-sm text-white mt-2 capitalize">{zoomPhoto.photo_type}</p>
            <button
              onClick={() => setZoomPhoto(null)}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}