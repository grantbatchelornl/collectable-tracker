import { ShieldAlert, AlertTriangle } from 'lucide-react';

const FRAUD_LABELS = {
  counterfeit: { label: 'Possible Counterfeit', color: 'loss' },
  fake_slab: { label: 'Fake Grading Slab', color: 'loss' },
  altered: { label: 'Altered / Tampered', color: 'gold' },
  reproduction: { label: 'Reproduction / Reprint', color: 'gold' },
  suspicious: { label: 'Suspicious Item', color: 'gold' },
};

export default function FraudWarningBanner({ result, acknowledged, onAcknowledge }) {
  if (!result || !result.fraud_warning) return null;

  const info = FRAUD_LABELS[result.fraud_type] || FRAUD_LABELS.suspicious;
  const isHigh = result.fraud_confidence === 'high';
  const Icon = isHigh ? ShieldAlert : AlertTriangle;

  return (
    <div className={`rounded-2xl border p-4 space-y-2 ${
      isHigh ? 'bg-loss/5 border-loss/30' : 'bg-gold/5 border-gold/30'
    }`}>
      <div className="flex items-start gap-2">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isHigh ? 'text-loss' : 'text-gold'}`} />
        <div className="flex-1">
          <p className={`text-sm font-bold ${isHigh ? 'text-loss' : 'text-gold'}`}>
            {isHigh ? '⚠️ ' : ''}{info.label} Detected
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {result.fraud_details || 'AI analysis detected potential signs of counterfeiting or tampering. Please have this item professionally authenticated before purchasing or trading.'}
          </p>
        </div>
        <span className={`text-[10px] font-bold uppercase flex-shrink-0 ${isHigh ? 'text-loss' : 'text-gold'}`}>
          {result.fraud_confidence}
        </span>
      </div>
      <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
        <input
          type="checkbox"
          id="fraud-ack"
          checked={acknowledged || false}
          onChange={(e) => onAcknowledge?.(e.target.checked)}
          className="w-4 h-4 rounded border-border"
        />
        <label htmlFor="fraud-ack" className="text-[11px] text-muted-foreground">
          I acknowledge this warning and take responsibility for saving this item anyway
        </label>
      </div>
    </div>
  );
}