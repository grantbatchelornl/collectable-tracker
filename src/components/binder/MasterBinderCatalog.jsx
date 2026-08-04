import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { MASTER_BINDERS } from '@/lib/masterBinders';
import { getCategoryConfig } from '@/lib/binderCategories';
import { subscribeToMasterBinder } from '@/lib/binderChecklist';
import { Loader2, Check, BookOpen } from 'lucide-react';

export default function MasterBinderCatalog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('pokemon');
  const [subscribing, setSubscribing] = useState(null);

  const handleSubscribe = async (categoryKey, setName) => {
    const cat = MASTER_BINDERS[categoryKey];
    setSubscribing(setName);
    try {
      const binder = await subscribeToMasterBinder(user, categoryKey, cat.label, setName, cat.icon);
      navigate(`/binder/${binder.id}`);
    } catch (e) {
      console.error(e);
      setSubscribing(null);
    }
  };

  const cat = MASTER_BINDERS[activeCategory];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-primary">Master Binders</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Pre-built binders for every official set. Tap to subscribe — AI generates the full checklist automatically.
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {Object.entries(MASTER_BINDERS).map(([key, c]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              activeCategory === key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cat.sets.map((setName) => (
          <button
            key={setName}
            onClick={() => handleSubscribe(activeCategory, setName)}
            disabled={subscribing !== null}
            className="text-left rounded-xl bg-card border border-border p-3 hover:bg-accent transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{cat.icon}</span>
              <p className="text-xs font-semibold truncate flex-1">{setName}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">{cat.label}</p>
            {subscribing === setName ? (
              <div className="flex items-center gap-1 mt-1.5 text-primary">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[10px]">Generating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-1.5 text-primary">
                <Check className="w-3 h-3" />
                <span className="text-[10px]">Tap to subscribe</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}