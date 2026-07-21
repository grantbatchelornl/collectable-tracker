import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

function PhotoSlot({ label, photo, onPhotoChange }) {
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      onPhotoChange(result.file_url);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1">
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
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
                className="w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPhotoChange(null)}
                className="w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
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
            <p className="text-xs text-muted-foreground text-center">Camera or upload</p>
          </div>
        )}
      </div>
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

export default function PhotoUploader({ photos, onChange }) {
  return (
    <div className="flex gap-3">
      <PhotoSlot
        label="Front"
        photo={photos.front}
        onPhotoChange={(url) => onChange({ ...photos, front: url })}
      />
      <PhotoSlot
        label="Back"
        photo={photos.back}
        onPhotoChange={(url) => onChange({ ...photos, back: url })}
      />
    </div>
  );
}