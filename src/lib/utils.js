import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function extractError(err) {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    'Something went wrong'
  );
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateStr));
}

export const PLATFORM_LABELS = {
  amazon: 'Amazon',
  flipkart: 'Flipkart',
  meesho: 'Meesho',
};

export const PLATFORM_COLORS = {
  amazon: 'text-orange-600 bg-orange-50 border-orange-200',
  flipkart: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  meesho: 'text-pink-600 bg-pink-50 border-pink-200',
};

export const STATUS_COLORS = {
  active: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  inactive: 'text-slate-500 bg-slate-100 border-slate-200',
  suspended: 'text-amber-700 bg-amber-50 border-amber-200',
  error: 'text-red-600 bg-red-50 border-red-200',
};
