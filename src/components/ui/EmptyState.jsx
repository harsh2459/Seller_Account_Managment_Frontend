import { motion } from 'framer-motion';

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {Icon && (
        <div className="p-4 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200">
          <Icon size={32} />
        </div>
      )}
      <div className="text-center">
        <p className="font-semibold text-slate-700">{title}</p>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {action}
    </motion.div>
  );
}
