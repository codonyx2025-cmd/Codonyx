import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  to?: string;
}

export function BackButton({ to }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    window.scrollTo(0, 0);

    requestAnimationFrame(() => {
      if (to) {
        navigate(to);
      } else {
        navigate(-1);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="gap-2 mb-4 text-muted-foreground hover:text-foreground relative z-10"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
