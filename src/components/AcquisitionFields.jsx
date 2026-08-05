import { Store, Calendar, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SOURCES = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'trade', label: 'Trade' },
  { value: 'gift', label: 'Gift' },
  { value: 'pulled', label: 'Pulled' },
  { value: 'inherited', label: 'Inherited' },
  { value: 'convention', label: 'Convention' },
  { value: 'card_shop', label: 'Card Shop' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'other', label: 'Other' },
];

export default function AcquisitionFields({ data, update }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Store className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Acquisition History</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Source</label>
          <Select
            value={data.acquisition_source || 'purchase'}
            onValueChange={(v) => update('acquisition_source', v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <User className="w-3 h-3" /> Seller
          </label>
          <input
            type="text"
            value={data.seller_name || ''}
            onChange={(e) => update('seller_name', e.target.value)}
            placeholder="Who did you get it from?"
            className="w-full h-10 rounded-lg bg-background border border-border text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Acquisition Date
          </label>
          <input
            type="date"
            value={data.purchase_date || ''}
            onChange={(e) => update('purchase_date', e.target.value)}
            className="w-full h-10 rounded-lg bg-background border border-border text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}