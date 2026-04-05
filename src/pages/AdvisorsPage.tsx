import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { AdvisorCard } from "@/components/advisors/AdvisorCard";
import { AdvisorFilters } from "@/components/advisors/AdvisorFilters";
import { Loader2, Users } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";

interface Advisor {
  id: string;
  full_name: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  organisation: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  education: string | null;
  expertise: string | null;
  mentoring_areas: string | null;
  languages: string | null;
  industry_expertise: string | null;
}

export default function AdvisorsPage() {
  const navigate = useNavigate();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    const checkAuthAndLoadAdvisors = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is approved and get user_type
      const { data: profile } = await supabase
        .from("profiles")
        .select("approval_status, user_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile?.approval_status !== "approved") {
        navigate("/auth");
        return;
      }

      // Advisors cannot view the advisors page (reciprocal model)
      if (profile.user_type === "advisor") {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Load approved advisors with new fields
      const { data: advisorsData } = await supabase
        .from("profiles")
        .select("id, full_name, headline, bio, location, organisation, avatar_url, linkedin_url, education, expertise, mentoring_areas, languages, industry_expertise")
        .eq("user_type", "advisor")
        .eq("approval_status", "approved")
        .order("full_name");

      if (advisorsData) {
        setAdvisors(advisorsData);
      }
      setIsLoading(false);
    };

    checkAuthAndLoadAdvisors();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locations = advisors
      .map((a) => a.location)
      .filter((loc): loc is string => !!loc);
    return [...new Set(locations)].sort();
  }, [advisors]);

  // Filter advisors
  const filteredAdvisors = useMemo(() => {
    return advisors.filter((advisor) => {
      const matchesSearch =
        !searchQuery ||
        advisor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        advisor.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        advisor.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        advisor.organisation?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLocation =
        !locationFilter ||
        locationFilter === "all" ||
        advisor.location === locationFilter;

      return matchesSearch && matchesLocation;
    });
  }, [advisors, searchQuery, locationFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
  };

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
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl lg:text-4xl font-medium text-foreground mb-2">
              Advisor Network
            </h1>
            <p className="text-muted-foreground">
              Connect with verified advisors from around the world
            </p>
          </div>

          {/* Filters */}
          <AdvisorFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            locationFilter={locationFilter}
            onLocationChange={setLocationFilter}
            locations={uniqueLocations}
            onClearFilters={handleClearFilters}
          />

          {/* Results Count */}
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {filteredAdvisors.length} advisor{filteredAdvisors.length !== 1 ? "s" : ""} found
            </span>
          </div>

          {/* Advisor Grid */}
          {filteredAdvisors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAdvisors.map((advisor) => (
                <AdvisorCard
                  key={advisor.id}
                  id={advisor.id}
                  fullName={advisor.full_name}
                  headline={advisor.headline}
                  bio={advisor.bio}
                  location={advisor.location}
                  organisation={advisor.organisation}
                  avatarUrl={advisor.avatar_url}
                  mentoringAreas={advisor.mentoring_areas}
                  linkedinUrl={advisor.linkedin_url}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-display text-lg font-medium text-foreground mb-2">
                No advisors found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}