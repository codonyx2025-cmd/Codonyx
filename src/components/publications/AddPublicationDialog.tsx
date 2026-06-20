import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Link as LinkIcon } from "lucide-react";
import { validateDocument, DOCUMENT_ACCEPT_ATTR, TEXT_LIMITS } from "@/lib/uploadValidation";

interface Publication {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  publication_type: string;
  file_url: string | null;
  external_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AddPublicationDialogProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  onSuccess: () => void;
  editingPublication?: Publication | null;
}

const PUBLICATION_TYPES = [
  { value: "paper", label: "Published Paper" },
  { value: "presentation", label: "Presentation" },
  { value: "report", label: "Report" },
  { value: "thesis", label: "Thesis" },
  { value: "article", label: "Article" },
  { value: "patent", label: "Patent" },
  { value: "other", label: "Other" },
];

export function AddPublicationDialog({
  open,
  onClose,
  profileId,
  onSuccess,
  editingPublication,
}: AddPublicationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publicationType, setPublicationType] = useState("paper");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);

  const isEditing = !!editingPublication;

  useEffect(() => {
    if (editingPublication) {
      setTitle(editingPublication.title);
      setDescription(editingPublication.description || "");
      setPublicationType(editingPublication.publication_type);
      setExternalUrl(editingPublication.external_url || "");
      setExistingFileUrl(editingPublication.file_url);
      setFile(null);
    } else {
      resetForm();
    }
  }, [editingPublication, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPublicationType("paper");
    setExternalUrl("");
    setFile(null);
    setExistingFileUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      let fileUrl = existingFileUrl;

      // Upload file if provided
      if (file) {
        const v = validateDocument(file);
        if (!v.ok) {
          toast({ title: "Invalid file", description: v.error, variant: "destructive" });
          setLoading(false);
          return;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${session.user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("publications")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("publications")
          .getPublicUrl(fileName);

        fileUrl = urlData.publicUrl;

        // Delete the previous file when replacing on edit, to avoid orphans.
        if (isEditing && existingFileUrl) {
          const marker = "/publications/";
          const idx = existingFileUrl.indexOf(marker);
          if (idx !== -1) {
            const oldPath = existingFileUrl.slice(idx + marker.length).split("?")[0];
            if (oldPath && oldPath !== fileName) {
              await supabase.storage.from("publications").remove([oldPath]);
            }
          }
        }
      }

      const publicationData = {
        title: title.trim(),
        description: description.trim() || null,
        publication_type: publicationType,
        file_url: fileUrl,
        external_url: externalUrl.trim() || null,
        profile_id: profileId,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("publications")
          .update(publicationData)
          .eq("id", editingPublication.id);

        if (error) throw error;
        toast({ title: "Updated", description: "Publication updated successfully." });
      } else {
        const { error } = await supabase
          .from("publications")
          .insert(publicationData);

        if (error) throw error;
        toast({ title: "Published", description: "Publication added successfully." });
      }

      resetForm();
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error saving publication:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save publication",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Publication" : "Add New Publication"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your publication details"
              : "Share your published work, papers, or presentations"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter publication title"
              maxLength={TEXT_LIMITS.title}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the publication..."
              rows={3}
              maxLength={TEXT_LIMITS.description}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select value={publicationType} onValueChange={setPublicationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PUBLICATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalUrl">
              <span className="flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" />
                External Link (optional)
              </span>
            </Label>
            <Input
              id="externalUrl"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://doi.org/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">
              <span className="flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Attachment (PDF, DOC, DOCX, PPT, PPTX · max 30 MB)
              </span>
            </Label>
            {existingFileUrl && !file && (
              <p className="text-xs text-muted-foreground">
                Current file attached.{" "}
                <a href={existingFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  View
                </a>
                {" · Upload a new file to replace it."}
              </p>
            )}
            <Input
              id="file"
              type="file"
              accept={DOCUMENT_ACCEPT_ATTR}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                if (f) {
                  const v = validateDocument(f);
                  if (!v.ok) {
                    toast({ title: "Invalid file", description: v.error, variant: "destructive" });
                    e.target.value = "";
                    setFile(null);
                    return;
                  }
                }
                setFile(f);
              }}
              className="cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update" : "Publish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
