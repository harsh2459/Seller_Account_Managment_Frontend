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
    <div
      className="min-h-screen flex items-center justify-end bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/omni_background_1.png')" }}
    >
      {/* Sign-in card — right side */}
      <motion.div
        className="w-full max-w-sm mx-8 mr-16 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-8"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
            <Zap size={15} className="text-white" />
          </div>
          <span className="text-[15px] font-semibold text-slate-800">OmniAdmin</span>
        </div>

        <h1 className="text-[22px] font-semibold text-slate-900 mb-1">Sign in</h1>
        <p className="text-[13px] text-slate-400 mb-6">Enter your credentials to continue.</p>

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
            <label className="text-[13px] font-medium text-slate-700">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={14} />
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
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-[12px] text-red-500">{errors.password.message}</p>}
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full mt-1">
            Sign In
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
