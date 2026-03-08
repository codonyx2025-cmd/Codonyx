import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { PhilosophySection } from "@/components/home/PhilosophySection";

import { IndustryTrustSection } from "@/components/home/IndustryTrustSection";

// Prefetch key routes after home page loads for instant navigation
const prefetchRoutes = () => {
  const routes = [
    () => import("./ServicesPage"),
    () => import("./TechnologyPage"),
    () => import("./AboutPage"),
    () => import("./ContactPage"),
    () => import("./AuthPage"),
    () => import("./AdvisorsPage"),
    () => import("./DashboardPage"),
    () => import("./ProductPage"),
    () => import("./InvestmentsPage"),
  ];
  routes.forEach((load) => load());
};

const Index = () => {
  useEffect(() => {
    // Prefetch after initial render + idle time
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
