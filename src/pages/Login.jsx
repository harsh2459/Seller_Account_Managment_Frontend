import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { extractError } from '../lib/utils';

const schema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async ({ email, password }) => {
    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="w-full max-w-md relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8 gap-3">
            <motion.div
              className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-glow"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            >
              <Zap size={28} className="text-white" />
            </motion.div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">Sign in to OmniAdmin</h1>
              <p className="text-sm text-slate-500 mt-1">Manage your multi-channel operations</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-card-md p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email or Username"
                type="text"
                placeholder="admin@example.com"
                icon={Mail}
                autoComplete="username"
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className={`input-base pl-9 pr-10 ${errors.password ? 'border-red-400' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <Button type="submit" loading={isSubmitting} className="w-full mt-2">
                Sign In
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            OmniAdmin &mdash; Multi-channel E-commerce Management
          </p>
        </motion.div>
      </div>
    </div>
  );
}
