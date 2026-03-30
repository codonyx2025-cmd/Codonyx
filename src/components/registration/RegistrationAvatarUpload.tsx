import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropper } from "@/components/ui/image-cropper";
import { toast } from "@/hooks/use-toast";
import { Upload, User } from "lucide-react";
import { Label } from "@/components/ui/label";

interface RegistrationAvatarUploadProps {
  avatarUrl: string;
  onAvatarChange: (url: string, blob: Blob) => void;
}

export function RegistrationAvatarUpload({ avatarUrl, onAvatarChange }: RegistrationAvatarUploadProps) {
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const previewUrl = URL.createObjectURL(croppedBlob);
    onAvatarChange(previewUrl, croppedBlob);
  };

  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium">Profile Picture</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-muted"><User className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
          </Avatar>
          <label className="cursor-pointer">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-muted transition-colors">
              <Upload className="h-4 w-4" /> Upload Photo
            </div>
          </label>
        </div>
      </div>

      {rawImageSrc && (
        <ImageCropper
          imageSrc={rawImageSrc}
          open={cropperOpen}
          onClose={() => { setCropperOpen(false); setRawImageSrc(null); }}
          onCropComplete={handleCropComplete}
          aspect={1}
          cropShape="round"
        />
      )}
    </>
  );
}
