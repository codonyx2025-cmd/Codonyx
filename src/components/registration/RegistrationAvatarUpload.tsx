import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropper } from "@/components/ui/image-cropper";
import { toast } from "@/hooks/use-toast";
import { Upload, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { validateImage, compressImage, IMAGE_ACCEPT_ATTR } from "@/lib/uploadValidation";

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

    const v = validateImage(file);
    if (!v.ok) {
      toast({ title: "Invalid image", description: v.error, variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleCropComplete = async (croppedBlob: Blob) => {
    const optimized = await compressImage(croppedBlob, { maxDimension: 800, quality: 0.85 });
    const previewUrl = URL.createObjectURL(optimized);
    onAvatarChange(previewUrl, optimized);
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
            <input ref={fileInputRef} type="file" accept={IMAGE_ACCEPT_ATTR} className="hidden" onChange={handleFileSelect} />
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
