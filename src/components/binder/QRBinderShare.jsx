import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import { subscribeToMasterBinder } from '@/lib/binderChecklist';

export default function QRBinderShare({ binder }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const shareUrl = `${window.location.origin}/binder/${binder.id}`;
  const isPublic = binder.privacy_status === 'public';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(shareUrl)}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between rounded-xl bg-card border border-border p-3"
      >
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-primary" />
          <div className="text-left">
            <p className="text-sm font-medium">Share via QR</p>
            <p className="text-[10px] text-muted-foreground">Friend scans to open your binder</p>
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Binder</DialogTitle>
            <DialogDescription>
              {isPublic
                ? 'Anyone can scan this QR code to view your binder.'
                : 'Make this binder public to share it via QR code.'}
            </DialogDescription>
          </DialogHeader>

          {isPublic ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <img src={qrSrc} alt="QR Code" className="w-48 h-48 rounded-xl" />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-primary font-medium"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <p className="text-[10px] text-muted-foreground text-center max-w-xs">
                Friend scans this with their camera to instantly open your binder in the app.
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-3">
                This binder is {binder.privacy_status}. Set showcase to Public to enable QR sharing.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}