import { toast as sonnerToast } from "sonner";
import { CheckCircle2, X, AlertCircle, Info } from "lucide-react";

interface AnimatedToastOptions {
  description?: string;
  duration?: number;
}

function SuccessIcon() {
  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      <svg className="w-8 h-8" viewBox="0 0 36 36">
        <circle
          cx="18" cy="18" r="16"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeDasharray="100.53"
          strokeDashoffset="100.53"
          className="animate-[circle-draw_0.4s_ease-out_forwards]"
        />
      </svg>
      <CheckCircle2
        className="absolute w-5 h-5 text-primary animate-[check-pop_0.3s_ease-out_0.3s_forwards] opacity-0"
      />
    </div>
  );
}

export function showSuccessToast(title: string, opts?: AnimatedToastOptions) {
  sonnerToast.custom(
    (id) => (
      <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 shadow-lg min-w-[280px] max-w-[380px]">
        <SuccessIcon />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground leading-tight">{title}</p>
          {opts?.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{opts.description}</p>
          )}
        </div>
        <button
          onClick={() => sonnerToast.dismiss(id)}
          className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
    { duration: opts?.duration ?? 2000 }
  );
}

export function showErrorToast(title: string, opts?: AnimatedToastOptions) {
  sonnerToast.custom(
    (id) => (
      <div className="flex items-center gap-3 bg-background border border-destructive/30 rounded-xl px-4 py-3 shadow-lg min-w-[280px] max-w-[380px]">
        <AlertCircle className="w-6 h-6 text-destructive shrink-0 animate-[check-pop_0.3s_ease-out_forwards]" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground leading-tight">{title}</p>
          {opts?.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{opts.description}</p>
          )}
        </div>
        <button
          onClick={() => sonnerToast.dismiss(id)}
          className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
    { duration: opts?.duration ?? 2000 }
  );
}

export function showInfoToast(title: string, opts?: AnimatedToastOptions) {
  sonnerToast.custom(
    (id) => (
      <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 shadow-lg min-w-[280px] max-w-[380px]">
        <Info className="w-6 h-6 text-primary shrink-0 animate-[check-pop_0.3s_ease-out_forwards]" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground leading-tight">{title}</p>
          {opts?.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{opts.description}</p>
          )}
        </div>
        <button
          onClick={() => sonnerToast.dismiss(id)}
          className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
    { duration: opts?.duration ?? 2000 }
  );
}
