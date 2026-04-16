import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Connection {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
  withdrawn_at: string | null;
  sender_profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    headline: string | null;
    user_type: string;
    organisation: string | null;
  };
  receiver_profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    headline: string | null;
    user_type: string;
    organisation: string | null;
  };
}

const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

export function useConnections(currentProfileId: string | null) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!currentProfileId) {
      setIsLoading(false);
      return;
    }

    try {
      const [sentResult, receivedResult] = await Promise.all([
        supabase
          .from("connections")
          .select(`
            *,
            receiver_profile:profiles!connections_receiver_id_fkey(id, full_name, avatar_url, headline, user_type, organisation)
          `)
          .eq("sender_id", currentProfileId),
        supabase
          .from("connections")
          .select(`
            *,
            sender_profile:profiles!connections_sender_id_fkey(id, full_name, avatar_url, headline, user_type, organisation)
          `)
          .eq("receiver_id", currentProfileId),
      ]);

      if (sentResult.error || receivedResult.error) {
        console.error("Error fetching connections:", sentResult.error || receivedResult.error);
        return;
      }

      const allConnections = [
        ...(sentResult.data || []).map(c => ({ ...c, receiver_profile: c.receiver_profile })),
        ...(receivedResult.data || []).map(c => ({ ...c, sender_profile: c.sender_profile })),
      ] as Connection[];

      setConnections(allConnections);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentProfileId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const getConnectionStatus = useCallback((targetProfileId: string): { 
    status: "none" | "pending_sent" | "pending_received" | "accepted" | "rejected";
    connectionId?: string;
    cooldownUntil?: string;
  } => {
    const connection = connections.find(
      c => c.sender_id === targetProfileId || c.receiver_id === targetProfileId
    );

    if (!connection) return { status: "none" };

    if (connection.withdrawn_at) {
      const withdrawnDate = new Date(connection.withdrawn_at).getTime();
      const cooldownEnd = withdrawnDate + THREE_WEEKS_MS;
      if (Date.now() < cooldownEnd) {
        return { 
          status: "none", 
          connectionId: connection.id,
          cooldownUntil: new Date(cooldownEnd).toISOString(),
        };
      }
    }

    if (connection.status === "accepted") {
      return { status: "accepted", connectionId: connection.id };
    }

    if (connection.status === "rejected") {
      return { status: "rejected", connectionId: connection.id };
    }

    if (connection.sender_id === currentProfileId) {
      return { status: "pending_sent", connectionId: connection.id };
    }
    return { status: "pending_received", connectionId: connection.id };
  }, [connections, currentProfileId]);

  const sendConnectionRequest = async (targetProfileId: string) => {
    if (!currentProfileId) return false;

    try {
      const existingConn = connections.find(
        c => (c.sender_id === currentProfileId && c.receiver_id === targetProfileId) ||
             (c.sender_id === targetProfileId && c.receiver_id === currentProfileId)
      );

      if (existingConn?.withdrawn_at) {
        const cooldownEnd = new Date(existingConn.withdrawn_at).getTime() + THREE_WEEKS_MS;
        if (Date.now() < cooldownEnd) {
          const daysLeft = Math.ceil((cooldownEnd - Date.now()) / (1000 * 60 * 60 * 24));
          toast({
            title: "Cooldown Active",
            description: `You can resend a request in ${daysLeft} day(s).`,
            variant: "destructive",
          });
          return false;
        }
        await supabase.from("connections").delete().eq("id", existingConn.id);
      }

      if (existingConn && !existingConn.withdrawn_at) {
        toast({
          title: "Already connected",
          description: "You already have an active connection with this person.",
        });
        return false;
      }

      // Optimistic update FIRST
      const optimisticId = "optimistic-" + Date.now();
      setConnections(prev => [...prev, {
        id: optimisticId,
        sender_id: currentProfileId,
        receiver_id: targetProfileId,
        status: "pending" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        withdrawn_at: null,
      }]);

      toast({
        title: "Request Sent",
        description: "Your connection request has been sent.",
      });

      // Fire DB insert in background
      const { error } = await supabase
        .from("connections")
        .insert({
          sender_id: currentProfileId,
          receiver_id: targetProfileId,
        });

      if (error) {
        // Rollback optimistic update
        setConnections(prev => prev.filter(c => c.id !== optimisticId));
        console.error("Error sending connection request:", error);
        toast({
          title: "Error",
          description: "Failed to send connection request. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Send email + in-app notification in background (non-blocking)
      (async () => {
        try {
          const [senderResult, receiverResult] = await Promise.all([
            supabase.from("profiles").select("full_name, headline, organisation, bio, user_type, avatar_url").eq("id", currentProfileId).single(),
            supabase.from("profiles").select("full_name, email").eq("id", targetProfileId).single(),
          ]);

          const senderProfile = senderResult.data;
          const receiverProfile = receiverResult.data;

          if (senderProfile) {
            // Create in-app notification for the receiver
            const userTypeLabel = senderProfile.user_type
              ? senderProfile.user_type.charAt(0).toUpperCase() + senderProfile.user_type.slice(1)
              : "";
            await supabase.from("notifications").insert({
              profile_id: targetProfileId,
              type: "connection_request",
              title: "New Connection Request",
              message: `${senderProfile.full_name}${userTypeLabel ? ` (${userTypeLabel})` : ""} sent you a connection request.`,
              link: `/connections`,
              related_profile_id: currentProfileId,
            });
          }

          if (receiverProfile?.email && senderProfile) {
            await supabase.functions.invoke("send-connection-email", {
              body: {
                recipientEmail: receiverProfile.email,
                recipientName: receiverProfile.full_name || "User",
                senderName: senderProfile.full_name || "A Codonyx user",
                senderTitle: senderProfile.headline || "",
                senderOrganization: senderProfile.organisation || "",
                senderBio: senderProfile.bio || "",
                senderAvatarUrl: senderProfile.avatar_url || "",
                senderUserType: senderProfile.user_type || "",
                connectionPageUrl: `${window.location.origin}/connections`,
              },
            });
          }
        } catch (emailError) {
          console.error("Error sending connection email:", emailError);
        }
      })();

      // Background refresh to get real ID
      fetchConnections();
      return true;
    } catch (error) {
      console.error("Error sending connection request:", error);
      return false;
    }
  };

  const acceptConnection = async (connectionId: string) => {
    const existingConnection = connections.find(c => c.id === connectionId);
    let senderId = existingConnection?.sender_id;

    // Optimistic update FIRST
    setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: "accepted" as const } : c));
    toast({ title: "Connection Accepted", description: "You are now connected." });

    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);

      if (error) {
        // Rollback
        setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: "pending" as const } : c));
        console.error("Error accepting connection:", error);
        toast({ title: "Error", description: "Failed to accept connection request.", variant: "destructive" });
        return false;
      }

      if (!senderId) {
        const { data: connectionRecord, error: connectionLookupError } = await supabase
          .from("connections")
          .select("sender_id")
          .eq("id", connectionId)
          .maybeSingle();

        if (connectionLookupError) {
          console.error("Error loading accepted connection sender:", connectionLookupError);
        }

        senderId = connectionRecord?.sender_id;
      }

      try {
        if (senderId && currentProfileId) {
          const [acceptorResult, senderResult] = await Promise.all([
            supabase.from("profiles").select("full_name, headline, organisation, user_type, avatar_url").eq("id", currentProfileId).single(),
            supabase.from("profiles").select("full_name, email").eq("id", senderId).single(),
          ]);

          if (acceptorResult.data?.full_name) {
            const { error: notificationError } = await supabase.from("notifications").insert({
              profile_id: senderId,
              type: "connection_accepted",
              title: "Connection Accepted",
              message: `${acceptorResult.data.full_name} accepted your connection request.`,
              link: `/profile/${currentProfileId}`,
              related_profile_id: currentProfileId,
            });

            if (notificationError) {
              console.error("Error creating acceptance notification:", notificationError);
            }
          }

          if (senderResult.data?.email && acceptorResult.data?.full_name) {
            await supabase.functions.invoke("send-notification-email", {
              body: {
                type: "connection_accepted",
                recipientEmail: senderResult.data.email,
                recipientName: senderResult.data.full_name,
                senderName: acceptorResult.data.full_name,
                senderHeadline: acceptorResult.data.headline || "",
                senderOrganisation: acceptorResult.data.organisation || "",
                senderUserType: acceptorResult.data.user_type || "",
                senderAvatarUrl: acceptorResult.data.avatar_url || "",
                loginUrl: window.location.origin + "/auth",
              },
            });
          }
        }
      } catch (emailError) {
        console.error("Error sending acceptance email:", emailError);
      }

      return true;
    } catch (error) {
      console.error("Error accepting connection:", error);
      return false;
    }
  };

  const rejectConnection = async (connectionId: string) => {
    // Optimistic update
    setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: "rejected" as const } : c));
    toast({ title: "Request Declined", description: "Connection request has been declined." });

    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: "rejected" })
        .eq("id", connectionId);

      if (error) {
        // Rollback
        setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: "pending" as const } : c));
        console.error("Error rejecting connection:", error);
        toast({ title: "Error", description: "Failed to reject connection request.", variant: "destructive" });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error rejecting connection:", error);
      return false;
    }
  };

  const withdrawConnection = async (connectionId: string) => {
    const now = new Date().toISOString();
    // Optimistic update
    setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: "rejected" as const, withdrawn_at: now } : c));
    toast({ title: "Request Withdrawn", description: "Connection has been disconnected. You can reconnect after 3 weeks." });

    try {
      const { error } = await supabase
        .from("connections")
        .update({ 
          status: "rejected" as any,
          withdrawn_at: now,
        })
        .eq("id", connectionId);

      if (error) {
        // Rollback
        setConnections(prev => prev.map(c => c.id === connectionId ? { ...c, status: "pending" as const, withdrawn_at: null } : c));
        console.error("Error withdrawing connection:", error);
        toast({ title: "Error", description: "Failed to withdraw connection request.", variant: "destructive" });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error withdrawing connection:", error);
      return false;
    }
  };

  const removeConnection = async (connectionId: string) => {
    // Optimistic update - remove from list
    const backup = connections;
    setConnections(prev => prev.filter(c => c.id !== connectionId));
    toast({ title: "Connection Removed", description: "Connection has been removed." });

    try {
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("id", connectionId);

      if (error) {
        // Rollback
        setConnections(backup);
        console.error("Error removing connection:", error);
        toast({ title: "Error", description: "Failed to remove connection.", variant: "destructive" });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error removing connection:", error);
      return false;
    }
  };

  const acceptedConnections = connections.filter(c => c.status === "accepted");
  const pendingSentRequests = connections.filter(
    c => c.status === "pending" && c.sender_id === currentProfileId
  );
  const pendingReceivedRequests = connections.filter(
    c => c.status === "pending" && c.receiver_id === currentProfileId
  );

  return {
    connections,
    acceptedConnections,
    pendingSentRequests,
    pendingReceivedRequests,
    isLoading,
    getConnectionStatus,
    sendConnectionRequest,
    acceptConnection,
    rejectConnection,
    withdrawConnection,
    removeConnection,
    refetch: fetchConnections,
  };
}