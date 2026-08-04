import { useTheme, THEMES } from '@/lib/theme';
import { Check } from 'lucide-react';
import { haptic } from '@/lib/celebrations';

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Choose your theme — colors only, layout stays the same.</p>
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              haptic(10);
              setTheme(t.id);
            }}
            className={`relative rounded-xl p-3 flex items-center gap-2 border-2 transition-all ${
              theme === t.id ? 'border-primary shadow-soft' : 'border-border'
            }`}
          >
            <div className="flex gap-1">
              {t.colors.map((c, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full ring-1 ring-black/10"
                  style={{ background: c }}
                />
              ))}
            </div>
            <span className="text-xs font-medium flex-1 text-left truncate">{t.label}</span>
            {theme === t.id && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}