import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdvisorsPage = lazy(() => import("./pages/AdvisorsPage"));
const LaboratoriesPage = lazy(() => import("./pages/LaboratoriesPage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const ProfileDetailPage = lazy(() => import("./pages/ProfileDetailPage"));
const ConnectionsPage = lazy(() => import("./pages/ConnectionsPage"));
const PublicationsPage = lazy(() => import("./pages/PublicationsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const InvestmentsPage = lazy(() => import("./pages/InvestmentsPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const TechnologyPage = lazy(() => import("./pages/TechnologyPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsConditionsPage = lazy(() => import("./pages/TermsConditionsPage"));
const BecomeAdvisorPage = lazy(() => import("./pages/BecomeAdvisorPage"));
const RegisterLaboratoryPage = lazy(() => import("./pages/RegisterLaboratoryPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const RegisterDistributorPage = lazy(() => import("./pages/RegisterDistributorPage"));
const DistributorDashboard = lazy(() => import("./pages/DistributorDashboard"));
const DistributorsPage = lazy(() => import("./pages/DistributorsPage"));
const RegisterLaboratoryLandingPage = lazy(() => import("./pages/RegisterLaboratoryLandingPage"));
const DistributorLandingPage = lazy(() => import("./pages/DistributorLandingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes before data is considered stale
      gcTime: 10 * 60 * 1000,         // 10 minutes garbage collection
      retry: 2,                        // Retry failed queries twice
      refetchOnWindowFocus: false,     // Don't refetch on tab switch
    },
  },
});

const BUFFER_RECOVERY_KEY = "page_buffer_recovery_once";

const PageLoader = () => {
  useEffect(() => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const stored = sessionStorage.getItem(BUFFER_RECOVERY_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { path: string; timestamp: number; count: number };
        const isSamePath = parsed.path === currentPath;
        const isRecent = Date.now() - parsed.timestamp < 5 * 60 * 1000;
        // If we already reloaded for this path, don't do it again
        if (isSamePath && isRecent) return;
      } catch {
        sessionStorage.removeItem(BUFFER_RECOVERY_KEY);
      }
    }

    // Auto-refresh after 3.5 seconds if page is stuck loading
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(
        BUFFER_RECOVERY_KEY,
        JSON.stringify({ path: currentPath, timestamp: Date.now(), count: 1 })
      );
      window.location.reload();
    }, 3500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const stored = sessionStorage.getItem(BUFFER_RECOVERY_KEY);
      if (!stored) return;

      try {
        const parsed = JSON.parse(stored) as { path: string; timestamp: number };
        if (parsed.path === currentPath) {
          sessionStorage.removeItem(BUFFER_RECOVERY_KEY);
        }
      } catch {
        sessionStorage.removeItem(BUFFER_RECOVERY_KEY);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/~oauth/*" element={<AuthPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/advisors" element={<AdvisorsPage />} />
                <Route path="/laboratories" element={<LaboratoriesPage />} />
                <Route path="/edit-profile" element={<EditProfilePage />} />
                <Route path="/connections" element={<ConnectionsPage />} />
                <Route path="/publications" element={<PublicationsPage />} />
                <Route path="/profile/:id" element={<ProfileDetailPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/investments" element={<InvestmentsPage />} />
                <Route path="/product" element={<ProductPage />} />
                <Route path="/technology" element={<TechnologyPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsConditionsPage />} />
                <Route path="/become-advisor" element={<BecomeAdvisorPage />} />
                <Route path="/register-laboratory" element={<RegisterLaboratoryPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/register-distributor" element={<RegisterDistributorPage />} />
                <Route path="/distributor-dashboard" element={<DistributorDashboard />} />
                <Route path="/distributors" element={<DistributorsPage />} />
                <Route path="/laboratory-info" element={<RegisterLaboratoryLandingPage />} />
                <Route path="/distributor-info" element={<DistributorLandingPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
