import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Store, ShieldCheck,
  ShoppingBag, ShoppingCart, Package,
  ClipboardList, ChevronRight, X, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

// ── Nav structure ──────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { id: 'sellers',   icon: Store,           label: 'Sellers',   to: '/sellers'   },
  {
    id: 'orders',
    icon: ClipboardList,
    label: 'Orders',
    children: [
      { label: 'Amazon',   to: '/orders/amazon',   icon: ShoppingCart },
      { label: 'Flipkart', to: '/orders/flipkart',  icon: ShoppingBag  },
      { label: 'Meesho',   to: '/orders/meesho',    icon: Package      },
    ],
  },
];

const ADMIN_ITEMS = [
  { id: 'admins', icon: ShieldCheck, label: 'Admins', to: '/admins' },
];

// ── Style helpers ─────────────────────────────────────────────

const itemCls = (isActive) =>
  cn(
    'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium w-full text-left transition-colors duration-100',
    isActive
      ? 'bg-brand-500 text-white'
      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
  );

const subItemCls = (isActive) =>
  cn(
    'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[12px] font-medium w-full transition-colors duration-100',
    isActive
      ? 'bg-brand-500 text-white'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
  );

// ── Section label ─────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

// ── Nav item (with optional accordion) ───────────────────────

function NavItem({ item, onNav }) {
  const location = useLocation();
  const hasChildren = Boolean(item.children);
  const isParentActive = hasChildren
    ? item.children.some((c) => location.pathname.startsWith(c.to))
    : location.pathname === item.to || location.pathname.startsWith(item.to + '/');

  const [open, setOpen] = useState(isParentActive);

  if (!hasChildren) {
    return (
      <NavLink to={item.to} onClick={onNav} className={({ isActive }) => itemCls(isActive)}>
        <item.icon size={15} className="shrink-0" />
        {item.label}
      </NavLink>
    );
  }

  return (
    <>
      <button onClick={() => setOpen((o) => !o)} className={itemCls(isParentActive)}>
        <item.icon size={15} className="shrink-0" />
        <span className="flex-1">{item.label}</span>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight size={13} className="opacity-50" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden ml-3 pl-3 border-l border-slate-200 mt-0.5 space-y-0.5"
          >
            {item.children.map((child) => {
              const isActive = location.pathname.startsWith(child.to);
              const CIcon = child.icon;
              return (
                <NavLink key={child.to} to={child.to} onClick={onNav} className={subItemCls(isActive)}>
                  <CIcon size={13} className="shrink-0" />
                  {child.label}
                </NavLink>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Sidebar content ───────────────────────────────────────────

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile close button */}
      {onClose && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 lg:hidden">
          <span className="text-[13px] font-semibold text-slate-800">Menu</span>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        <SectionLabel>Organization</SectionLabel>
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} onNav={onClose} />
          ))}
        </div>

        {isSuperAdmin && (
          <>
            <SectionLabel>Admin</SectionLabel>
            <div className="space-y-0.5">
              {ADMIN_ITEMS.map((item) => (
                <NavItem key={item.id} item={item} onNav={onClose} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User footer + sign out */}
      <div className="px-2 py-3 border-t border-slate-200 shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md">
          <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-brand-600">
              {user?.name?.[0]?.toUpperCase() ?? 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-slate-700 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────

export function Sidebar({ mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Desktop — 240px white sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-200">
        <SidebarContent />
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.aside
              className="fixed left-0 top-0 h-full z-50 w-60 bg-white border-r border-slate-200 lg:hidden overflow-hidden"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <SidebarContent onClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
