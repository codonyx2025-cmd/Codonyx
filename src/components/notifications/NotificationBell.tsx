import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, UserPlus, UserCheck, TrendingUp, CheckCheck, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface NotificationBellProps {
  profileId: string | null;
}

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

export function NotificationBell({ profileId }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(profileId);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track scroll inside the popover list to toggle the scroll-to-top button.
  useEffect(() => {
    if (!open || isMobile) return;
    // Radix ScrollArea renders a viewport with this data attribute.
    const viewport = document.querySelector<HTMLDivElement>(
      "[data-notifications-scroll-viewport]"
    );
    if (!viewport) return;
    scrollViewportRef.current = viewport;
    const onScroll = () => setShowScrollTop(viewport.scrollTop > 80);
    onScroll();
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [open, isMobile, notifications.length]);

  const scrollListToTop = () => {
    scrollViewportRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // On mobile, the bell navigates to a dedicated full-page notifications view.
  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative h-10 w-10"
        onClick={() => navigate("/notifications")}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    );
  }

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.link) {
      setOpen(false);
      navigate(notification.link);
    } else if (notification.related_profile_id) {
      setOpen(false);
      navigate(`/profile/${notification.related_profile_id}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(calc(100vw-1rem),24rem)] max-w-[24rem] p-0 shadow-lg border-border/50 sm:w-96"
        align={isMobile ? "center" : "end"}
        sideOffset={8}
        collisionPadding={8}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mark all read</span>
              <span className="sm:hidden">Mark all</span>
            </button>
          )}
        </div>
        <div className="relative">
          <div
            data-notifications-scroll-viewport
            className="max-h-[22rem] overflow-y-auto overscroll-contain"
          >
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 opacity-40" />
                </div>
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1 opacity-70">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-2.5 px-3 py-3 cursor-pointer hover:bg-muted/60 transition-all duration-200 sm:gap-3 sm:px-4 sm:py-3.5 ${
                      !notification.is_read
                        ? "bg-primary/5 border-l-2 border-l-primary"
                        : "border-l-2 border-l-transparent"
                    }`}
                  >
                    {notification.related_profile ? (
                      <div className="relative shrink-0">
                        <Avatar
                          className="h-9 w-9 cursor-pointer ring-2 ring-background sm:h-10 sm:w-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(false);
                            navigate(`/profile/${notification.related_profile!.id}`);
                          }}
                        >
                          <AvatarImage src={notification.related_profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                            {getInitials(notification.related_profile.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background">
                          {notificationIcon(notification.type)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted sm:h-10 sm:w-10">
                        {notificationIcon(notification.type)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="break-words text-sm leading-snug text-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-2 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {showScrollTop && (
            <button
              type="button"
              onClick={scrollListToTop}
              aria-label="Scroll to top"
              className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform animate-fade-in"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
