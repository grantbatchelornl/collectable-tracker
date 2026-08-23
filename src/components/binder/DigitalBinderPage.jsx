import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { ChevronLeft, ChevronRight, Check, Star, Trophy, Award } from 'lucide-react';
import { haptic } from '@/lib/celebrations';

const POCKETS_PER_PAGE = 9;
const FUNKO_PER_SHELF = 4;
const COINS_PER_PAGE = 6;

export default function DigitalBinderPage({ checklist, binder, onSlotClick, completionPercent = 0 }) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpened(true), 100);
    return () => clearTimeout(t);
  }, []);

  const sorted = useMemo(
    () =>
      [...checklist].sort((a, b) =>
        (a.number || '').localeCompare(b.number || '', undefined, { numeric: true })
      ),
    [checklist]
  );

  const category = (binder.category || '').toLowerCase();
  const isComplete = completionPercent >= 100;

  if (category === 'funko') return <FunkoShelf items={sorted} onSlotClick={onSlotClick} opened={opened} isComplete={isComplete} binder={binder} />;
  if (category === 'coins' || category === 'coin') return <CoinAlbum items={sorted} onSlotClick={onSlotClick} opened={opened} isComplete={isComplete} binder={binder} />;
  if (category === 'memorabilia') return <GalleryWall items={sorted} onSlotClick={onSlotClick} opened={opened} isComplete={isComplete} binder={binder} />;

  return <NinePocketBinder items={sorted} onSlotClick={onSlotClick} opened={opened} isComplete={isComplete} binder={binder} />;
}

