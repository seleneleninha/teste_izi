
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardLayout, PublicLayout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './components/ThemeContext';
import { AuthProvider } from './components/AuthContext';
import React, { lazy, Suspense } from 'react';
import { ScrollToTop } from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy‑loaded page components
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const PropertiesList = lazy(() => import('./pages/PropertiesList').then(module => ({ default: module.PropertiesList })));
const PropertyDetails = lazy(() => import('./pages/PropertyDetails').then(module => ({ default: module.PropertyDetails })));
const AddProperty = lazy(() => import('./pages/AddProperty'));
const PublicHome = lazy(() => import('./pages/PublicHome').then(module => ({ default: module.PublicHome })));
const PartnerPage = lazy(() => import('./pages/PartnerPage').then(module => ({ default: module.PartnerPage })));
const AdminPlans = lazy(() => import('./pages/admin/AdminPlans').then(module => ({ default: module.AdminPlans })));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons').then(module => ({ default: module.AdminCoupons })));
const AdminFinancial = lazy(() => import('./pages/admin/AdminFinancial').then(module => ({ default: module.AdminFinancial })));
const AdminTrialSettings = lazy(() => import('./pages/admin/AdminTrialSettings').then(module => ({ default: module.AdminTrialSettings })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const AgentProfile = lazy(() => import('./pages/AgentProfile').then(module => ({ default: module.AgentProfile })));
const PropertyComparison = lazy(() => import('./pages/PropertyComparison').then(module => ({ default: module.PropertyComparison })));
const Leads = lazy(() => import('./pages/Leads').then(module => ({ default: module.Leads })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const AdminApprovals = lazy(() => import('./pages/admin/AdminApprovals').then(module => ({ default: module.AdminApprovals })));
const BrokerPage = lazy(() => import('./pages/BrokerPage').then(module => ({ default: module.BrokerPage })));
const PartnerProperties = lazy(() => import('./pages/PartnerProperties').then(module => ({ default: module.PartnerProperties })));
const BrokerSearchPage = lazy(() => import('./pages/BrokerSearchPage').then(module => ({ default: module.BrokerSearchPage })));
const BrokerAboutPage = lazy(() => import('./pages/BrokerAboutPage').then(module => ({ default: module.BrokerAboutPage })));
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const Favorites = lazy(() => import('./pages/Favorites').then(module => ({ default: module.Favorites })));

const AvailabilityCheck = lazy(() => import('./pages/AvailabilityCheck').then(module => ({ default: module.AvailabilityCheck })));


import { ToastProvider } from './components/ToastContext';
import { MagicVerification } from './pages/MagicVerification';
import { LoadingFallback } from './components/LoadingFallback';

const App: React.FC = () => {
  // ✅ Preload critical routes on idle
  React.useEffect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload most visited pages
        import('./pages/PropertiesList');
        import('./pages/PropertyDetails');
        import('./pages/Dashboard');
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        import('./pages/PropertiesList');
        import('./pages/PropertyDetails');
        import('./pages/Dashboard');
      }, 2000);
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <ScrollToTop />
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public Routes - Ordem importa! Mais específico primeiro */}
                  <Route element={<PublicLayout />}>
                    {/* Home */}
                    <Route path="/" element={<PublicHome />} />

                    {/* Páginas fixas (específicas) */}
                    <Route path="/search" element={<PropertiesList />} />
                    <Route path="/buscar" element={<PropertiesList />} />
                    <Route path="/partner" element={<PartnerPage />} />
                    <Route path="/sell" element={<PartnerPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/favoritos" element={<Favorites />} />

                    {/* Magic Link Verification */}
                    <Route path="/v/:token" element={<MagicVerification />} />

                    {/* Agent Profile */}
                    <Route path="/agent/:id" element={<AgentProfile />} />

                    {/* Imóveis - Prefixo /imovel */}
                    <Route path="/imovel/:slug" element={<PropertyDetails />} />

                    {/* Corretor - Páginas específicas com slug */}
                    <Route path="/:slug/imovel/:propertySlug" element={<PropertyDetails />} />
                    <Route path="/:slug/buscar" element={<BrokerSearchPage />} />
                    <Route path="/:slug/sobre" element={<BrokerAboutPage />} />

                    {/* Corretor - Página Principal (último, pega qualquer slug) */}
                    <Route path="/:slug" element={<BrokerPage />} />
                  </Route>

                  {/* Protected Routes - Require Authentication */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/availability/:id" element={<AvailabilityCheck />} />
                    <Route element={<DashboardLayout />}>
                      <Route path="/admin/approvals" element={<AdminApprovals />} />
                      <Route path="/admin/plans" element={<AdminPlans />} />
                      <Route path="/admin/coupons" element={<AdminCoupons />} />
                      <Route path="/admin/financial" element={<AdminFinancial />} />
                      <Route path="/admin/trial-settings" element={<AdminTrialSettings />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/properties" element={<PropertiesList />} />
                      <Route path="/properties/:slug" element={<PropertyDetails />} />
                      <Route path="/add-property" element={<AddProperty />} />
                      <Route path="/partner-properties" element={<PartnerProperties />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/compare" element={<PropertyComparison />} />
                      <Route path="/leads" element={<Leads />} />
                      <Route path="/favorites" element={<Favorites />} />
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
