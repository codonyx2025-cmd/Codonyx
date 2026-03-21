import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, MapPin, Mail, Phone, Building2, GraduationCap, Briefcase, Globe, Users, Calendar, Beaker, Wrench, Linkedin, Clock, FileText, Truck } from "lucide-react";
import { format } from "date-fns";

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  contact_number: string | null;
  organisation: string | null;
  user_type: "advisor" | "laboratory" | "distributor";
  created_at: string;
  location: string | null;
  headline: string | null;
  bio: string | null;
  approval_status: "pending" | "approved" | "rejected" | "deactivated";
  avatar_url: string | null;
  company_type: string | null;
  linkedin_url: string | null;
  education: string | null;
  expertise: string | null;
  experience: string | null;
  mentoring_areas: string | null;
  languages: string | null;
  industry_expertise: string | null;
  company_size: string | null;
  founded_year: number | null;
  website_url: string | null;
  services: string | null;
  research_areas: string | null;
  region: string | null;
  distribution_capacity: string | null;
  years_of_experience: number | null;
  verification_document_url: string | null;
}

interface PendingUserDetailModalProps {
  user: PendingUser | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (userId: string, profileId: string) => void;
  onReject: (userId: string, profileId: string) => void;
  isProcessing: boolean;
}

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

export function PendingUserDetailModal({ 
  user, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject, 
  isProcessing 
}: PendingUserDetailModalProps) {
  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

  const isAdvisor = user.user_type === "advisor";
  const isLaboratory = user.user_type === "laboratory";
  const isDistributor = user.user_type === "distributor";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review Registration
            <Badge 
              variant={isAdvisor ? "default" : "secondary"}
              className="capitalize"
            >
              {user.user_type}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-muted rounded-xl p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h2 className="font-heading text-2xl font-semibold text-foreground">
                  {user.full_name}
                </h2>
                {user.headline && (
                  <p className="text-lg text-primary font-medium mt-1">
                    {user.headline}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                  {user.location && (
                    <span className="flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4" />
                      {user.location}
                    </span>
                  )}
                  {user.organisation && (
                    <span className="flex items-center gap-1 text-sm">
                      <Building2 className="h-4 w-4" />
                      {user.organisation}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    Applied: {format(new Date(user.created_at), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-divider">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              {user.contact_number && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {user.contact_number}
                </div>
              )}
              {isLaboratory && user.website_url && (
                <a 
                  href={user.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
            </div>
            
            {/* LinkedIn Button */}
            {user.linkedin_url && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => window.open(user.linkedin_url!, '_blank')}
                  className="gap-2 w-full"
                >
                  <Linkedin className="h-4 w-4" />
                  View LinkedIn Profile
                </Button>
              </div>
            )}
          </div>

          {/* Bio Section */}
          {user.bio && (
            <div className="bg-muted rounded-xl p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">About</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {user.bio}
              </p>
            </div>
          )}

          {/* Advisor Details */}
          {isAdvisor && (
            <div className="bg-muted rounded-xl p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Professional Details</h3>
              
              <div className="grid gap-4">
                {user.experience && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Experience</p>
                      {renderTags(user.experience)}
                    </div>
                  </div>
                )}

                {user.expertise && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Deep Areas of Expertise</p>
                      {renderTags(user.expertise)}
                    </div>
                  </div>
                )}

                {user.mentoring_areas && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Functional Areas for Mentoring</p>
                      {renderTags(user.mentoring_areas)}
                    </div>
                  </div>
                )}

                {user.industry_expertise && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Industry Expertise</p>
                      {renderTags(user.industry_expertise)}
                    </div>
                  </div>
                )}

                {user.languages && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Languages</p>
                      {renderTags(user.languages)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Laboratory Details */}
          {isLaboratory && (
            <div className="bg-muted rounded-xl p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Company Details</h3>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user.company_type && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Company Type</p>
                        <p className="font-medium text-foreground">{user.company_type}</p>
                      </div>
                    </div>
                  )}

                  {user.company_size && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Team Size</p>
                        <p className="font-medium text-foreground">{user.company_size}</p>
                      </div>
                    </div>
                  )}

                  {user.founded_year && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Founded</p>
                        <p className="font-medium text-foreground">{user.founded_year}</p>
                      </div>
                    </div>
                  )}
                </div>

                {user.services && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Wrench className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Services</p>
                      {renderTags(user.services)}
                    </div>
                  </div>
                )}

                {user.research_areas && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Beaker className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Research Areas</p>
                      {renderTags(user.research_areas)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Distributor Details */}
          {isDistributor && (
            <div className="bg-muted rounded-xl p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Distribution Details</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user.region && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Region</p>
                        <p className="font-medium text-foreground">{user.region}</p>
                      </div>
                    </div>
                  )}
                  {user.distribution_capacity && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Distribution Capacity</p>
                        <p className="font-medium text-foreground">{user.distribution_capacity}</p>
                      </div>
                    </div>
                  )}
                  {user.years_of_experience !== null && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Years of Experience</p>
                        <p className="font-medium text-foreground">{user.years_of_experience}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Verification Document */}
          {user.verification_document_url && (
            <div className="bg-muted rounded-xl p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" /> Verification Document
              </h3>
              <Button
                variant="outline"
                onClick={async () => {
                  const docPath = user.verification_document_url!;
                  // If it's already a full URL (legacy), open directly
                  if (docPath.startsWith('http')) {
                    window.open(docPath, '_blank');
                    return;
                  }
                  // Generate a signed URL for private bucket
                  const { data } = await (await import("@/integrations/supabase/client")).supabase.storage
                    .from("verification-documents")
                    .createSignedUrl(docPath, 300);
                  if (data?.signedUrl) {
                    window.open(data.signedUrl, '_blank');
                  }
                }}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                View Document
              </Button>
            </div>
          )}
          {/* Action Buttons - Only show for pending users */}
          {user.approval_status === "pending" && (
            <div className="flex gap-3 pt-4 border-t border-divider">
              <Button
                onClick={() => onApprove(user.user_id, user.id)}
                disabled={isProcessing}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve Registration
              </Button>
              <Button
                onClick={() => onReject(user.user_id, user.id)}
                disabled={isProcessing}
                variant="destructive"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject Registration
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
