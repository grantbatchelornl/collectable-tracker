import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

export default function DeleteAccountDialog({ open, onOpenChange, onDeleted }) {
  const { user } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE' || !user) return;
    setDeleting(true);
    try {
      await Promise.all([
        base44.entities.Collectible.deleteMany({ created_by_id: user.id }),
        base44.entities.CollectionBinder.deleteMany({ user_id: user.id }),
        base44.entities.Watchlist.deleteMany({ user_id: user.id }),
        base44.entities.PriceAlert.deleteMany({ user_id: user.id }),
      ]);
      await base44.entities.CollectorProfile.deleteMany({ user_id: user.id });
      onDeleted();
    } catch (err) {
      console.error('Account deletion failed', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenChange = (v) => {
    if (!deleting) {
      setConfirmText('');
      onOpenChange(v);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Account
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This will permanently delete all your collectibles, binders, watchlist, price alerts, and profile data. This action <span className="font-semibold text-foreground">cannot be undone</span>.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete">Type <span className="font-bold">DELETE</span> to confirm</Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || deleting}
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}