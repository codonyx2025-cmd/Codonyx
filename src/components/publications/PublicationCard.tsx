import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ExternalLink,
  Paperclip,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

interface PublicationCardProps {
  publication: Publication;
  onEdit?: (pub: Publication) => void;
  onDelete?: (id: string) => void;
  getTypeLabel: (type: string) => string;
  isOwner?: boolean;
}

const typeColors: Record<string, string> = {
  paper: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  presentation: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  report: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  thesis: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  article: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  patent: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  other: "bg-muted text-muted-foreground",
};

export function PublicationCard({
  publication,
  onEdit,
  onDelete,
  getTypeLabel,
  isOwner = false,
}: PublicationCardProps) {
  const navigate = useNavigate();
  const formattedDate = new Date(publication.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const goToDetail = () => navigate(`/publications/${publication.id}`);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <Card
      onClick={goToDetail}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDetail();
        }
      }}
      className="group hover:shadow-md hover:border-primary/30 transition-all border-border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-foreground text-lg truncate">
                  {publication.title}
                </h3>
                <Badge
                  variant="outline"
                  className={typeColors[publication.publication_type] || typeColors.other}
                >
                  {getTypeLabel(publication.publication_type)}
                </Badge>
              </div>

              {publication.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {publication.description}
                </p>
              )}

              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </span>

                {publication.file_url && (
                  <a
                    href={publication.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={stop}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    View Attachment
                  </a>
                )}

                {publication.external_url && (
                  <a
                    href={publication.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={stop}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    External Link
                  </a>
                )}
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-1 shrink-0" onClick={stop}>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(publication);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={stop}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={stop}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Publication</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{publication.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(publication.id);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
