import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Notification {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  related_profile_id: string | null;
  is_read: boolean;
  created_at: string;
  related_profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export function useNotifications(profileId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      // Fetch related profiles for notifications that have them
      const relatedIds = [...new Set(data.filter(n => n.related_profile_id).map(n => n.related_profile_id!))];
      let profilesMap: Record<string, { id: string; full_name: string; avatar_url: string | null }> = {};
      
      if (relatedIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", relatedIds);
        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map(p => [p.id, p]));
        }
      }

      const enriched = data.map(n => ({
        ...n,
        related_profile: n.related_profile_id ? profilesMap[n.related_profile_id] || null : null,
      }));

      setNotifications(enriched);
      setUnreadCount(enriched.filter(n => !n.is_read).length);
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel(`notifications-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!profileId) return;

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("profile_id", profileId)
      .eq("is_read", false);
  }, [profileId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
