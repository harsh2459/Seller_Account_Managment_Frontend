import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/sellers':   'Sellers',
  '/accounts':  'Platform Accounts',
  '/admins':    'Admin Management',
  '/profile':   'My Profile',
  '/orders/amazon':   'Amazon Orders',
  '/orders/flipkart': 'Flipkart Orders',
  '/orders/meesho':   'Meesho Orders',
};

export function Header({ onMobileMenuOpen }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const page = TITLES[pathname] ?? 'OmniAdmin';

  return (
    // Dark full-width top bar — spans sidebar + content
    <header className="h-11 flex items-center gap-3 px-4 bg-[#1C1828] shrink-0">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-1 rounded text-white/50 hover:text-white/90 transition-colors"
      >
        <Menu size={16} />
      </button>

      {/* Breadcrumb: OmniAdmin ◇ Page */}
      <div className="flex items-center gap-1.5 flex-1">
        <Link to="/dashboard" className="text-[13px] font-medium text-white/70 hover:text-white transition-colors">
          OmniAdmin
        </Link>
        <ChevronRight size={12} className="text-white/30" />
        <span className="text-[13px] font-medium text-white/90">{page}</span>
      </div>

      {/* Right: user + logout */}
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          className="flex items-center gap-2 text-[12px] text-white/60 hover:text-white/90 transition-colors"
        >
          <div className="w-5 h-5 rounded-full bg-brand-500/50 border border-brand-500/60 flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <span className="hidden sm:block">{user?.name}</span>
        </Link>
      </div>
    </header>
  );
}
