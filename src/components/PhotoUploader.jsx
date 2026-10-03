import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { checkPhotoQuality } from '@/lib/photoQuality';

function PhotoSlot({ label, photo, required, onPhotoChange }) {
  const [uploading, setUploading] = useState(false);
  const [qualityIssues, setQualityIssues] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    if (!photo) {
      setQualityIssues([]);
      return;
    }
    let cancelled = false;
    checkPhotoQuality(photo).then((result) => {
      if (!cancelled) setQualityIssues(result.issues || []);
    });
    return () => {
      cancelled = true;
    };
  }, [photo]);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      onPhotoChange(result.file_url);
    } catch (err) {
      console.error('Upload failed', err);

      const message =
        err?.message ||
        err?.error_description ||
        err?.error ||
        'Unknown upload error';

      setUploadError(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[#e9dfca]">
          {label}
        </p>
        {required && (
          <span className="text-[9px] uppercase tracking-[0.14em] text-[#d8b570]">
            Required
          </span>
        )}
      </div>
      <div className="relative aspect-[3/4] rounded-[22px] overflow-hidden border border-[#d8b570]/25 bg-gradient-to-br from-[#18150f] via-[#100f0c] to-[#090806] shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20 backdrop-blur-sm">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border border-[#d8b570]/20" />
              <div className="absolute inset-0 rounded-full border-t-2 border-[#d8b570] animate-spin" />
              <Upload className="absolute inset-0 m-auto w-4 h-4 text-[#d8b570]" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
              Securing photo
            </p>
          </div>
        ) : photo ? (
          <>
            <Image src={photo} fittingType="fill" className="w-full h-full" alt={`${label} photo`} />
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => cameraRef.current?.click()}
                className="w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onPhotoChange(null)}
                className="w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {qualityIssues.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gold/90 backdrop-blur px-2 py-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-white flex-shrink-0" />
                <p className="text-[10px] text-white font-medium truncate">
                  {qualityIssues.map((i) => i.message).join(', ')}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(216,181,112,0.10),transparent_34%)]" />

            <div className="relative w-14 h-14 rounded-full border border-[#d8b570]/25 bg-[#d8b570]/[0.07] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(216,181,112,0.08)]">
              <Camera className="w-6 h-6 text-[#d8b570]" />
            </div>

            <p className="relative text-xs font-semibold text-white">
              Add {label}
            </p>

            <p className="relative text-[10px] text-white/35 text-center mt-1">
              Take a photo or choose one
            </p>

            <div className="relative grid grid-cols-2 gap-2 w-full mt-4">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="h-9 rounded-xl border border-[#d8b570]/20 bg-[#d8b570]/10 text-[#e3c486] text-[10px] font-medium flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                Camera
              </button>

              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="h-9 rounded-xl border border-[#d8b570]/15 bg-[#d8b570]/[0.04] text-[#d7cdb9] text-[10px] font-medium flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Library
              </button>
            </div>
          </div>
        )}
      </div>
      {uploadError && (
        <p className="text-[10px] text-loss mt-1">{uploadError}</p>
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
    </div>
  );
}

export default function PhotoUploader({ photoTypes, photos, onChange }) {
  const types = photoTypes || [
    { key: 'front', label: 'Front', required: true },
    { key: 'back', label: 'Back', required: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {types.map((type) => (
        <PhotoSlot
          key={type.key}
          label={type.label}
          required={type.required}
          photo={photos?.[type.key]}
          onPhotoChange={(url) => onChange({ ...photos, [type.key]: url })}
        />
      ))}
    </div>
  );
}