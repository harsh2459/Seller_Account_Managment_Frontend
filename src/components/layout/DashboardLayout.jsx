import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // Shell: full-height column
    <div className="flex flex-col h-screen overflow-hidden bg-white">

      {/* Dark top bar — spans full width (sidebar + content) */}
      <Header onMobileMenuOpen={() => setMobileOpen(true)} />

      {/* Below top bar: white sidebar + white content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <main className="flex-1 overflow-y-auto bg-white">
          <motion.div
            className="px-8 py-6"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
