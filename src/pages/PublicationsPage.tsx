import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AddPublicationDialog } from "@/components/publications/AddPublicationDialog";
import { PublicationCard } from "@/components/publications/PublicationCard";
import { Plus, FileText, Loader2 } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";

export interface Publication {
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

export default function PublicationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);

  useEffect(() => {
    loadPublications();
  }, []);

  const loadPublications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!profile) {
        navigate("/auth");
        return;
      }

      setProfileId(profile.id);

      const { data, error } = await supabase
        .from("publications")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPublications((data as Publication[]) || []);
    } catch (error) {
      console.error("Error loading publications:", error);
      toast({
        title: "Error",
        description: "Failed to load publications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const pub = publications.find((p) => p.id === id);
      
      // Delete file from storage if exists
      if (pub?.file_url) {
        const url = new URL(pub.file_url);
        const pathParts = url.pathname.split("/publications/");
        if (pathParts[1]) {
          await supabase.storage
            .from("publications")
            .remove([decodeURIComponent(pathParts[1])]);
        }
      }

      const { error } = await supabase
        .from("publications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Deleted", description: "Publication removed successfully." });
      loadPublications();
    } catch (error) {
      console.error("Error deleting publication:", error);
      toast({
        title: "Error",
        description: "Failed to delete publication",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (pub: Publication) => {
    setEditingPublication(pub);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPublication(null);
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      paper: "Published Paper",
      presentation: "Presentation",
      report: "Report",
      thesis: "Thesis",
      article: "Article",
      patent: "Patent",
      other: "Other",
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardNavbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <BackButton />
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
                Publications & Work
              </h1>
              <p className="text-muted-foreground">
                Upload and manage your published papers, presentations, and research work
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2 w-full sm:w-auto self-start">
              <Plus className="h-4 w-4" />
              Add Publication
            </Button>
          </div>

          {publications.length > 0 ? (
            <div className="space-y-4">
              {publications.map((pub) => (
                <PublicationCard
                  key={pub.id}
                  publication={pub}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  getTypeLabel={getTypeLabel}
                  isOwner
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No publications yet
              </h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Showcase your work by uploading published papers, presentations, reports, and other research materials.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Publication
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />

      <AddPublicationDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        profileId={profileId!}
        onSuccess={loadPublications}
        editingPublication={editingPublication}
      />
    </div>
  );
}
