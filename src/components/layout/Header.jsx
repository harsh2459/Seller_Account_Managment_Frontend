import { useLocation, Link } from 'react-router-dom';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/sellers': 'Sellers',
  '/accounts': 'Platform Accounts',
  '/admins': 'Admin Management',
  '/profile': 'My Profile',
};

export function Header({ onMobileMenuOpen }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = TITLES[pathname] ?? 'OmniAdmin';

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-6 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1">
        <h2 className="font-semibold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
          <Bell size={18} />
        </button>
        <Link
          to="/profile"
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-all group"
        >
          <div className="w-7 h-7 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center">
            <span className="text-xs font-bold text-brand-700">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors hidden sm:block">
            {user?.name}
          </span>
        </Link>
      </div>
    </header>
  );
}
