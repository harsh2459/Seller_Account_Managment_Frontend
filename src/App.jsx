import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './routes/PrivateRoute';
import { SuperAdminRoute } from './routes/SuperAdminRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { SetupPage } from './pages/Setup';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { SellersPage } from './pages/Sellers';
import { SellerDetailPage } from './pages/SellerDetail';
import { PlatformOrdersPage } from './pages/PlatformOrders';
import { FlipkartOrdersPage } from './pages/FlipkartOrders';
import { AmazonOrdersPage } from './pages/AmazonOrders';
import { AdminsPage } from './pages/Admins';
import { ProfilePage } from './pages/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/sellers" element={<SellersPage />} />
                <Route path="/sellers/:id" element={<SellerDetailPage />} />
                <Route path="/orders/:platform" element={<PlatformOrdersPage />} />
                <Route path="/orders/flipkart/:sellerId/:accountId" element={<FlipkartOrdersPage />} />
                <Route path="/orders/amazon/:sellerId/:accountId" element={<AmazonOrdersPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Super Admin only */}
                <Route element={<SuperAdminRoute />}>
                  <Route path="/admins" element={<AdminsPage />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#fff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.12)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}