import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

function Field({ label, children, required }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-primary"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between w-full p-3 rounded-xl border transition-colors ${
        checked ? 'bg-primary/10 border-primary' : 'bg-card border-border'
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <div
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}

function Section({ title, subtitle, children }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-xl border border-border bg-card text-left hover:bg-accent transition-colors">
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export default function CollectibleFormFields({ data, update }) {
  return (
    <div className="space-y-5">
      {/* Essential fields - always visible */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Basic Info <span className="text-primary normal-case">required</span>
        </h3>
        <Field label="Item Name" required>
          <Input
            value={data.item_name}
            onChange={(e) => update('item_name', e.target.value)}
            placeholder="e.g. Charizard Base Set"
            className="h-11"
          />
        </Field>
        <Field label="Character / Athlete / Card Name">
          <Input
            value={data.character_athlete_name}
            onChange={(e) => update('character_athlete_name', e.target.value)}
            placeholder="e.g. Pikachu, Michael Jordan"
            className="h-11"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand">
            <Input value={data.brand} onChange={(e) => update('brand', e.target.value)} placeholder="Topps, Funko" className="h-11" />
          </Field>
          <Field label="Year">
            <Input type="number" value={data.year} onChange={(e) => update('year', e.target.value)} placeholder="1999" className="h-11" />
          </Field>
        </div>
      </div>

      {/* Set & Card Details - collapsible */}
      <Section title="Set & Card Details" subtitle="Product line, set name, card number, variant">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Product Line">
            <Input value={data.product_line} onChange={(e) => update('product_line', e.target.value)} placeholder="Base Set, Pop!" className="h-11" />
          </Field>
          <Field label="Set Name">
            <Input value={data.set_name} onChange={(e) => update('set_name', e.target.value)} className="h-11" />
          </Field>
          <Field label="Set Number">
            <Input value={data.set_number} onChange={(e) => update('set_number', e.target.value)} className="h-11" />
          </Field>
          <Field label="Card Number">
            <Input value={data.card_number} onChange={(e) => update('card_number', e.target.value)} className="h-11" />
          </Field>
          <Field label="Team">
            <Input value={data.team} onChange={(e) => update('team', e.target.value)} className="h-11" />
          </Field>
          <Field label="Variant">
            <Input value={data.variant} onChange={(e) => update('variant', e.target.value)} className="h-11" />
          </Field>
          <Field label="Edition">
            <Input value={data.edition} onChange={(e) => update('edition', e.target.value)} placeholder="1st Edition" className="h-11" />
          </Field>
          <Field label="Parallel">
            <Input value={data.parallel} onChange={(e) => update('parallel', e.target.value)} placeholder="Holo, Reverse" className="h-11" />
          </Field>
          <Field label="Serial Number">
            <Input value={data.serial_number} onChange={(e) => update('serial_number', e.target.value)} className="h-11" />
          </Field>
          <Field label="Authentication Co.">
            <Input value={data.authentication_company} onChange={(e) => update('authentication_company', e.target.value)} placeholder="JSA, PSA/DNA" className="h-11" />
          </Field>
        </div>
      </Section>

      {/* Grading & Condition - collapsible */}
      <Section title="Grading & Condition" subtitle="Autograph, grading, and item condition">
        <Toggle
          checked={data.has_autograph}
          onChange={(v) => update('has_autograph', v)}
          label="Autographed"
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Grading Company">
            <Input value={data.grading_company} onChange={(e) => update('grading_company', e.target.value)} placeholder="PSA, BGS, CGC" className="h-11" />
          </Field>
          <Field label="Grade">
            <Input value={data.grade} onChange={(e) => update('grade', e.target.value)} placeholder="9.5, 10" className="h-11" />
          </Field>
          <Field label="Box / Packaging">
            <Input value={data.box_condition} onChange={(e) => update('box_condition', e.target.value)} placeholder="Mint, Opened" className="h-11" />
          </Field>
          <Field label="Item Condition">
            <Input value={data.item_condition} onChange={(e) => update('item_condition', e.target.value)} placeholder="Near Mint" className="h-11" />
          </Field>
        </div>
      </Section>

      {/* Value - always visible */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Estimated Value <span className="text-primary normal-case">required</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Estimated Value" required>
            <Input
              type="number"
              step="0.01"
              value={data.estimated_value}
              onChange={(e) => update('estimated_value', e.target.value)}
              placeholder="0.00"
              className="h-11"
            />
          </Field>
          <Field label="Purchase Cost">
            <Input
              type="number"
              step="0.01"
              value={data.purchase_cost}
              onChange={(e) => update('purchase_cost', e.target.value)}
              placeholder="0.00"
              className="h-11"
            />
          </Field>
        </div>
        <p className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-2.5">
          Values are estimates and not guaranteed sale prices. Manual values are clearly labeled.
        </p>
      </div>

      {/* Value range & notes - collapsible */}
      <Section title="Value Range & Notes" subtitle="Low/high estimates and additional notes">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Low Estimate">
            <Input type="number" step="0.01" value={data.low_value} onChange={(e) => update('low_value', e.target.value)} placeholder="0.00" className="h-11" />
          </Field>
          <Field label="High Estimate">
            <Input type="number" step="0.01" value={data.high_value} onChange={(e) => update('high_value', e.target.value)} placeholder="0.00" className="h-11" />
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            value={data.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Any additional notes..."
            className="w-full h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Field>
      </Section>

      {/* Selling - collapsible */}
      <Section title="Selling" subtitle="List this item for sale with an asking price">
        <Toggle
          checked={data.for_sale}
          onChange={(v) => update('for_sale', v)}
          label="List for Sale"
        />
        {data.for_sale && (
          <Field label="Asking Price">
            <Input
              type="number"
              step="0.01"
              value={data.asking_price}
              onChange={(e) => update('asking_price', e.target.value)}
              placeholder="0.00"
              className="h-11"
            />
          </Field>
        )}
      </Section>

      {/* Privacy - always visible */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Privacy</h3>
        <Field label="Who can see this collectible?">
          <Select value={data.privacy_status} onValueChange={(v) => update('privacy_status', v)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private — Only me</SelectItem>
              <SelectItem value="friends">Friends — My friends only</SelectItem>
              <SelectItem value="public">Public — Everyone</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}