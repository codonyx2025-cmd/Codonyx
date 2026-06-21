import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { BackButton } from "@/components/layout/BackButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  ExternalLink,
  Paperclip,
  Loader2,
  User as UserIcon,
} from "lucide-react";

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

interface AuthorProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  user_type: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  paper: "Published Paper",
  presentation: "Presentation",
  report: "Report",
  thesis: "Thesis",
  article: "Article",
  patent: "Patent",
  other: "Other",
};

const TYPE_COLORS: Record<string, string> = {
  paper: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  presentation: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  report: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  thesis: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  article: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  patent: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  other: "bg-muted text-muted-foreground",
};

export default function PublicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [publication, setPublication] = useState<Publication | null>(null);
  const [author, setAuthor] = useState<AuthorProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const { data: pub } = await supabase
        .from("publications")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (!pub) {
        setPublication(null);
        setLoading(false);
        return;
      }
      setPublication(pub as Publication);

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline, user_type")
        .eq("id", pub.profile_id)
        .maybeSingle();
      if (!cancelled) setAuthor((prof as AuthorProfile) || null);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const formattedDate = publication
    ? new Date(publication.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardNavbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <BackButton />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !publication ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-heading font-bold mb-2">
                Publication not found
              </h1>
              <p className="text-muted-foreground mb-6">
                This publication may have been removed or is unavailable.
              </p>
              <Button onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
            </div>
          ) : (
            <article className="bg-background rounded-2xl border border-divider p-6 md:p-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge
                    variant="outline"
                    className={`${TYPE_COLORS[publication.publication_type] || TYPE_COLORS.other} mb-2`}
                  >
                    {TYPE_LABELS[publication.publication_type] || publication.publication_type}
                  </Badge>
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground break-words">
                    {publication.title}
                  </h1>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Published on {formattedDate}</span>
                  </div>
                </div>
              </div>

              {author && (
                <Link
                  to={`/profile/${author.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-divider hover:bg-muted/50 transition-colors mb-6"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {author.avatar_url ? (
                      <img
                        src={author.avatar_url}
                        alt={author.full_name || "Author"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">
                      {author.full_name || "Author"}
                    </div>
                    {author.headline && (
                      <div className="text-xs text-muted-foreground truncate">
                        {author.headline}
                      </div>
                    )}
                  </div>
                </Link>
              )}

              {publication.description && (
                <section className="mb-8">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Description
                  </h2>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
                    {publication.description}
                  </p>
                </section>
              )}

              {(publication.file_url || publication.external_url) && (
                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Resources
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {publication.file_url && (
                      <Button asChild variant="outline" className="gap-2">
                        <a
                          href={publication.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Paperclip className="h-4 w-4" />
                          View Attachment
                        </a>
                      </Button>
                    )}
                    {publication.external_url && (
                      <Button asChild className="gap-2">
                        <a
                          href={publication.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open External Link
                        </a>
                      </Button>
                    )}
                  </div>
                </section>
              )}
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