// Binder Cover that swings open
function BinderCover({ binder, opened, isComplete }) {
  return (
    <AnimatePresence>
      {!opened && (
        <motion.div
          initial={{ rotateY: 0, opacity: 1 }}
          animate={{ rotateY: -160, opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 z-30 origin-left rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-800 dark:to-black flex flex-col items-center justify-center shadow-float"
          style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
        >
          <div className="absolute left-2 top-0 bottom-0 w-6 flex flex-col justify-around items-center">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full bg-slate-500/60 ring-2 ring-slate-600/40" />
            ))}
          </div>
          <div className="text-center px-8">
            <span className="text-5xl mb-2 block">{binder?.icon || '📚'}</span>
            <p className="font-display font-bold text-white text-sm drop-shadow truncate">{binder?.name || 'Binder'}</p>
            {binder?.franchise && <p className="text-white/60 text-[10px] mt-0.5">{binder.franchise}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Completion Ribbon
function CompletionRibbon({ isComplete }) {
  if (!isComplete) return null;
  return (
    <motion.div
      initial={{ scale: 0, rotate: -15 }}
      animate={{ scale: 1, rotate: -12 }}
      transition={{ type: 'spring', damping: 12, delay: 0.3 }}
      className="absolute -top-1 -right-1 z-20"
    >
      <div className="bg-gold text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-glow-primary flex items-center gap-1">
        <Award className="w-3 h-3" /> COMPLETE
      </div>
    </motion.div>
  );
}

function NinePocketBinder({ items, onSlotClick, opened, isComplete, binder }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / POCKETS_PER_PAGE));
  const pageItems = items.slice(page * POCKETS_PER_PAGE, (page + 1) * POCKETS_PER_PAGE);
  const emptySlots = POCKETS_PER_PAGE - pageItems.length;
  const pageOwnedCount = pageItems.filter(i => i.status === 'owned').length;
  const isPageComplete = pageOwnedCount === POCKETS_PER_PAGE && pageItems.length === POCKETS_PER_PAGE;

  const goNext = () => {
    haptic(8);
    if (isPageComplete) haptic([10, 20]);
    setPage((p) => Math.min(totalPages - 1, p + 1));
  };
  const goPrev = () => { haptic(8); setPage((p) => Math.max(0, p - 1)); };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl">
        <BinderCover binder={binder} opened={opened} isComplete={isComplete} />
        <CompletionRibbon isComplete={isComplete} />
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 40, rotateY: opened ? 8 : 0 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -40, rotateY: -8 }}
            transition={{ duration: 0.3 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) goNext();
              if (info.offset.x > 60) goPrev();
            }}
            className="p-3 rounded-2xl bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 relative"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Binder ring holes */}
            <div className="flex justify-around mb-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-slate-400/50 dark:bg-slate-600/50 ring-1 ring-slate-500/30" />
              ))}
            </div>
            {/* 9-pocket grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {pageItems.map((item, idx) => (
                <Pocket key={item.number || item.name || idx} item={item} onClick={() => onSlotClick(item)} index={idx} />
              ))}
              {Array.from({ length: emptySlots }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-[2.5/3.5] rounded-lg bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10" />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <PageIndicator page={page} totalPages={totalPages} onPrev={goPrev} onNext={goNext} />
    </div>
  );
}

function Pocket({ item, onClick, index = 0 }) {
  const { status, collectible, isGraded, duplicateCount } = item;
  const [justFilled, setJustFilled] = useState(false);

  useEffect(() => {
    if (status === 'owned') {
      setJustFilled(true);
      const t = setTimeout(() => setJustFilled(false), 500);
      return () => clearTimeout(t);
    }
  }, [status]);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: justFilled ? [0.8, 1.08, 1] : 1,
        rotateY: 0,
      }}
      transition={{ duration: justFilled ? 0.4 : 0.2, delay: index * 0.03 }}
      onClick={onClick}
      className={`relative aspect-[2.5/3.5] rounded-lg overflow-hidden border transition-transform active:scale-95 ${
        status === 'owned' ? 'border-gain/40 bg-white dark:bg-slate-700' : 'border-black/10 bg-black/5 dark:bg-white/5'
      }`}
    >
      {collectible?.primary_photo_url ? (
        <Image src={collectible.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.name} />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
          {item.number && <p className="text-[8px] text-muted-foreground/60">{item.number}</p>}
          <p className="text-[7px] text-muted-foreground/50 leading-tight">{item.name}</p>
        </div>
      )}
      {status === 'owned' && (
        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-gain flex items-center justify-center">
          <Check className="w-2 h-2 text-white" />
        </div>
      )}
      {status === 'wishlisted' && (
        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-gold flex items-center justify-center">
          <Star className="w-2 h-2 text-white fill-white" />
        </div>
      )}
      {isGraded && (
        <div className="absolute bottom-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
          <Trophy className="w-2 h-2 text-primary-foreground" />
        </div>
      )}
      {duplicateCount > 1 && (
        <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold bg-gain text-white rounded-full px-1">
          {duplicateCount}
        </span>
      )}
    </motion.button>
  );
}

function FunkoShelf({ items, onSlotClick, opened, isComplete, binder }) {
  const shelves = useMemo(() => {
    const arr = [];
    for (let i = 0; i < items.length; i += FUNKO_PER_SHELF) {
      arr.push(items.slice(i, i + FUNKO_PER_SHELF));
    }
    return arr.length > 0 ? arr : [[]];
  }, [items]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 p-3 space-y-3 overflow-hidden">
        <BinderCover binder={binder} opened={opened} isComplete={isComplete} />
        <CompletionRibbon isComplete={isComplete} />
        {shelves.map((shelf, shelfIdx) => (
          <motion.div
            key={shelfIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shelfIdx * 0.08 }}
          >
            <div className="grid grid-cols-4 gap-2 min-h-[80px]">
              {shelf.map((item, idx) => (
                <FunkoSlot key={item.number || item.name || idx} item={item} onClick={() => onSlotClick(item)} index={idx} />
              ))}
              {Array.from({ length: FUNKO_PER_SHELF - shelf.length }).map((_, idx) => (
                <div key={`empty-${idx}`} className="flex items-end justify-center">
                  <div className="w-8 h-12 rounded bg-black/5 dark:bg-white/5" />
                </div>
              ))}
            </div>
            <div className="h-2 rounded-b-lg bg-gradient-to-r from-amber-700/30 via-amber-600/40 to-amber-700/30" />
          </motion.div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Display Shelves — swipe up to see more</p>
    </div>
  );
}

function FunkoSlot({ item, onClick, index = 0 }) {
  const { status, collectible } = item;
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="flex flex-col items-center justify-end relative"
    >
      <div className="relative w-full h-16 rounded-lg overflow-hidden">
        {collectible?.primary_photo_url ? (
          <Image src={collectible.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.name} />
        ) : (
          <div className="w-full h-full bg-muted/30 flex items-center justify-center p-1">
            <p className="text-[7px] text-muted-foreground/50 text-center leading-tight">{item.name}</p>
          </div>
        )}
      </div>
      <div className="h-1 w-full rounded-full bg-amber-600/30" />
      {status === 'owned' && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gain flex items-center justify-center">
          <Check className="w-2 h-2 text-white" />
        </div>
      )}
    </motion.button>
  );
}

function CoinAlbum({ items, onSlotClick, opened, isComplete, binder }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / COINS_PER_PAGE));
  const pageItems = items.slice(page * COINS_PER_PAGE, (page + 1) * COINS_PER_PAGE);

  return (
    <div className="space-y-3">
      <div className="relative">
        <BinderCover binder={binder} opened={opened} isComplete={isComplete} />
        <CompletionRibbon isComplete={isComplete} />
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) setPage((p) => Math.min(totalPages - 1, p + 1));
              if (info.offset.x > 60) setPage((p) => Math.max(0, p - 1));
            }}
            className="p-4 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black"
          >
            <div className="grid grid-cols-3 gap-3">
              {pageItems.map((item, idx) => (
                <CoinSlot key={item.number || item.name || idx} item={item} onClick={() => onSlotClick(item)} index={idx} />
              ))}
              {Array.from({ length: COINS_PER_PAGE - pageItems.length }).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square rounded-full border-2 border-dashed border-slate-700/50 bg-black/20" />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <PageIndicator page={page} totalPages={totalPages} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))} />
    </div>
  );
}

function CoinSlot({ item, onClick, index = 0 }) {
  const { status, collectible } = item;
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1"
    >
      <div className="relative aspect-square w-full rounded-full overflow-hidden border-2 border-slate-700 bg-black/30">
        {collectible?.primary_photo_url ? (
          <Image src={collectible.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.name} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-1">
            {item.number && <p className="text-[8px] text-slate-500">{item.number}</p>}
            <p className="text-[6px] text-slate-600 text-center leading-tight">{item.name}</p>
          </div>
        )}
        {status === 'owned' && (
          <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-gain flex items-center justify-center">
            <Check className="w-2 h-2 text-white" />
          </div>
        )}
      </div>
      <p className="text-[8px] text-muted-foreground truncate w-full text-center">{item.name}</p>
    </motion.button>
  );
}

function GalleryWall({ items, onSlotClick, opened, isComplete, binder }) {
  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl bg-gradient-to-b from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 p-3 overflow-hidden">
        <BinderCover binder={binder} opened={opened} isComplete={isComplete} />
        <CompletionRibbon isComplete={isComplete} />
        <div className="columns-2 gap-2">
          {items.map((item, idx) => (
            <GalleryFrame key={item.number || item.name || idx} item={item} onClick={() => onSlotClick(item)} index={idx} />
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-center">Gallery Wall</p>
    </div>
  );
}

function GalleryFrame({ item, onClick, index = 0 }) {
  const { status, collectible } = item;
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="w-full mb-2 break-inside-avoid"
    >
      <div className="p-1.5 rounded-sm bg-amber-900/20 border-2 border-amber-900/30 shadow-md">
        <div className="relative aspect-[3/4] rounded-sm overflow-hidden bg-muted/30">
          {collectible?.primary_photo_url ? (
            <Image src={collectible.primary_photo_url} fittingType="fill" className="w-full h-full" alt={item.name} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-1">
              {item.number && <p className="text-[8px] text-muted-foreground/50">{item.number}</p>}
              <p className="text-[7px] text-muted-foreground/50 text-center leading-tight">{item.name}</p>
            </div>
          )}
          {status === 'owned' && (
            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gain flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function PageIndicator({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onPrev}
        disabled={page === 0}
        className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center disabled:opacity-30"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-muted-foreground font-medium">
        Page {page + 1} of {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages - 1}
        className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center disabled:opacity-30"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}