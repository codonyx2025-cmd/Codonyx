import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { PhilosophySection } from "@/components/home/PhilosophySection";
import { IndustryTrustSection } from "@/components/home/IndustryTrustSection";

const prefetchRoutes = () => {
  const routes = [
    () => import("./ServicesPage"),
    () => import("./TechnologyPage"),
    () => import("./AuthPage"),
    () => import("./AdvisorsPage"),
    () => import("./DashboardPage"),
    () => import("./ProductPage"),
    () => import("./InvestmentsPage"),
  ];
  routes.forEach((load) => load());
};

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const navigationEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      const isReload = navigationEntries[0]?.type === "reload";
      const isBackNavigation = navigationEntries[0]?.type === "back_forward";

      if (isBackNavigation) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("approval_status")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (profile?.approval_status === "approved") {
          if (!isReload && !isBackNavigation) {
            navigate("/dashboard", { replace: true });
          }
        }
      }
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(prefetchRoutes);
    } else {
      setTimeout(prefetchRoutes, 2000);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <PhilosophySection />
        <IndustryTrustSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
