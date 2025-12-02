
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardLayout, PublicLayout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './components/ThemeContext';
import { AuthProvider } from './components/AuthContext';
import React, { lazy, Suspense } from 'react';

// Lazy‑loaded page components
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const PropertiesList = lazy(() => import('./pages/PropertiesList').then(module => ({ default: module.PropertiesList })));
const PropertyDetails = lazy(() => import('./pages/PropertyDetails').then(module => ({ default: module.PropertyDetails })));
const AddProperty = lazy(() => import('./pages/AddProperty').then(module => ({ default: module.AddProperty })));
const PublicHome = lazy(() => import('./pages/PublicHome').then(module => ({ default: module.PublicHome })));
const PartnerPage = lazy(() => import('./pages/PartnerPage').then(module => ({ default: module.PartnerPage })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const AgentProfile = lazy(() => import('./pages/AgentProfile').then(module => ({ default: module.AgentProfile })));
const PropertyComparison = lazy(() => import('./pages/PropertyComparison').then(module => ({ default: module.PropertyComparison })));
const Leads = lazy(() => import('./pages/Leads').then(module => ({ default: module.Leads })));
const Terms = lazy(() => import('./pages/Terms').then(module => ({ default: module.Terms })));
const Privacy = lazy(() => import('./pages/Privacy').then(module => ({ default: module.Privacy })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const BrokerPage = lazy(() => import('./pages/BrokerPage').then(module => ({ default: module.BrokerPage })));
const PartnerProperties = lazy(() => import('./pages/PartnerProperties').then(module => ({ default: module.PartnerProperties })));


import { ToastProvider } from './components/ToastContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><span className="text-lg">Carregando...</span></div>}>
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<PublicHome />} />
                  <Route path="/search" element={<PropertiesList />} />
                  <Route path="/partner" element={<PartnerPage />} />
                  <Route path="/sell" element={<PartnerPage />} /> {/* Alias for backward compatibility */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/agent/:id" element={<AgentProfile />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  {/* Rota de corretor - precisa vir antes da rota genérica de slug */}
                  <Route path="/corretor/:slug" element={<BrokerPage />} />
                  {/* Rota genérica de slug para imóveis */}
                  <Route path="/:slug" element={<PropertyDetails />} />
                </Route>

                {/* Protected Routes - Require Authentication */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/properties" element={<PropertiesList />} />
                    <Route path="/properties/:slug" element={<PropertyDetails />} />
                    <Route path="/add-property" element={<AddProperty />} />
                    <Route path="/partner-properties" element={<PartnerProperties />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/compare" element={<PropertyComparison />} />
                    <Route path="/leads" element={<Leads />} />
                  </Route>
                </Route>

              </Routes>
            </Suspense>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
