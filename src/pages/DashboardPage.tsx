import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Building2, ArrowRight } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccountGuard } from "@/hooks/useAccountGuard";
interface Profile {
  full_name: string;
  email: string;
  user_type: "advisor" | "laboratory" | "distributor";
  organisation: string | null;
  approval_status: "pending" | "approved" | "rejected" | "deactivated";
}
export default function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasChecked = useRef(false);
  useAccountGuard();

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    

    const loadProfile = async (userId: string) => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, user_type, organisation, approval_status")
        .eq("user_id", userId)
        .maybeSingle();

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

    const checkAuth = async () => {
      // Try getSession first (fast, uses local cache)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        await loadProfile(session.user.id);
        return;
      }

      // Session is null — could be a token refresh in progress.
      // Verify with getUser() which validates the token server-side.
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await loadProfile(user.id);
        return;
      }

      // Truly no valid session — redirect to auth (no signOut to avoid clearing mid-refresh tokens)
      navigate("/auth", { replace: true });
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth", { replace: true });
      }
      // If user just signed in, load profile immediately
      if (event === "SIGNED_IN" && session) {
        loadProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen bg-muted">
      <DashboardNavbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <BackButton />
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section - Enhanced */}
            <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 rounded-3xl p-8 md:p-10 mb-8 border border-divider relative overflow-hidden">
              <div className="absolute top-4 right-4">
                
              </div>
              <div className="relative z-10">
                <h1 className="font-heading text-3xl lg:text-4xl font-semibold text-foreground mb-3">
                  Welcome back, {profile?.full_name?.split(' ')[0]}!
                </h1>
                <p className="text-muted-foreground text-lg flex flex-wrap items-center gap-2">
                  You're logged in as a
                  <Badge variant="outline" className="capitalize font-medium text-primary border-primary/30 bg-primary/5 text-base px-3 py-1">
                    {profile?.user_type}
                  </Badge>
                  {profile?.organisation && <span className="text-foreground">at {profile.organisation}</span>}
                </p>
              </div>
            </div>

            {/* Quick Links - Show only relevant section based on user type */}
            <div className="grid grid-cols-1 gap-6">
              {profile?.user_type === "advisor" ? (
                <Link to="/laboratories">
                  <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-divider cursor-pointer bg-background overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-5 p-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
                          <Building2 className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-heading text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                            Laboratory Network
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Browse and connect with laboratories
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Link to="/advisors">
                  <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-divider cursor-pointer bg-background overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-5 p-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
                          <Users className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-heading text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                            Advisor Network
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Browse and connect with advisors
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
}