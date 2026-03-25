import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function StatCard({ title, value, icon: Icon, color = 'brand', trend, delay = 0 }) {
  const colors = {
    brand: 'text-brand-600 bg-brand-50 border-brand-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    red: 'text-red-600 bg-red-50 border-red-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
  };

  return (
    <motion.div
      className="card p-5 flex gap-4 items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      <div className={cn('p-3 rounded-xl border', colors[color])}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value ?? '—'}</p>
        {trend && <p className="text-xs text-slate-400 mt-0.5">{trend}</p>}
      </div>
    </motion.div>
  );
}
