import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
);

interface AvatarLightboxProps {
  src?: string | null;
  alt?: string;
  fallback: React.ReactNode;
  className?: string;
  fallbackClassName?: string;
}

export function AvatarLightbox({ src, alt, fallback, className, fallbackClassName }: AvatarLightboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Avatar
        className={cn("cursor-pointer hover:opacity-80 transition-opacity", className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (src) setOpen(true);
        }}
      >
        <AvatarImage src={src || undefined} alt={alt} />
        <AvatarFallback className={fallbackClassName}>
          {fallback}
        </AvatarFallback>
      </Avatar>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 bg-transparent border-none shadow-none [&>button]:text-white [&>button]:bg-black/50 [&>button]:rounded-full [&>button]:p-1">
          <VisuallyHidden>
            <DialogTitle>{alt || "Profile photo"}</DialogTitle>
          </VisuallyHidden>
          {src && (
            <img
              src={src}
              alt={alt || "Profile photo"}
              className="w-full h-auto rounded-xl object-contain max-h-[80vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
