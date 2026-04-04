import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, ArrowLeft, Pencil, Users, FileText, CheckCircle } from "lucide-react";
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
  const [arrowDirection, setArrowDirection] = useState<"top" | "bottom" | "left" | "right">("top");
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps: TourStep[] = [
    {
      title: "Welcome to Codonyx! 👋",
      description: "Let's get you set up. We'll walk you through the key features of this networking platform so you can make the most of it.",
      icon: <CheckCircle className="h-6 w-6" />,
    },
    {
      title: "Complete Your Profile",
      description: "A complete profile helps others find and connect with you. Add your headline, bio, location, and professional details to stand out.",
      targetSelector: '[data-tour="edit-profile"]',
      icon: <Pencil className="h-6 w-6" />,
      action: () => navigate("/edit-profile"),
      actionLabel: "Go to Edit Profile",
      position: "bottom",
    },
    {
      title: "Manage Your Connections",
      description: "Build your professional network by browsing profiles and sending connection requests. Track sent and received requests here.",
      targetSelector: '[data-tour="connections"]',
      icon: <Users className="h-6 w-6" />,
      action: () => navigate("/connections"),
      actionLabel: "View Connections",
      position: "bottom",
    },
    {
      title: "Share Your Publications",
      description: "Showcase your expertise by uploading research papers, presentations, and articles. Let your work speak for itself.",
      targetSelector: '[data-tour="publications"]',
      icon: <FileText className="h-6 w-6" />,
      action: () => navigate("/publications"),
      actionLabel: "View Publications",
      position: "bottom",
    },
    {
      title: "You're All Set! 🎉",
      description: "Start by completing your profile — it's the first step to meaningful connections. You can always revisit these features from the navigation menu.",
      icon: <CheckCircle className="h-6 w-6" />,
      action: () => navigate("/edit-profile"),
      actionLabel: "Complete My Profile",
    },
  ];

  useEffect(() => {
    const checkIfShouldShowTour = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check localStorage first for dismissed state
      const dismissed = localStorage.getItem(`tour_dismissed_${session.user.id}`);
      if (dismissed) return;

      // Check profile completeness
      const { data: profile } = await supabase
        .from("profiles")
        .select("headline, bio, location, organisation, avatar_url, created_at, updated_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!profile) return;

      // Show tour if essential profile fields are empty
      const isIncomplete = !profile.headline || !profile.bio || !profile.location;
      // Also show if profile was never edited (created_at equals updated_at within 1 minute)
      const createdAt = new Date(profile.created_at).getTime();
      const updatedAt = new Date(profile.updated_at).getTime();
      const neverEdited = Math.abs(updatedAt - createdAt) < 60000;

      if (isIncomplete || neverEdited) {
        // Small delay so dashboard renders first
        setTimeout(() => setShowTour(true), 800);
      }
    };

    checkIfShouldShowTour();
  }, []);

  const positionTooltip = useCallback(() => {
    const step = steps[currentStep];
    if (!step.targetSelector) {
      // Center the tooltip
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

    const el = document.querySelector(step.targetSelector);
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

    const tooltipWidth = 360;
    const tooltipHeight = 220;
    const gap = 16;
    const pos = step.position || "bottom";

    let top = 0;
    let left = 0;
    let dir: "top" | "bottom" | "left" | "right" = "top";

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
      dir = "left";
    } else {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - gap;
      dir = "right";
    }

    // Clamp to viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

    setArrowDirection(dir);
    setTooltipStyle({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 10002,
    });

    // Arrow position
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
        {/* Dimmed background */}
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />

        {/* Highlight cutout for targeted element */}
        {targetRect && (
          <div
            className="absolute rounded-lg shadow-[0_0_0_4px_hsl(var(--primary)/0.5)] bg-transparent pointer-events-none"
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
        className="w-[360px] max-w-[calc(100vw-32px)] bg-background rounded-xl border border-divider shadow-2xl p-4 sm:p-6 animate-fade-in overflow-hidden"
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
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${
                i <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Icon & Content */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            {step.icon}
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          <div className="flex items-center gap-1">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={prevStep} className="gap-1 px-2 text-xs sm:text-sm sm:px-3">
                <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Back
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={dismissTour} className="text-muted-foreground px-2 text-xs sm:text-sm sm:px-3">
              Skip
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            {step.action && step.actionLabel && (
              <Button
                variant="outline"
                size="sm"
                className="px-2 text-xs sm:text-sm sm:px-3 truncate max-w-[130px] sm:max-w-none"
                onClick={() => {
                  step.action!();
                  dismissTour();
                }}
              >
                {step.actionLabel}
              </Button>
            )}
            <Button size="sm" onClick={nextStep} className="gap-1 px-3 text-xs sm:text-sm sm:px-4 shrink-0">
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
              {currentStep < steps.length - 1 && <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
