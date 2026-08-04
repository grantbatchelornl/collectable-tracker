import { MASTER_BINDERS } from '@/lib/masterBinders';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'alphabetical', label: 'A-Z' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'count_desc', label: 'Most Items' },
  { value: 'count_asc', label: 'Fewest Items' },
];

export default function BinderFilterBar({ activeCategory, onCategoryChange, sort, onSortChange, statusFilter, onStatusChange }) {
  const [showSort, setShowSort] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const sortRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setShowStatus(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentSort = SORT_OPTIONS.find(s => s.value === sort);
  const statusLabel = statusFilter === 'all' ? 'Status' : statusFilter === 'not_started' ? 'Not Started' : statusFilter.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          All
        </button>
        {Object.entries(MASTER_BINDERS).map(([key, c]) => (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              activeCategory === key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
            }`}
          >
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative" ref={statusRef}>
          <button
            onClick={() => { setShowStatus(!showStatus); setShowSort(false); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border text-muted-foreground"
          >
            {statusLabel} <ChevronDown className="w-3 h-3" />
          </button>
          {showStatus && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border rounded-xl shadow-float py-1 min-w-[140px]">
              {['all', 'not_started', 'started', 'near_completion', 'completed'].map(s => (
                <button
                  key={s}
                  onClick={() => { onStatusChange(s); setShowStatus(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent ${statusFilter === s ? 'font-bold text-primary' : ''}`}
                >
                  {s === 'all' ? 'All Status' : s === 'not_started' ? 'Not Started' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={sortRef}>
          <button
            onClick={() => { setShowSort(!showSort); setShowStatus(false); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border text-muted-foreground"
          >
            Sort: {currentSort?.label} <ChevronDown className="w-3 h-3" />
          </button>
          {showSort && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border rounded-xl shadow-float py-1 min-w-[140px]">
              {SORT_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => { onSortChange(s.value); setShowSort(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent ${sort === s.value ? 'font-bold text-primary' : ''}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}