import { Sparkles, AlertTriangle, Info } from 'lucide-react';

export default function AIConfidenceBanner({ result }) {
  const idConf = result.identification_confidence;
  const priceConf = result.confidence;
  const comparables = result.comparables_count || 0;

  const confColor = (c) =>
    c === 'high' ? 'text-gain' : c === 'medium' ? 'text-gold' : 'text-loss';

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="font-semibold text-sm">AI Analysis</p>
      </div>

      {idConf && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Identification Confidence</span>
          <span className={`font-semibold capitalize ${confColor(idConf)}`}>{idConf}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Value Confidence</span>
        <span className={`font-semibold capitalize ${confColor(priceConf)}`}>{priceConf || 'Unknown'}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Sold Comparables Used</span>
        <span className="font-semibold">{comparables}</span>
      </div>

      {result.pricing_source && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Pricing Source</span>
          <span className="font-semibold text-right text-xs">{result.pricing_source}</span>
        </div>
      )}

      {result.valuation_notes && (
        <div className="flex items-start gap-2 pt-2 border-t border-border">
          <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">{result.valuation_notes}</p>
        </div>
      )}

      {idConf === 'low' && (
        <div className="flex items-start gap-2 pt-2 border-t border-border">
          <AlertTriangle className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Low identification confidence. Consider adding clearer photos or filling in details manually.
          </p>
        </div>
      )}

      {comparables < 2 && (
        <div className="flex items-start gap-2 pt-2 border-t border-border">
          <AlertTriangle className="w-3.5 h-3.5 text-loss flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Fewer than 2 sold comparables found. Value estimate may be unreliable.
          </p>
        </div>
      )}
    </div>
  );
}