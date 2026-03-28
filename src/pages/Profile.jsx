import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { User, Mail, ShieldCheck, Clock, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminsApi } from '../api/admins';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { extractError, formatDate } from '../lib/utils';

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(pwSchema),
  });

  const changePwMut = useMutation({
    mutationFn: (v) => adminsApi.changeMyPassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: () => { toast.success('Password changed successfully'); reset(); },
    onError: (err) => toast.error(extractError(err)),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="My Profile" subtitle="Manage your account settings" />

      {/* Profile Info */}
      <motion.div className="card p-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 border border-brand-200 flex items-center justify-center text-2xl font-bold text-brand-700">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <Badge className={`mt-1 ${user?.role === 'super_admin' ? 'text-brand-700 bg-brand-50 border-brand-200' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>
              <ShieldCheck size={11} />
              {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: User, label: 'Name', value: user?.name },
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: ShieldCheck, label: 'Role', value: user?.role?.replace('_', ' ') },
            { icon: Clock, label: 'Last Login', value: formatDate(user?.last_login_at) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Icon size={15} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm text-slate-700 font-medium capitalize">{value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div className="card p-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm">
          <Lock size={16} className="text-brand-600" /> Change Password
        </h3>
        <form onSubmit={handleSubmit((v) => changePwMut.mutate(v))} className="space-y-4">
          <Input label="Current Password" type="password" placeholder="Your current password" error={errors.currentPassword?.message} {...register('currentPassword')} />
          <Input label="New Password" type="password" placeholder="Min 8 characters" error={errors.newPassword?.message} {...register('newPassword')} />
          <Input label="Confirm Password" type="password" placeholder="Repeat new password" error={errors.confirm?.message} {...register('confirm')} />
          <div className="flex justify-end">
            <Button type="submit" loading={changePwMut.isPending}>Update Password</Button>
          </div>
        </form>
      </motion.div>

      {/* Sign out */}
      <motion.div className="card p-5 border-red-100" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h3 className="font-semibold text-slate-700 mb-3 text-sm">Session</h3>
        <Button variant="danger" onClick={logout}>
          <LogOut size={15} /> Sign Out
        </Button>
      </motion.div>
    </div>
  );
}
