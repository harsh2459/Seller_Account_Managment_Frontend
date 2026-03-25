import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Store, ShieldCheck,
  LogOut, Zap, ShoppingBag, ShoppingCart,
  Package, ClipboardList, X,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

// ── Nav structure ──────────────────────────────────────────────

const NAV_ITEMS = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    to: '/dashboard',
  },
  {
    id: 'sellers',
    icon: Store,
    label: 'Sellers',
    to: '/sellers',
  },
  {
    id: 'orders',
    icon: ClipboardList,
    label: 'Orders',
    children: [
      { label: 'Amazon',   to: '/orders/amazon',   icon: ShoppingCart, activeClass: 'text-orange-600 bg-orange-50 border-orange-200' },
      { label: 'Flipkart', to: '/orders/flipkart',  icon: ShoppingBag,  activeClass: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
      { label: 'Meesho',   to: '/orders/meesho',    icon: Package,      activeClass: 'text-pink-600 bg-pink-50 border-pink-200' },
    ],
  },
];

const ADMIN_ITEMS = [
  { id: 'admins', icon: ShieldCheck, label: 'Admins', to: '/admins' },
];

// ── Flyout panel (portal) ─────────────────────────────────────

function FlyoutPanel({ anchorEl, item, onEnter, onLeave, onNav }) {
  const location = useLocation();
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (anchorEl) {
      const r = anchorEl.getBoundingClientRect();
      setPos({ top: r.top, left: r.right + 10 });
    }
  }, [anchorEl]);

  if (!pos) return null;

  return createPortal(
    <div
      className="fixed z-[9999]"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <motion.div
        className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden"
        style={{
          boxShadow:
            '0 8px 32px -4px rgb(0 0 0 / 0.12), 0 2px 10px -2px rgb(0 0 0 / 0.07)',
          minWidth: 188,
        }}
        initial={{ opacity: 0, x: -10, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -10, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 520, damping: 32 }}
      >
        {/* Section header */}
        <p className="px-4 pt-3.5 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          {item.label}
        </p>

        {/* Items */}
        <div className="px-2 pb-2 space-y-0.5">
          {item.children ? (
            item.children.map((child) => {
              const isActive = location.pathname.startsWith(child.to);
              const CIcon = child.icon;
              return (
                <NavLink
                  key={child.to}
                  to={child.to}
                  onClick={onNav}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border border-transparent',
                    isActive
                      ? child.activeClass + ' border'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <CIcon size={15} className="shrink-0" />
                  {child.label}
                </NavLink>
              );
            })
          ) : (
            <NavLink
              to={item.to}
              onClick={onNav}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border border-transparent',
                  isActive
                    ? 'bg-brand-50 text-brand-700 border-brand-100 border'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <item.icon size={15} className="shrink-0" />
              {item.label}
            </NavLink>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

// ── Single icon button + flyout ────────────────────────────────

function SidebarIcon({ item }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);

  const show = useCallback(() => {
    clearTimeout(timer.current);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    timer.current = setTimeout(() => setVisible(false), 130);
  }, []);

  const isActive = item.to
    ? location.pathname === item.to || location.pathname.startsWith(item.to + '/')
    : item.children?.some((c) => location.pathname.startsWith(c.to));

  const iconCls = cn(
    'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
    isActive
      ? 'bg-brand-50 text-brand-600 border border-brand-100 shadow-sm'
      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
  );

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={hide} className="relative">
      {item.to ? (
        <NavLink to={item.to} className={iconCls} title={item.label}>
          <item.icon size={19} />
        </NavLink>
      ) : (
        <button className={iconCls} title={item.label}>
          <item.icon size={19} />
        </button>
      )}

      <AnimatePresence>
        {visible && (
          <FlyoutPanel
            anchorEl={ref.current}
            item={item}
            onEnter={show}
            onLeave={hide}
            onNav={() => setVisible(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mobile full nav ────────────────────────────────────────────

const ORDER_PLATFORMS = [
  { label: 'Amazon',   to: '/orders/amazon',   icon: ShoppingCart, active: 'text-orange-600 bg-orange-50 border-orange-200', hover: 'hover:text-orange-600 hover:bg-orange-50' },
  { label: 'Flipkart', to: '/orders/flipkart',  icon: ShoppingBag,  active: 'text-yellow-700 bg-yellow-50 border-yellow-200', hover: 'hover:text-yellow-700 hover:bg-yellow-50' },
  { label: 'Meesho',   to: '/orders/meesho',    icon: Package,      active: 'text-pink-600 bg-pink-50 border-pink-200',       hover: 'hover:text-pink-600 hover:bg-pink-50' },
];

function MobileNav({ onClose }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [ordersOpen, setOrdersOpen] = useState(location.pathname.startsWith('/orders'));

  const linkCls = (isActive) => cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border border-transparent',
    isActive
      ? 'bg-brand-50 text-brand-700 border-brand-100'
      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
  );

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-900 text-sm leading-tight">OmniAdmin</p>
          <p className="text-[10px] text-slate-400">Order Management</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Main</p>

        <NavLink to="/dashboard" onClick={onClose} className={({ isActive }) => linkCls(isActive)}>
          <LayoutDashboard size={17} /> Dashboard
        </NavLink>
        <NavLink to="/sellers" onClick={onClose} className={({ isActive }) => linkCls(isActive)}>
          <Store size={17} /> Sellers
        </NavLink>

        {/* Orders accordion */}
        <button
          onClick={() => setOrdersOpen((o) => !o)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border border-transparent',
            location.pathname.startsWith('/orders')
              ? 'bg-brand-50 text-brand-700 border-brand-100'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          )}
        >
          <ClipboardList size={17} />
          <span className="flex-1 text-left">Orders</span>
          <motion.div animate={{ rotate: ordersOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </motion.div>
        </button>

        <AnimatePresence>
          {ordersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden ml-3 pl-5 border-l border-slate-200 space-y-0.5 mt-1"
            >
              {ORDER_PLATFORMS.map((p) => {
                const PIcon = p.icon;
                return (
                  <NavLink
                    key={p.to}
                    to={p.to}
                    onClick={onClose}
                    className={({ isActive: a }) =>
                      cn(
                        'flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all border border-transparent',
                        a ? p.active + ' border' : 'text-slate-500 ' + p.hover
                      )
                    }
                  >
                    <PIcon size={13} /> {p.label}
                  </NavLink>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {isSuperAdmin && (
          <>
            <p className="px-3 pt-4 pb-1 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Admin</p>
            <NavLink to="/admins" onClick={onClose} className={({ isActive }) => linkCls(isActive)}>
              <ShieldCheck size={17} /> Admins
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 bg-slate-50 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-700">{user?.name?.[0]?.toUpperCase() ?? 'A'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────

export function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <>
      {/* Desktop — always icon strip */}
      <aside className="hidden lg:flex flex-col items-center h-screen sticky top-0 w-[68px] bg-white border-r border-slate-100 shrink-0 py-4 gap-1.5">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm mb-2 shrink-0">
          <Zap size={18} className="text-white" />
        </div>

        <div className="w-5 h-px bg-slate-100 mb-1" />

        {/* Primary nav */}
        {NAV_ITEMS.map((item) => (
          <SidebarIcon key={item.id} item={item} />
        ))}

        {/* Admin nav */}
        {isSuperAdmin && (
          <>
            <div className="w-5 h-px bg-slate-100 my-1" />
            {ADMIN_ITEMS.map((item) => (
              <SidebarIcon key={item.id} item={item} />
            ))}
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-brand-700">
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
          title="Logout"
        >
          <LogOut size={17} />
        </button>
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
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
              <MobileNav onClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
