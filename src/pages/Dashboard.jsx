import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Store, Boxes, ShieldCheck, Activity, TrendingUp, Users } from 'lucide-react';
import { sellersApi } from '../api/sellers';
import { adminsApi } from '../api/admins';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { Spinner } from '../components/ui/Spinner';
import { formatDate } from '../lib/utils';

function RecentActivity({ sellers }) {
  const recent = sellers?.slice(0, 5) ?? [];
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-brand-600" />
        <h3 className="font-semibold text-slate-800 text-sm">Recent Sellers</h3>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No sellers yet</p>
      ) : (
        <div className="space-y-1">
          {recent.map((s, i) => (
            <motion.div
              key={s.id}
              className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                  {s.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{s.name}</p>
                  <p className="text-xs text-slate-400">{formatDate(s.created_at)}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.status === 'active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                {s.status}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const { data: sellersData, isLoading } = useQuery({
    queryKey: ['sellers', { page: 1, limit: 10 }],
    queryFn: () => sellersApi.list({ page: 1, limit: 10 }),
    select: (res) => res.data.data,
  });

  const { data: adminsData } = useQuery({
    queryKey: ['admins', { page: 1, limit: 1 }],
    queryFn: () => adminsApi.list({ page: 1, limit: 1 }),
    select: (res) => res.data.data,
    enabled: isSuperAdmin,
  });

  const totalSellers = sellersData?.pagination?.total ?? 0;
  const activeSellers = sellersData?.sellers?.filter((s) => s.status === 'active').length ?? 0;
  const totalAdmins = adminsData?.pagination?.total ?? 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">
          Good {getTimeOfDay()},{' '}
          <span className="text-brand-600">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here's what's happening with your store network.</p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Sellers" value={totalSellers} icon={Store} color="brand" delay={0} />
          <StatCard title="Active Sellers" value={activeSellers} icon={TrendingUp} color="emerald" delay={0.05} />
          <StatCard title="Platform Accounts" value="—" icon={Boxes} color="amber" delay={0.1} />
          {isSuperAdmin && (
            <StatCard title="Admin Users" value={totalAdmins} icon={ShieldCheck} color="blue" delay={0.15} />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity sellers={sellersData?.sellers} />

        <motion.div
          className="card p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-brand-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Your Account</h3>
          </div>
          <div className="space-y-1">
            {[
              ['Name', user?.name],
              ['Email', user?.email],
              ['Role', user?.role?.replace('_', ' ')],
              ['Last Login', formatDate(user?.last_login_at)],
            ].map(([key, val]) => (
              <div key={key} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-400">{key}</span>
                <span className="text-xs text-slate-700 font-medium capitalize">{val || '—'}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
