import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const navigate = useNavigate();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Scroll to top first, then navigate back to prevent scroll restoration issues
    window.scrollTo(0, 0);
    // Use requestAnimationFrame to ensure scroll completes before navigation
    requestAnimationFrame(() => {
      navigate(-1);
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
