import { useNavigate } from "react-router-dom";
import { AvatarLightbox } from "@/components/ui/avatar-lightbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";

interface AdvisorCardProps {
  id: string;
  fullName: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  organisation?: string | null;
  avatarUrl?: string | null;
  mentoringAreas?: string | null;
  linkedinUrl?: string | null;
}

export function AdvisorCard({
  id,
  fullName,
  headline,
  bio,
  location,
  organisation,
  avatarUrl,
  mentoringAreas,
  linkedinUrl,
}: AdvisorCardProps) {
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Parse mentoring areas into array
  const mentoringTags = mentoringAreas
    ? mentoringAreas.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const displayTags = mentoringTags.slice(0, 2);
  const remainingCount = mentoringTags.length - 2;

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-divider bg-background">
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {location && (
          <Badge 
            variant="secondary" 
            className="absolute top-3 left-3 z-10 bg-background/95 backdrop-blur-sm text-foreground text-xs font-medium"
          >
            {location}
          </Badge>
        )}
        
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Content Section */}
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground line-clamp-1">
            {fullName}
          </h3>
          {headline && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {headline}
            </p>
          )}
        </div>

        {/* Mentoring Areas Badges */}
        {mentoringTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map((tag, index) => {
              const colors = [
                "bg-teal-400",
                "bg-emerald-400",
                "bg-amber-400",
                "bg-sky-400",
                "bg-rose-400",
                "bg-violet-400",
                "bg-orange-400",
                "bg-lime-400",
              ];
              const colorClass = colors[index % colors.length];
              return (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className={`text-xs font-medium ${colorClass} text-black hover:opacity-90`}
                >
                  {tag}
                </Badge>
              );
            })}
            {remainingCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-muted text-foreground"
              >
                +{remainingCount}
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => navigate(`/profile/${id}`)}
            className="flex-1"
            size="sm"
          >
            View Profile
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              if (linkedinUrl) {
                window.open(linkedinUrl, '_blank');
              }
            }}
            disabled={!linkedinUrl}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
