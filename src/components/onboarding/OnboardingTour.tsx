import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, ArrowLeft, Pencil, Users, FileText, CheckCircle, Sparkles, Building2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface TourStep {
  title: string;
  description: string;
  targetSelector?: string;
  icon: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function OnboardingTour() {
  const navigate = useNavigate();
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [arrowDirection, setArrowDirection] = useState<"top" | "bottom">("top");
  const [userType, setUserType] = useState<string>("advisor");
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps: TourStep[] = useMemo(() => {
    if (userType === "distributor") {
      return [
        {
          title: "Welcome to Codonyx! 👋",
          description: "Let's get you set up as a Distribution Partner. We'll walk you through the key features.",
          icon: <Sparkles className="h-7 w-7" />,
        },
        {
          title: "Complete Your Profile",
          description: "Add your business details, distribution capacity, and contact info to build trust with partners.",
          targetSelector: '[data-tour="quick-edit-profile"]',
          icon: <Pencil className="h-7 w-7" />,
          action: () => navigate("/edit-profile"),
          actionLabel: "Edit Profile",
          position: "top",
        },
        {
          title: "Browse Networks",
          description: "Explore advisor and laboratory profiles to find collaboration opportunities.",
          targetSelector: '[data-tour="quick-network"]',
          icon: <Users className="h-7 w-7" />,
          action: () => navigate("/advisors"),
          actionLabel: "View Network",
          position: "top",
        },
        {
          title: "Deals & Bids",
          description: "Access exclusive deals published by Codonyx. Place bids and track your commitments.",
          targetSelector: '[data-tour="quick-deals"]',
          icon: <Briefcase className="h-7 w-7" />,
          position: "top",
        },
        {
          title: "You're All Set! 🎉",
          description: "Start by completing your profile — it helps build credibility. You can explore deals and networks from the dashboard.",
          icon: <CheckCircle className="h-7 w-7" />,
          action: () => navigate("/edit-profile"),
          actionLabel: "Complete My Profile",
        },
      ];
    }

    return [
      {
        title: "Welcome to Codonyx! 👋",
        description: "Let's get you set up quickly. We'll walk you through the key features.",
        icon: <Sparkles className="h-7 w-7" />,
      },
      {
        title: "Complete Your Profile",
        description: "A complete profile helps others find and connect with you. Add your headline, bio, and details.",
        targetSelector: '[data-tour="quick-edit-profile"]',
        icon: <Pencil className="h-7 w-7" />,
        action: () => navigate("/edit-profile"),
        actionLabel: "Edit Profile",
        position: "top",
      },
      {
        title: "Browse the Network",
        description: userType === "advisor"
          ? "Discover laboratories in the network. Browse profiles and find the right match."
          : "Discover advisors in the network. Browse profiles and find the right expertise.",
        targetSelector: '[data-tour="quick-network"]',
        icon: userType === "advisor" ? <Building2 className="h-7 w-7" /> : <Users className="h-7 w-7" />,
        action: () => navigate(userType === "advisor" ? "/laboratories" : "/advisors"),
        actionLabel: userType === "advisor" ? "View Labs" : "View Advisors",
        position: "top",
      },
      {
        title: "Manage Connections",
        description: "Build your network by sending connection requests. Track sent and received requests.",
        targetSelector: '[data-tour="quick-connections"]',
        icon: <Users className="h-7 w-7" />,
        action: () => navigate("/connections"),
        actionLabel: "View Connections",
        position: "top",
      },
      {
        title: "Share Publications",
        description: "Showcase your expertise by uploading research papers and articles.",
        targetSelector: '[data-tour="quick-publications"]',
        icon: <FileText className="h-7 w-7" />,
        action: () => navigate("/publications"),
        actionLabel: "View Publications",
        position: "top",
      },
      {
        title: "You're All Set! 🎉",
        description: "Start by completing your profile — it's the first step to meaningful connections.",
        icon: <CheckCircle className="h-7 w-7" />,
        action: () => navigate("/edit-profile"),
        actionLabel: "Complete My Profile",
      },
    ];
  }, [navigate, userType]);

  useEffect(() => {
    const checkIfShouldShowTour = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const dismissed = localStorage.getItem(`tour_dismissed_${session.user.id}`);
      if (dismissed) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("headline, bio, location, organisation, avatar_url, created_at, updated_at, user_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!profile) return;

      setUserType(profile.user_type);

      const isIncomplete = !profile.headline || !profile.bio || !profile.location;
      const createdAt = new Date(profile.created_at).getTime();
      const updatedAt = new Date(profile.updated_at).getTime();
      const neverEdited = Math.abs(updatedAt - createdAt) < 60000;

      if (isIncomplete || neverEdited) {
        setTimeout(() => setShowTour(true), 800);
      }
    };

    checkIfShouldShowTour();
  }, []);

  const positionTooltip = useCallback(() => {
    const step = steps[currentStep];
    const selector = step.targetSelector;

    if (!selector) {
      setTargetRect(null);
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10002,
      });
      return;
    }

    const el = document.querySelector(selector);
    if (!el) {
      setTargetRect(null);
      setTooltipStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10002,
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    const tooltipWidth = Math.min(360, window.innerWidth - 32);
    const tooltipHeight = 260;
    const gap = 14;
    const pos = step.position || "bottom";

    let top = 0;
    let left = 0;
    let dir: "top" | "bottom" = "top";

    if (pos === "bottom") {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      dir = "top";
    } else if (pos === "top") {
      top = rect.top - tooltipHeight - gap;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      dir = "bottom";
    } else if (pos === "right") {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + gap;
      dir = "top";
    } else {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - gap;
      dir = "top";
    }

    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

    setArrowDirection(dir);
    setTooltipStyle({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 10002,
    });

    const arrowPos: React.CSSProperties = { position: "absolute" };
    if (dir === "top") {
      arrowPos.top = "-8px";
      arrowPos.left = `${Math.min(Math.max(rect.left + rect.width / 2 - left - 6, 16), tooltipWidth - 32)}px`;
    } else if (dir === "bottom") {
      arrowPos.bottom = "-8px";
      arrowPos.left = `${Math.min(Math.max(rect.left + rect.width / 2 - left - 6, 16), tooltipWidth - 32)}px`;
    }
    setArrowStyle(arrowPos);
  }, [currentStep, steps]);

  useEffect(() => {
    if (!showTour) return;
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
    return () => {
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip, true);
    };
  }, [showTour, currentStep, positionTooltip]);

  const dismissTour = async () => {
    setShowTour(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      localStorage.setItem(`tour_dismissed_${session.user.id}`, "true");
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      dismissTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  if (!showTour) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[10000]" onClick={dismissTour}>
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />
        {targetRect && (
          <div
            className="absolute rounded-lg bg-transparent pointer-events-none"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              zIndex: 10001,
              boxShadow: `0 0 0 9999px rgba(0,0,0,0.6), 0 0 0 4px hsl(var(--primary) / 0.5)`,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed max-w-[calc(100vw-32px)] bg-background rounded-2xl border border-divider shadow-2xl p-4 sm:p-6 animate-fade-in overflow-hidden"
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arrow */}
        {targetRect && arrowDirection === "top" && (
          <div
            style={arrowStyle}
            className="w-4 h-4 bg-background border-l border-t border-divider rotate-45 absolute"
          />
        )}
        {targetRect && arrowDirection === "bottom" && (
          <div
            style={arrowStyle}
            className="w-4 h-4 bg-background border-r border-b border-divider rotate-45 absolute"
          />
        )}

        {/* Close button */}
        <button
          onClick={dismissTour}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors z-10 p-1 rounded-full hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                i <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Icon & Content */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            {step.icon}
          </div>
          <div className="min-w-0 pr-4">
            <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground leading-tight">{step.title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
          </div>
        </div>

        {/* Actions - wrapped for small screens */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-divider">
          <div className="flex items-center gap-1">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={prevStep} className="gap-1 h-8 px-2 text-xs">
                <ArrowLeft className="h-3 w-3" /> Back
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={dismissTour} className="text-muted-foreground h-8 px-2 text-xs">
              Skip
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            {step.action && step.actionLabel && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => {
                  step.action!();
                  dismissTour();
                }}
              >
                {step.actionLabel}
              </Button>
            )}
            <Button size="sm" onClick={nextStep} className="gap-1 h-8 px-3 text-xs font-medium">
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
              {currentStep < steps.length - 1 && <ArrowRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
