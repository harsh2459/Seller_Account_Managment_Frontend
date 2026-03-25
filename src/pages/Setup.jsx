import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Zap, User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { setupApi } from '../api/auth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { extractError } from '../lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export function SetupPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setupApi.status().then(({ data }) => {
      if (!data.data.needsSetup) navigate('/login', { replace: true });
      else setChecking(false);
    }).catch(() => setChecking(false));
  }, [navigate]);

  const onSubmit = async (values) => {
    try {
      await setupApi.createFirstAdmin({ ...values, role: 'super_admin' });
      toast.success('Super admin created! Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  if (checking) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div
        className="w-full max-w-md relative"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-center mb-8 gap-3">
          <motion.div
            className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-glow"
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          >
            <Zap size={28} className="text-white" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Welcome to OmniAdmin</h1>
            <p className="text-sm text-slate-500 mt-1">Set up your super admin account to get started</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-card-md p-6">
          <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-brand-50 border border-brand-100">
            <ShieldCheck size={16} className="text-brand-600" />
            <p className="text-xs text-brand-700">This account will have full system access</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" placeholder="John Doe" icon={User} error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" placeholder="admin@example.com" icon={Mail} error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="Min. 8 characters" icon={Lock} error={errors.password?.message} {...register('password')} />
            <Button type="submit" loading={isSubmitting} className="w-full mt-2">
              Create Super Admin
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
