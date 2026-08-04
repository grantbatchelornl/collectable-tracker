import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookCheck } from 'lucide-react';
import { celebrateSmall } from '@/lib/celebrations';

export default function SaveAnimation({ show }) {
  useEffect(() => {
    if (show) celebrateSmall();
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ x: '-120vw' }}
            animate={{ x: ['0vw', '0vw', '120vw'] }}
            transition={{ duration: 1.4, times: [0, 0.55, 1], ease: 'easeInOut' }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, -3, 3, 0] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40"
            >
              <BookCheck className="w-12 h-12 text-primary-foreground" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 1, 0], y: 0 }}
              transition={{ duration: 1.4, times: [0, 0.2, 0.8, 1] }}
              className="font-display font-semibold text-lg"
            >
              Saved to your binder!
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}