import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarLightbox } from "@/components/ui/avatar-lightbox";
import { ConnectButton } from "@/components/connections/ConnectButton";
import { ConnectionsSection } from "@/components/connections/ConnectionsSection";
import { ProfilePublications } from "@/components/publications/ProfilePublications";
import { ProfileCustomFieldsDisplay } from "@/components/profile/ProfileCustomFieldsDisplay";
import { 
  Loader2, 
  ArrowLeft, 
  MapPin, 
  Linkedin, 
  Mail, 
  Phone, 
  Building2, 
  GraduationCap,
  Briefcase,
  Globe,
  Users,
  Calendar,
  Beaker,
  Wrench,
  BookOpen,
  Pencil
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  organisation: string | null;
  contact_number: string | null;
  avatar_url: string | null;
  user_type: "advisor" | "laboratory" | "distributor";
  created_at: string;
  linkedin_url: string | null;
  education: string | null;
  expertise: string | null;
  experience: string | null;
  mentoring_areas: string | null;
  languages: string | null;
  industry_expertise: string | null;
  company_type: string | null;
  company_size: string | null;
  founded_year: number | null;
  website_url: string | null;
  services: string | null;
  research_areas: string | null;
}

interface CurrentUserProfile {
  id: string;
  user_type: "advisor" | "laboratory";
}

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const loadAttempted = useRef(false);

  // Anti-loop: reload after 3s if still loading
  useEffect(() => {
    if (!isLoading) return;
    const RECOVERY_KEY = "profile_detail_recovery";
    const stored = sessionStorage.getItem(RECOVERY_KEY);
    const currentPath = window.location.pathname;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.path === currentPath && Date.now() - parsed.timestamp < 60000) {
          // Already reloaded recently — don't loop
          return;
        }
      } catch { /* ignore */ }
    }

    const timer = setTimeout(() => {
      sessionStorage.setItem(RECOVERY_KEY, JSON.stringify({ path: currentPath, timestamp: Date.now() }));
      window.location.reload();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Reset load state when id changes
  useEffect(() => {
    loadAttempted.current = false;
    setIsLoading(true);
    setProfile(null);
  }, [id]);

  useEffect(() => {
    if (loadAttempted.current) return;
    loadAttempted.current = true;

    const loadProfile = async () => {
      if (!id) return;

      // Try session first, fall back to getUser for token refresh scenarios
      let userId: string | null = null;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        userId = session.user.id;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }
        userId = user.id;
      }

      // Get current user's profile
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("id, user_type")
        .eq("user_id", userId)
        .maybeSingle();

      if (currentProfile) {
        setCurrentUserProfile(currentProfile as CurrentUserProfile);
        setIsOwnProfile(currentProfile.id === id);
      }

      // Get the profile being viewed
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        navigate(-1);
        return;
      }

      setProfile(data as Profile);
      setIsLoading(false);
    };

    loadProfile();
  }, [id, navigate]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const tagColors = [
    "bg-teal-400",
    "bg-emerald-400",
    "bg-amber-400",
    "bg-sky-400",
    "bg-rose-400",
    "bg-violet-400",
    "bg-orange-400",
    "bg-lime-400",
  ];

  const renderTags = (value: string | null) => {
    if (!value) return null;
    const tags = value.split(",").map(t => t.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className={`${tagColors[index % tagColors.length]} text-black font-medium hover:opacity-90`}
          >
            {tag}
          </Badge>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const isAdvisor = profile.user_type === "advisor";
  const isLaboratory = profile.user_type === "laboratory";

  return (
    <div className="min-h-screen bg-muted">
      <DashboardNavbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {/* Profile Header */}
            <div className="bg-background rounded-2xl border border-divider overflow-hidden">
              {/* Cover / Header Section */}
              <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />
              
              <div className="px-8 pb-8">
                {/* Avatar & Basic Info */}
                <div className="flex flex-col md:flex-row gap-6 -mt-16">
                  <AvatarLightbox
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    fallback={getInitials(profile.full_name)}
                    className="h-32 w-32 border-4 border-background shadow-lg"
                    fallbackClassName="text-4xl bg-primary text-primary-foreground"
                  />

                  <div className="flex-1 pt-4 md:pt-16">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h1 className="font-heading text-3xl font-semibold text-foreground">
                          {profile.full_name}
                        </h1>
                        {profile.headline && (
                          <p className="text-lg text-primary font-medium mt-1">
                            {profile.headline}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                          {profile.location && (
                            <span className="flex items-center gap-1 text-sm">
                              <MapPin className="h-4 w-4" />
                              {profile.location}
                            </span>
                          )}
                          {profile.organisation && (
                            <span className="flex items-center gap-1 text-sm">
                              <Building2 className="h-4 w-4" />
                              {profile.organisation}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* Edit Profile Button - only show on own profile */}
                        {isOwnProfile && (
                          <Button
                            variant="outline"
                            asChild
                            className="gap-2"
                          >
                            <Link to="/edit-profile">
                              <Pencil className="h-4 w-4" />
                              Edit Profile
                            </Link>
                          </Button>
                        )}

                        {/* Connect Button - only show if not own profile */}
                        {!isOwnProfile && currentUserProfile && (
                          <ConnectButton
                            currentProfileId={currentUserProfile.id}
                            targetProfileId={profile.id}
                          />
                        )}
                        
                        {/* LinkedIn Button */}
                        {profile.linkedin_url && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(profile.linkedin_url!, '_blank')}
                            className="gap-2"
                          >
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-divider overflow-hidden">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  {profile.contact_number && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {profile.contact_number}
                    </div>
                  )}
                  {isLaboratory && profile.website_url && (
                    <a 
                      href={profile.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {profile.bio && (
              <div className="bg-background rounded-2xl border border-divider p-8 mt-6">
                <h2 className="font-heading text-xl font-semibold text-foreground mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Advisor Details */}
            {isAdvisor && (
              <div className="bg-background rounded-2xl border border-divider p-8 mt-6">
                <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Professional Details</h2>
                
                <div className="grid gap-6">
                  {profile.education && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Education Institute</p>
                        {renderTags(profile.education)}
                      </div>
                    </div>
                  )}

                  {profile.experience && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Experience</p>
                        {renderTags(profile.experience)}
                      </div>
                    </div>
                  )}

                  {profile.expertise && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Deep Areas of Expertise</p>
                        {renderTags(profile.expertise)}
                      </div>
                    </div>
                  )}

                  {profile.mentoring_areas && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Functional Areas for Mentoring</p>
                        {renderTags(profile.mentoring_areas)}
                      </div>
                    </div>
                  )}

                  {profile.industry_expertise && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Industry Expertise</p>
                        {renderTags(profile.industry_expertise)}
                      </div>
                    </div>
                  )}

                  {profile.languages && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Languages</p>
                        {renderTags(profile.languages)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Laboratory Details */}
            {isLaboratory && (
              <div className="bg-background rounded-2xl border border-divider p-8 mt-6">
                <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Company Details</h2>
                
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {profile.company_type && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Company Type</p>
                          <p className="font-medium text-foreground">{profile.company_type}</p>
                        </div>
                      </div>
                    )}

                    {profile.company_size && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Team Size</p>
                          <p className="font-medium text-foreground">{profile.company_size}</p>
                        </div>
                      </div>
                    )}

                    {profile.founded_year && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Founded</p>
                          <p className="font-medium text-foreground">{profile.founded_year}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {profile.services && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Wrench className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Services</p>
                        {renderTags(profile.services)}
                      </div>
                    </div>
                  )}

                  {profile.research_areas && (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Beaker className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Research Areas</p>
                        {renderTags(profile.research_areas)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin-defined Custom Fields */}
            <ProfileCustomFieldsDisplay profileId={profile.id} userType={profile.user_type} />

            {/* Publications Section */}
            <ProfilePublications profileId={profile.id} />

            {/* Connections Section - only show on own profile */}
            {isOwnProfile && currentUserProfile && (
              <div className="mt-6">
                <ConnectionsSection
                  currentProfileId={currentUserProfile.id}
                  userType={currentUserProfile.user_type}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
