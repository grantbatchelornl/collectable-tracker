import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency, formatRelativeDate } from '@/lib/format';
import { Search, Loader2, TrendingUp, TrendingDown, Minus, Bookmark, ExternalLink } from 'lucide-react';

export default function MarketplaceSearch({ collectible }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const prompt = `Search the web for marketplace listings and recently sold sales for this collectible:

Name: ${collectible.item_name}
Category: ${collectible.category_name || 'Unknown'}
${collectible.set_name ? `Set: ${collectible.set_name}` : ''}
${collectible.year ? `Year: ${collectible.year}` : ''}
${collectible.product_line ? `Product Line: ${collectible.product_line}` : ''}
${collectible.grading_company ? `Grade: ${collectible.grading_company} ${collectible.grade}` : 'Condition: Raw/Ungraded'}
${collectible.character_athlete_name ? `Character/Player: ${collectible.character_athlete_name}` : ''}

Find:
1. Recent SOLD listings (last 90 days) with prices, dates, and source (eBay, PriceCharting, etc.)
2. Current active listings with lowest buy-it-now prices
3. Price trend (rising, falling, or stable)

Return as JSON with sold_listings array, current_listings array, trend, lowest_price, average_sold_price, and summary.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            sold_listings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  price: { type: 'number' },
                  date: { type: 'string' },
                  source: { type: 'string' },
                  condition: { type: 'string' }
                }
              }
            },
            current_listings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  price: { type: 'number' },
                  source: { type: 'string' },
                  condition: { type: 'string' }
                }
              }
            },
            trend: { type: 'string' },
            lowest_price: { type: 'number' },
            average_sold_price: { type: 'number' },
            summary: { type: 'string' }
          }
        }
      });
      setResults(response);
    } catch (e) {
      setError('Unable to search marketplace right now. Please try again later.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    try {
      await base44.entities.Watchlist.create({
        user_id: collectible.created_by_id,
        item_name: collectible.item_name,
        category_name: collectible.category_name,
        target_price: results?.lowest_price || 0,
        notes: `Saved marketplace search. Avg sold: ${formatCurrency(results?.average_sold_price || 0)}`,
        priority: 'medium',
        status: 'active',
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
    }
  };

  const TrendIcon = results?.trend === 'rising' ? TrendingUp : results?.trend === 'falling' ? TrendingDown : Minus;
  const trendColor = results?.trend === 'rising' ? 'text-gain' : results?.trend === 'falling' ? 'text-loss' : 'text-muted-foreground';

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-1.5">
          <Search className="w-4 h-4 text-primary" /> Marketplace Research
        </h3>
        {results && !saved && (
          <button
            onClick={handleSaveSearch}
            className="text-xs text-primary font-medium flex items-center gap-1"
          >
            <Bookmark className="w-3.5 h-3.5" /> Save Search
          </button>
        )}
        {saved && (
          <span className="text-xs text-gain font-medium flex items-center gap-1">
            <Bookmark className="w-3.5 h-3.5" /> Saved!
          </span>
        )}
      </div>

      {!results && !loading && (
        <button
          onClick={handleSearch}
          className="w-full h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium flex items-center justify-center gap-1.5"
        >
          <Search className="w-4 h-4" /> Search Sold Sales & Listings
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
          <p className="text-xs text-muted-foreground">Searching eBay, PriceCharting, and more...</p>
        </div>
      )}

      {error && <p className="text-sm text-loss text-center py-4">{error}</p>}

      {results && (
        <div className="space-y-3">
          {results.summary && (
            <p className="text-xs text-muted-foreground">{results.summary}</p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {results.lowest_price != null && (
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Lowest</p>
                <p className="text-sm font-bold">{formatCurrency(results.lowest_price)}</p>
              </div>
            )}
            {results.average_sold_price != null && (
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Avg Sold</p>
                <p className="text-sm font-bold">{formatCurrency(results.average_sold_price)}</p>
              </div>
            )}
            {results.trend && (
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Trend</p>
                <p className={`text-sm font-bold capitalize flex items-center justify-center gap-0.5 ${trendColor}`}>
                  <TrendIcon className="w-3 h-3" /> {results.trend}
                </p>
              </div>
            )}
          </div>

          {results.sold_listings && results.sold_listings.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Recently Sold</p>
              <div className="space-y-1">
                {results.sold_listings.slice(0, 5).map((listing, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">{listing.source || 'Unknown'} · {listing.condition || 'N/A'}</span>
                    <span className="font-medium flex-shrink-0 ml-2">{formatCurrency(listing.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.current_listings && results.current_listings.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Current Listings</p>
              <div className="space-y-1">
                {results.current_listings.slice(0, 5).map((listing, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">{listing.source || 'Unknown'} · {listing.condition || 'N/A'}</span>
                    <span className="font-medium flex-shrink-0 ml-2">{formatCurrency(listing.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSearch}
            className="w-full h-8 rounded-lg border border-border text-xs text-muted-foreground font-medium flex items-center justify-center gap-1"
          >
            <Search className="w-3 h-3" /> Refresh Search
          </button>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <ExternalLink className="w-3 h-3" /> For research only — not for selling. Always verify on the source site.
      </p>
    </div>
  );
}