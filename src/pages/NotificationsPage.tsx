import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, UserPlus, UserCheck, TrendingUp, CheckCheck, ArrowLeft, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";

const notificationIcon = (type: string) => {
  switch (type) {
    case "connection_request":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "connection_accepted":
      return <UserCheck className="h-4 w-4 text-emerald-500" />;
    case "new_deal":
      return <TrendingUp className="h-4 w-4 text-amber-500" />;
    default:
      return <Bell className="h-4 w-4 text-primary" />;
  }
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Notifications | Codonyx";
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile) setProfileId(profile.id);
      setLoading(false);
    })();
  }, [navigate]);

  const { notifications, unreadCount, markAsRead, markAllAsRead, loading: notificationsLoading } = useNotifications(profileId);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.id);
    if (n.link) navigate(n.link);
    else if (n.related_profile_id) navigate(`/profile/${n.related_profile_id}`);
  };

  if (loading || (profileId && notificationsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sticky header with back button */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10 shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-2xl">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <p className="text-base font-medium text-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border/60">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-3 px-4 py-4 cursor-pointer hover:bg-muted/60 transition-colors ${
                  !n.is_read ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
                }`}
              >
                {n.related_profile ? (
                  <div className="relative shrink-0">
                    <Avatar
                      className="h-11 w-11 cursor-pointer ring-2 ring-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${n.related_profile!.id}`);
                      }}
                    >
                      <AvatarImage src={n.related_profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {getInitials(n.related_profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background">
                      {notificationIcon(n.type)}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
                    {notificationIcon(n.type)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-foreground break-words">{n.message}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-2 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <ScrollToTopButton />
    </div>
  );
}
