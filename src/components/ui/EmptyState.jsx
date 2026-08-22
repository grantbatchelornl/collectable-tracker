import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, secondaryActionLabel, onSecondaryAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center py-16 px-4"
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-muted flex items-center justify-center mx-auto mb-5 shadow-soft"
        >
          <Icon className="w-12 h-12 text-primary" />
        </motion.div>
      )}
      <h2 className="font-display text-xl font-bold mb-2">{title}</h2>
      {description && (
        <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">{description}</p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col items-center gap-3">
          {actionLabel && onAction && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onAction}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-3 font-medium shadow-soft hover:opacity-90 transition-opacity"
            >
              {actionLabel}
            </motion.button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="text-sm text-primary font-medium hover:underline underline-offset-4"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}