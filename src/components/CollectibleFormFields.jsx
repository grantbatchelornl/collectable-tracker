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
import { getFormFields } from '@/lib/categoryFields';

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
  const fields = getFormFields(data.category_name);
  const has = (key, section) => (fields[section] || []).includes(key);

  return (
    <div className="space-y-5">
      {/* Basic Info */}
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
        {has('character_athlete_name', 'basic') && (
          <Field label="Character / Athlete / Card Name">
            <Input
              value={data.character_athlete_name}
              onChange={(e) => update('character_athlete_name', e.target.value)}
              placeholder="e.g. Pikachu, Michael Jordan"
              className="h-11"
            />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          {has('brand', 'basic') && (
            <Field label="Brand / Manufacturer">
              <Input value={data.brand} onChange={(e) => update('brand', e.target.value)} placeholder="Topps, Funko" className="h-11" />
            </Field>
          )}
          {has('year', 'basic') && (
            <Field label="Year">
              <Input type="number" value={data.year} onChange={(e) => update('year', e.target.value)} placeholder="1999" className="h-11" />
            </Field>
          )}
          {has('team', 'basic') && (
            <Field label="Team">
              <Input value={data.team} onChange={(e) => update('team', e.target.value)} className="h-11" />
            </Field>
          )}
          {has('sport', 'basic') && (
            <Field label="Sport">
              <Input value={data.sport} onChange={(e) => update('sport', e.target.value)} placeholder="Baseball, Football" className="h-11" />
            </Field>
          )}
          {has('country', 'basic') && (
            <Field label="Country">
              <Input value={data.country} onChange={(e) => update('country', e.target.value)} placeholder="USA, Canada" className="h-11" />
            </Field>
          )}
          {has('denomination', 'basic') && (
            <Field label="Denomination">
              <Input value={data.denomination} onChange={(e) => update('denomination', e.target.value)} placeholder="1 cent, $1" className="h-11" />
            </Field>
          )}
          {has('set_name', 'basic') && (
            <Field label="Set Name">
              <Input value={data.set_name} onChange={(e) => update('set_name', e.target.value)} className="h-11" />
            </Field>
          )}
          {has('card_number', 'basic') && (
            <Field label="Card Number">
              <Input value={data.card_number} onChange={(e) => update('card_number', e.target.value)} className="h-11" />
            </Field>
          )}
          {has('box_number', 'basic') && (
            <Field label="Box Number">
              <Input value={data.box_number} onChange={(e) => update('box_number', e.target.value)} placeholder="#1234" className="h-11" />
            </Field>
          )}
          {has('series', 'basic') && (
            <Field label="Series">
              <Input value={data.series} onChange={(e) => update('series', e.target.value)} className="h-11" />
            </Field>
          )}
        </div>
        {has('language', 'basic') && (
          <Field label="Language">
            <Input value={data.language} onChange={(e) => update('language', e.target.value)} placeholder="English, Japanese" className="h-11" />
          </Field>
        )}
        {has('franchise', 'basic') && (
          <Field label="Franchise">
            <Input value={data.franchise} onChange={(e) => update('franchise', e.target.value)} placeholder="Marvel, Disney" className="h-11" />
          </Field>
        )}
        {has('product_line', 'basic') && (
          <Field label="Product Line / Set">
            <Input value={data.product_line} onChange={(e) => update('product_line', e.target.value)} placeholder="Base Set, Pop!" className="h-11" />
          </Field>
        )}
      </div>

      {/* Additional Details */}
      <Section title="Additional Details" subtitle="Variant, edition, and identifying information">
        <div className="grid grid-cols-2 gap-3">
          {has('product_line', 'details') && (
            <Field label="Product Line">
              <Input value={data.product_line} onChange={(e) => update('product_line', e.target.value)} className="h-11" />
            </Field>
          )}
          {has('set_name', 'details') && (
            <Field label="Set Name">
              <Input value={data.set_name} onChange={(e) => update('set_name', e.target.value)} className="h-11" />
            </Field>
          )}
          {has('card_number', 'details') && (
            <Field label="Card Number">
              <Input value={data.card_number} onChange={(e) => update('card_number', e.target.value)} className="h-11" />
            </Field>
          )}
          {has('variant', 'details') && (
            <Field label="Variant">
              <Input value={data.variant} onChange={(e) => update('variant', e.target.value)} className="h-11" />
            </Field>
          )}
          {has('edition', 'details') && (
            <Field label="Edition">
              <Input value={data.edition} onChange={(e) => update('edition', e.target.value)} placeholder="1st Edition" className="h-11" />
            </Field>
          )}
          {has('parallel', 'details') && (
            <Field label="Parallel">
              <Input value={data.parallel} onChange={(e) => update('parallel', e.target.value)} placeholder="Holo, Reverse" className="h-11" />
            </Field>
          )}
          {has('serial_number', 'details') && (
            <Field label="Serial Number">
              <Input value={data.serial_number} onChange={(e) => update('serial_number', e.target.value)} className="h-11" />
            </Field>
          )}
          {has('authentication_company', 'details') && (
            <Field label="Authentication Co.">
              <Input value={data.authentication_company} onChange={(e) => update('authentication_company', e.target.value)} placeholder="JSA, PSA/DNA" className="h-11" />
            </Field>
          )}
          {has('mint_mark', 'details') && (
            <Field label="Mint Mark">
              <Input value={data.mint_mark} onChange={(e) => update('mint_mark', e.target.value)} placeholder="P, D, S" className="h-11" />
            </Field>
          )}
          {has('composition', 'details') && (
            <Field label="Composition">
              <Input value={data.composition} onChange={(e) => update('composition', e.target.value)} placeholder="Silver, Copper" className="h-11" />
            </Field>
          )}
          {has('item_type', 'details') && (
            <Field label="Item Type">
              <Input value={data.item_type} onChange={(e) => update('item_type', e.target.value)} placeholder="Jersey, Ball, Helmet" className="h-11" />
            </Field>
          )}
        </div>
        {has('is_exclusive', 'details') && (
          <Toggle checked={data.is_exclusive} onChange={(v) => update('is_exclusive', v)} label="Exclusive" />
        )}
        {has('has_sticker', 'details') && (
          <Toggle checked={data.has_sticker} onChange={(v) => update('has_sticker', v)} label="Has Sticker" />
        )}
        {has('is_chase', 'details') && (
          <Toggle checked={data.is_chase} onChange={(v) => update('is_chase', v)} label="Chase Variant" />
        )}
        {has('is_boxed', 'details') && (
          <Toggle checked={data.is_boxed} onChange={(v) => update('is_boxed', v)} label="Boxed" />
        )}
        {has('is_rookie', 'details') && (
          <Toggle checked={data.is_rookie} onChange={(v) => update('is_rookie', v)} label="Rookie Card" />
        )}
        {has('has_patch', 'details') && (
          <Toggle checked={data.has_patch} onChange={(v) => update('has_patch', v)} label="Patch / Memorabilia" />
        )}
        {has('is_game_used', 'details') && (
          <Toggle checked={data.is_game_used} onChange={(v) => update('is_game_used', v)} label="Game-Used / Event-Used" />
        )}
      </Section>

      {/* Grading & Condition */}
      <Section title="Grading & Condition" subtitle="Autograph, grading, and item condition">
        {has('has_autograph', 'grading') && (
          <Toggle
            checked={data.has_autograph}
            onChange={(v) => update('has_autograph', v)}
            label="Autographed"
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          {has('grading_company', 'grading') && (
            <Field label="Grading Company">
              <Input value={data.grading_company} onChange={(e) => update('grading_company', e.target.value)} placeholder="PSA, BGS, CGC" className="h-11" />
            </Field>
          )}
          {has('grade', 'grading') && (
            <Field label="Grade">
              <Input value={data.grade} onChange={(e) => update('grade', e.target.value)} placeholder="9.5, 10" className="h-11" />
            </Field>
          )}
          {has('box_condition', 'grading') && (
            <Field label="Box / Packaging">
              <Input value={data.box_condition} onChange={(e) => update('box_condition', e.target.value)} placeholder="Mint, Opened" className="h-11" />
            </Field>
          )}
          {has('item_condition', 'grading') && (
            <Field label="Item Condition">
              <Input value={data.item_condition} onChange={(e) => update('item_condition', e.target.value)} placeholder="Near Mint" className="h-11" />
            </Field>
          )}
          {has('authentication_company', 'grading') && (
            <Field label="Authentication Co.">
              <Input value={data.authentication_company} onChange={(e) => update('authentication_company', e.target.value)} placeholder="JSA, PSA/DNA" className="h-11" />
            </Field>
          )}
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

      {/* Value Range & Notes - collapsible */}
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