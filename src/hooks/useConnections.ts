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
      const { data: sentData, error: sentError } = await supabase
        .from("connections")
        .select(`
          *,
          receiver_profile:profiles!connections_receiver_id_fkey(id, full_name, avatar_url, headline, user_type, organisation)
        `)
        .eq("sender_id", currentProfileId);

      const { data: receivedData, error: receivedError } = await supabase
        .from("connections")
        .select(`
          *,
          sender_profile:profiles!connections_sender_id_fkey(id, full_name, avatar_url, headline, user_type, organisation)
        `)
        .eq("receiver_id", currentProfileId);

      if (sentError || receivedError) {
        console.error("Error fetching connections:", sentError || receivedError);
        return;
      }

      const allConnections = [
        ...(sentData || []).map(c => ({ ...c, receiver_profile: c.receiver_profile })),
        ...(receivedData || []).map(c => ({ ...c, sender_profile: c.sender_profile })),
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

    // Check if this was a withdrawn connection with active cooldown
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
      // Check for existing withdrawn connection with cooldown
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
        // Cooldown expired, delete the old withdrawn record first
        await supabase.from("connections").delete().eq("id", existingConn.id);
      }

      const { error } = await supabase
        .from("connections")
        .insert({
          sender_id: currentProfileId,
          receiver_id: targetProfileId,
        });

      if (error) {
        console.error("Error sending connection request:", error);
        toast({
          title: "Error",
          description: "Failed to send connection request. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Send email notification to receiver
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("full_name, headline, organisation, bio")
        .eq("id", currentProfileId)
        .single();

      const { data: receiverProfile } = await supabase
        .from("profiles")
        .select("full_name, user_id, email")
        .eq("id", targetProfileId)
        .single();

      if (receiverProfile?.email && senderProfile) {
        try {
          await supabase.functions.invoke("send-connection-email", {
            body: {
              recipientEmail: receiverProfile.email,
              recipientName: receiverProfile.full_name || "User",
              senderName: senderProfile.full_name || "A Codonyx user",
              senderTitle: senderProfile.headline || "",
              senderOrganization: senderProfile.organisation || "",
              senderBio: senderProfile.bio || "",
              connectionPageUrl: `${window.location.origin}/connections`,
            },
          });
        } catch (emailError) {
          console.error("Error sending connection email:", emailError);
        }
      }

      toast({
        title: "Request Sent",
        description: "Your connection request has been sent.",
      });
      
      await fetchConnections();
      return true;
    } catch (error) {
      console.error("Error sending connection request:", error);
      return false;
    }
  };

  const acceptConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);

      if (error) {
        console.error("Error accepting connection:", error);
        toast({
          title: "Error",
          description: "Failed to accept connection request.",
          variant: "destructive",
        });
        return false;
      }

      // Send acceptance notification email with details
      try {
        const connection = connections.find(c => c.id === connectionId);
        if (connection && currentProfileId) {
          const senderId = connection.sender_id;
          
          const { data: acceptorProfile } = await supabase
            .from("profiles")
            .select("full_name, headline, organisation, user_type")
            .eq("id", currentProfileId)
            .single();

          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", senderId)
            .single();

          if (senderProfile?.email && acceptorProfile?.full_name) {
            await supabase.functions.invoke("send-notification-email", {
              body: {
                type: "connection_accepted",
                recipientEmail: senderProfile.email,
                recipientName: senderProfile.full_name,
                senderName: acceptorProfile.full_name,
                senderHeadline: acceptorProfile.headline || "",
                senderOrganisation: acceptorProfile.organisation || "",
                senderUserType: acceptorProfile.user_type || "",
                loginUrl: window.location.origin + "/auth",
              },
            });
          }
        }
      } catch (emailError) {
        console.error("Error sending acceptance email:", emailError);
      }

      toast({
        title: "Connection Accepted",
        description: "You are now connected.",
      });
      
      await fetchConnections();
      return true;
    } catch (error) {
      console.error("Error accepting connection:", error);
      return false;
    }
  };

  const rejectConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: "rejected" })
        .eq("id", connectionId);

      if (error) {
        console.error("Error rejecting connection:", error);
        toast({
          title: "Error",
          description: "Failed to reject connection request.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Request Declined",
        description: "Connection request has been declined.",
      });
      
      await fetchConnections();
      return true;
    } catch (error) {
      console.error("Error rejecting connection:", error);
      return false;
    }
  };

  const withdrawConnection = async (connectionId: string) => {
    try {
      // Instead of deleting, set withdrawn_at timestamp for cooldown tracking
      const { error } = await supabase
        .from("connections")
        .update({ 
          status: "rejected" as any,
          withdrawn_at: new Date().toISOString(),
        })
        .eq("id", connectionId);

      if (error) {
        console.error("Error withdrawing connection:", error);
        toast({
          title: "Error",
          description: "Failed to withdraw connection request.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Request Withdrawn",
        description: "Connection has been disconnected. You can reconnect after 3 weeks.",
      });
      
      await fetchConnections();
      return true;
    } catch (error) {
      console.error("Error withdrawing connection:", error);
      return false;
    }
  };

  const removeConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("id", connectionId);

      if (error) {
        console.error("Error removing connection:", error);
        toast({
          title: "Error",
          description: "Failed to remove connection.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Connection Removed",
        description: "Connection has been removed.",
      });
      
      await fetchConnections();
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
