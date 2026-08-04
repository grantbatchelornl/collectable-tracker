import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, BellRing, Trash2, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function PriceAlertManager({ collectible, user }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [targetValue, setTargetValue] = useState('');
  const [direction, setDirection] = useState('above');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !collectible) return;
    loadAlerts();
  }, [user, collectible]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.PriceAlert.filter({
        user_id: user.id,
        collectible_id: collectible.id,
      });
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const value = parseFloat(targetValue);
    if (!value || value <= 0) return;
    setSaving(true);
    try {
      await base44.entities.PriceAlert.create({
        user_id: user.id,
        collectible_id: collectible.id,
        collectible_name: collectible.item_name,
        target_value: value,
        direction,
        status: 'active',
      });
      setShowForm(false);
      setTargetValue('');
      setDirection('above');
      await loadAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await base44.entities.PriceAlert.delete(alertId);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-medium">Price Alerts</p>
        </div>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const triggeredAlerts = alerts.filter((a) => a.status === 'triggered');

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-primary" />
          <div>
            <p className="text-sm font-medium">Price Alerts</p>
            <p className="text-[10px] text-muted-foreground">
              Get notified when the value hits your target
            </p>
          </div>
        </div>
        {activeAlerts.length === 0 && !showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTargetValue((collectible.estimated_value || 0).toString());
              setShowForm(true);
            }}
            className="h-8 text-xs"
          >
            <Bell className="w-3.5 h-3.5" /> Set Alert
          </Button>
        )}
      </div>

      {/* Active Alerts */}
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-3"
        >
          <div className="flex items-center gap-2">
            {alert.direction === 'above' ? (
              <TrendingUp className="w-4 h-4 text-gain" />
            ) : (
              <TrendingDown className="w-4 h-4 text-loss" />
            )}
            <div>
              <p className="text-sm font-medium">
                {alert.direction === 'above' ? 'Rises to' : 'Drops to'}{' '}
                {formatCurrency(alert.target_value)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Current: {formatCurrency(collectible.estimated_value)}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDelete(alert.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Triggered Alerts */}
      {triggeredAlerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between rounded-xl bg-gain/5 border border-gain/20 p-3"
        >
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-gain" />
            <div>
              <p className="text-sm font-medium text-gain">
                Target reached: {formatCurrency(alert.triggered_value)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Was watching for {formatCurrency(alert.target_value)}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDelete(alert.id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* New Alert Form */}
      {showForm && (
        <div className="space-y-3 rounded-xl bg-accent/50 border border-border p-3">
          <div className="space-y-2">
            <Label>Notify me when the value...</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setDirection('above')}
                className={`flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${
                  direction === 'above'
                    ? 'bg-gain text-white'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> Rises to
              </button>
              <button
                onClick={() => setDirection('below')}
                className={`flex-1 h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${
                  direction === 'below'
                    ? 'bg-loss text-white'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                <TrendingDown className="w-4 h-4" /> Drops to
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Target Value ($)</Label>
            <Input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="0.00"
              className="h-11"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1 h-10"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="flex-1 h-10"
              disabled={saving || !parseFloat(targetValue)}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Bell className="w-4 h-4" /> Create Alert
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Set another alert */}
      {activeAlerts.length > 0 && !showForm && (
        <button
          onClick={() => {
            setTargetValue((collectible.estimated_value || 0).toString());
            setShowForm(true);
          }}
          className="w-full text-xs text-primary font-medium py-1"
        >
          + Add another alert
        </button>
      )}
    </div>
  );
}