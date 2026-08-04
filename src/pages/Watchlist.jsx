import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  ArrowLeft,
  Plus,
  Loader2,
  Eye,
  Check,
  Trash2,
  X,
  Target,
} from 'lucide-react';
import { formatCurrency, formatRelativeDate } from '@/lib/format';

export default function Watchlist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    item_name: '',
    category_id: '',
    target_price: '',
    notes: '',
    priority: 'medium',
    visibility: 'private',
    raw_or_graded: 'any',
    alerts_enabled: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wl, cats] = await Promise.all([
        base44.entities.Watchlist.filter(
          { user_id: user.id, status: 'active' },
          '-created_date',
          100
        ),
        base44.entities.CollectibleCategory.list('sort_order', 50),
      ]);
      setItems(wl);
      setCategories(cats.filter((c) => c.active));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.item_name) return;
    setSaving(true);
    try {
      const cat = categories.find((c) => c.id === form.category_id);
      await base44.entities.Watchlist.create({
        user_id: user.id,
        item_name: form.item_name,
        category_id: form.category_id || undefined,
        category_name: cat?.name || undefined,
        target_price: parseFloat(form.target_price) || 0,
        notes: form.notes || undefined,
        priority: form.priority || 'medium',
        visibility: form.visibility || 'private',
        raw_or_graded: form.raw_or_graded || 'any',
        alerts_enabled: form.alerts_enabled ?? true,
        status: 'active',
      });
      setForm({ item_name: '', category_id: '', target_price: '', notes: '', priority: 'medium', visibility: 'private', raw_or_graded: 'any', alerts_enabled: true });
      setShowAdd(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAcquire = async (item) => {
    await base44.entities.Watchlist.update(item.id, { status: 'acquired' });
    loadData();
  };

  const handleDelete = async (item) => {
    await base44.entities.Watchlist.delete(item.id);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold">Watchlist</h1>
            <p className="text-xs text-muted-foreground">
              {items.length} item{items.length !== 1 ? 's' : ''} you're watching
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
        >
          {showAdd ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {showAdd && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Item Name <span className="text-primary">*</span>
            </label>
            <input
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              placeholder="e.g. 1999 Charizard 1st Edition"
              className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Any</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Target Price</label>
              <input
                type="number"
                step="0.01"
                value={form.target_price}
                onChange={(e) => setForm({ ...form, target_price: e.target.value })}
                placeholder="0.00"
                className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any details about what you're looking for..."
              className="w-full h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Raw / Graded</label>
              <select
                value={form.raw_or_graded}
                onChange={(e) => setForm({ ...form, raw_or_graded: e.target.value })}
                className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="any">Any</option>
                <option value="raw">Raw</option>
                <option value="graded">Graded</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Visibility</label>
            <select
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              className="w-full h-11 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="private">Private</option>
              <option value="friends">Friends</option>
              <option value="public">Public</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !form.item_name}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add to Watchlist
              </>
            )}
          </button>
        </div>
      )}

      {items.length === 0 && !showAdd ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Eye className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Your Watchlist is Empty</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Track collectibles you want to buy. Set a target price so you know when to pull the trigger.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 font-medium"
          >
            <Plus className="w-5 h-5" /> Add First Item
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-card border border-border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{item.item_name}</p>
                  {item.category_name && (
                    <p className="text-xs text-muted-foreground">{item.category_name}</p>
                  )}
                  {item.target_price > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs text-muted-foreground">Target:</span>
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(item.target_price)}
                      </span>
                    </div>
                  )}
                  {(item.priority && item.priority !== 'medium') || (item.raw_or_graded && item.raw_or_graded !== 'any') ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.priority && item.priority !== 'medium' && (
                        <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          item.priority === 'high' ? 'bg-loss/10 text-loss' : 'bg-muted text-muted-foreground'
                        }`}>
                          {item.priority} priority
                        </span>
                      )}
                      {item.raw_or_graded && item.raw_or_graded !== 'any' && (
                        <span className="inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                          {item.raw_or_graded}
                        </span>
                      )}
                    </div>
                  ) : null}
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-2">{item.notes}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Added {formatRelativeDate(item.created_date)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAcquire(item)}
                    className="w-9 h-9 rounded-lg bg-gain/10 text-gain flex items-center justify-center hover:bg-gain/20"
                    title="Mark as acquired"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}