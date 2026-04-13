import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { Loader2, Users, MapPin, Building2, Search } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Distributor {
  id: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  organisation: string | null;
  avatar_url: string | null;
  region: string | null;
  distribution_capacity: string | null;
}

export default function DistributorsPage() {
  const navigate = useNavigate();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadDistributors = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("approval_status, user_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile?.approval_status !== "approved") {
        navigate("/auth");
        return;
      }

      // Distributors cannot view this page
      if (profile.user_type === "distributor") {
        navigate("/distributor-dashboard", { replace: true });
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, headline, bio, location, organisation, avatar_url, region, distribution_capacity, user_id, email")
        .eq("user_type", "distributor")
        .eq("approval_status", "approved")
        .order("full_name");

      if (data) {
        const adminEmails = ["dashriday856@gmail.com", "info@codonyx.org"];
        setDistributors(data.filter(d => !adminEmails.includes((d as any).email?.toLowerCase())).map(({ user_id, email, ...rest }) => rest) as Distributor[]);
      }
      setIsLoading(false);
    };

    loadDistributors();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const filtered = useMemo(() => {
    if (!searchQuery) return distributors;
    const q = searchQuery.toLowerCase();
    return distributors.filter(
      (d) =>
        d.full_name.toLowerCase().includes(q) ||
        d.organisation?.toLowerCase().includes(q) ||
        d.location?.toLowerCase().includes(q) ||
        d.headline?.toLowerCase().includes(q)
    );
  }, [distributors, searchQuery]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <DashboardNavbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <BackButton />
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="font-heading text-3xl font-semibold text-foreground flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  Distributor Network
                </h1>
                <p className="text-muted-foreground mt-1">
                  {filtered.length} distributor{filtered.length !== 1 ? "s" : ""} available
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search distributors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">No distributors found</h3>
                <p className="text-muted-foreground">Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((dist) => (
                  <Link key={dist.id} to={`/profile/${dist.id}`}>
                    <Card className="group hover:shadow-lg hover:scale-[1.01] transition-all duration-300 border-divider cursor-pointer bg-background h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14 shrink-0">
                            <AvatarImage src={dist.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(dist.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-heading text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                              {dist.full_name}
                            </h3>
                            {dist.headline && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{dist.headline}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {dist.organisation && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Building2 className="h-3 w-3" />
                                  {dist.organisation}
                                </span>
                              )}
                              {dist.location && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {dist.location}
                                </span>
                              )}
                            </div>
                            {dist.region && (
                              <Badge variant="outline" className="mt-2 text-xs">{dist.region}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
