import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Building2, ArrowRight, Pencil, FileText, BookOpen, Truck } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccountGuard } from "@/hooks/useAccountGuard";
import { useAuthReady } from "@/hooks/useAuthReady";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { fetchOwnProfile } from "@/lib/auth";

interface Profile {
  full_name: string;
  email: string;
  user_type: "advisor" | "laboratory" | "distributor";
  organisation: string | null;
  approval_status: "pending" | "approved" | "rejected" | "deactivated";
  headline: string | null;
  avatar_url: string | null;
}

const quickLinks = {
  advisor: [
    {
      to: "/laboratories",
      icon: Building2,
      title: "Laboratory Network",
      description: "Browse and connect with laboratories",
      gradient: "from-emerald-500/20 to-teal-500/10",
      hoverGradient: "group-hover:from-emerald-500/30 group-hover:to-teal-500/20",
      tourId: "quick-network",
    },
    {
      to: "/distributors",
      icon: Truck,
      title: "Distributor Network",
      description: "Browse distributor profiles",
      gradient: "from-cyan-500/20 to-sky-500/10",
      hoverGradient: "group-hover:from-cyan-500/30 group-hover:to-sky-500/20",
      tourId: "quick-distributors",
    },
    {
      to: "/edit-profile",
      icon: Pencil,
      title: "Edit Profile",
      description: "Update your professional details",
      gradient: "from-primary/20 to-primary/5",
      hoverGradient: "group-hover:from-primary/30 group-hover:to-primary/10",
      tourId: "quick-edit-profile",
    },
    {
      to: "/connections",
      icon: Users,
      title: "My Connections",
      description: "Manage your network connections",
      gradient: "from-violet-500/20 to-purple-500/10",
      hoverGradient: "group-hover:from-violet-500/30 group-hover:to-purple-500/20",
      tourId: "quick-connections",
    },
    {
      to: "/publications",
      icon: FileText,
      title: "Publications",
      description: "Share and manage your publications",
      gradient: "from-amber-500/20 to-orange-500/10",
      hoverGradient: "group-hover:from-amber-500/30 group-hover:to-orange-500/20",
      tourId: "quick-publications",
    },
  ],
  laboratory: [
    {
      to: "/advisors",
      icon: Users,
      title: "Advisor Network",
      description: "Browse and connect with advisors",
      gradient: "from-blue-500/20 to-indigo-500/10",
      hoverGradient: "group-hover:from-blue-500/30 group-hover:to-indigo-500/20",
      tourId: "quick-network",
    },
    {
      to: "/distributors",
      icon: Truck,
      title: "Distributor Network",
      description: "Browse distributor profiles",
      gradient: "from-cyan-500/20 to-sky-500/10",
      hoverGradient: "group-hover:from-cyan-500/30 group-hover:to-sky-500/20",
      tourId: "quick-distributors",
    },
    {
      to: "/edit-profile",
      icon: Pencil,
      title: "Edit Profile",
      description: "Update your organisation details",
      gradient: "from-primary/20 to-primary/5",
      hoverGradient: "group-hover:from-primary/30 group-hover:to-primary/10",
      tourId: "quick-edit-profile",
    },
    {
      to: "/connections",
      icon: Users,
      title: "My Connections",
      description: "Manage your network connections",
      gradient: "from-violet-500/20 to-purple-500/10",
      hoverGradient: "group-hover:from-violet-500/30 group-hover:to-purple-500/20",
      tourId: "quick-connections",
    },
    {
      to: "/publications",
      icon: FileText,
      title: "Publications",
      description: "Share and manage your publications",
      gradient: "from-amber-500/20 to-orange-500/10",
      hoverGradient: "group-hover:from-amber-500/30 group-hover:to-orange-500/20",
      tourId: "quick-publications",
    },
  ],
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isReady, user } = useAuthReady();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasChecked = useRef(false);
  useAccountGuard();

  useEffect(() => {
    if (!isReady || !user || hasChecked.current) return;

    if (hasChecked.current) return;
    hasChecked.current = true;

    const loadProfile = async (userId: string) => {
      const { data: profileData } = await fetchOwnProfile<Profile>(
        userId,
        "full_name, email, user_type, organisation, approval_status, headline, avatar_url",
        2
      );

      if (!profileData || profileData.approval_status !== "approved") {
        await supabase.auth.signOut({ scope: "local" });
        navigate("/auth", { replace: true });
        return;
      }

      if (profileData.user_type === "distributor") {
        navigate("/distributor-dashboard", { replace: true });
        return;
      }

      setProfile(profileData);
      setIsLoading(false);
    };

    void loadProfile(user.id);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth", { replace: true });
      }
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        void loadProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isReady, navigate, user]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [isReady, navigate, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const links = profile?.user_type === "advisor" ? quickLinks.advisor : quickLinks.laboratory;
  const firstName = profile?.full_name?.split(" ")[0];
  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-muted">
      <DashboardNavbar />
      <OnboardingTour />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <BackButton />
          <div className="max-w-5xl mx-auto">
            {/* Welcome Section */}
            <div className="relative bg-gradient-to-br from-primary/8 via-background to-primary/5 rounded-3xl p-6 sm:p-8 md:p-10 mb-8 border border-divider overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

              <div className="relative z-10">
                <p className="text-muted-foreground text-sm sm:text-base mb-1">{greeting}</p>
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground mb-3">
                  Welcome back, {firstName}!
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm sm:text-base">
                  <span>You're logged in as</span>
                  <Badge variant="outline" className="capitalize font-medium text-primary border-primary/30 bg-primary/5 text-sm px-3 py-0.5">
                    {profile?.user_type}
                  </Badge>
                  {profile?.organisation && (
                    <span className="text-foreground font-medium">at {profile.organisation}</span>
                  )}
                </div>
                {profile?.headline && (
                  <p className="text-muted-foreground text-sm mt-2 italic">"{profile.headline}"</p>
                )}
              </div>
            </div>

            {/* Quick Actions Title */}
            <div className="flex items-center gap-2 mb-4 px-1">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-semibold text-foreground">Quick Actions</h2>
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {links.map((link) => (
                <Link key={link.to} to={link.to}>
                  <Card data-tour={link.tourId} className="group hover:shadow-lg hover:scale-[1.01] transition-all duration-300 border-divider cursor-pointer bg-background overflow-hidden h-full">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4 p-5">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${link.gradient} ${link.hoverGradient} flex items-center justify-center transition-all duration-300 shrink-0`}>
                          <link.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors truncate">
                            {link.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {link.description}
                          </p>
                        </div>
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning ☀️";
  if (hour < 17) return "Good afternoon 🌤️";
  return "Good evening 🌙";
}
