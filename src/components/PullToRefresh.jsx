import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronDown } from 'lucide-react';

const PULL_THRESHOLD = 70;
const MAX_PULL = 100;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const onTouchStart = (e) => {
    if (refreshing || window.scrollY > 0) return;
    startYRef.current = e.touches[0].clientY;
    isPullingRef.current = true;
    setIsPulling(true);
  };

  const onTouchMove = (e) => {
    if (!isPullingRef.current || refreshing) return;
    const diff = e.touches[0].clientY - startYRef.current;
    if (diff > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(diff * 0.4, MAX_PULL));
    }
  };

  const onTouchEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    setIsPulling(false);
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      try {
        await onRefresh();
      } catch (err) {
        console.error('Refresh failed', err);
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const indicatorHeight = pullDistance || (refreshing ? PULL_THRESHOLD : 0);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <motion.div
        animate={{ height: indicatorHeight }}
        transition={isPulling ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 35 }}
        className="flex items-center justify-center overflow-hidden"
      >
        {refreshing ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <ChevronDown
            className="w-5 h-5 text-muted-foreground"
            style={{ opacity: progress, transform: `rotate(${progress < 1 ? 0 : 180}deg)` }}
          />
        )}
      </motion.div>
      {children}
    </div>
  );
}