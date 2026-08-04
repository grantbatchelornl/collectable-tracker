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
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">
        {label} {required && <span className="text-primary">*</span>}
      </p>
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted/50">
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
            <div className="flex gap-2">
              <button
                onClick={() => cameraRef.current?.click()}
                className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
              >
                <Camera className="w-5 h-5 text-primary-foreground" />
              </button>
              <button
                onClick={() => galleryRef.current?.click()}
                className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Camera or upload</p>
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