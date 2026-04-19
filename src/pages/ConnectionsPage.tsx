import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, User, Users, Clock, UserCheck, Mail } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  organisation: string | null;
  user_type: "advisor" | "laboratory" | "distributor";
}

interface Connection {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentUserType, setCurrentUserType] = useState<"advisor" | "laboratory" | "distributor" | null>(null);
  const [acceptedConnections, setAcceptedConnections] = useState<Connection[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Connection[]>([]);
  const [pendingSent, setPendingSent] = useState<Connection[]>([]);
  const [cancelConfirm, setCancelConfirm] = useState<Connection | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  // Realtime subscription for connections
  useEffect(() => {
    if (!currentProfileId) return;

    const channel = supabase
      .channel('connections-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => {
        loadConnections();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentProfileId]);

  const loadConnections = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get current user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, user_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!profile) {
        navigate("/auth");
        return;
      }

      setCurrentProfileId(profile.id);
      setCurrentUserType(profile.user_type);

      // Get all connections where user is sender or receiver
      const { data: connections, error } = await supabase
        .from("connections")
        .select("*")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

      if (error) throw error;

      // Get all profile IDs we need to fetch
      const profileIds = new Set<string>();
      connections?.forEach((conn) => {
        profileIds.add(conn.sender_id);
        profileIds.add(conn.receiver_id);
      });

      // Fetch all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline, organisation, user_type")
        .in("id", Array.from(profileIds));

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      // Map connections with profile data
      const connectionsWithProfiles = connections?.map((conn) => ({
        ...conn,
        sender: profileMap.get(conn.sender_id),
        receiver: profileMap.get(conn.receiver_id),
      })) || [];

      // Separate by status and type
      const accepted = connectionsWithProfiles.filter((c) => c.status === "accepted");
      const receivedPending = connectionsWithProfiles.filter(
        (c) => c.status === "pending" && c.receiver_id === profile.id
      );
      const sentPending = connectionsWithProfiles.filter(
        (c) => c.status === "pending" && c.sender_id === profile.id
      );

      setAcceptedConnections(accepted);
      setPendingReceived(receivedPending);
      setPendingSent(sentPending);
    } catch (error) {
      console.error("Error loading connections:", error);
      toast({
        title: "Error",
        description: "Failed to load connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      const connection = [...pendingReceived, ...acceptedConnections, ...pendingSent].find(c => c.id === connectionId);
      const senderId = connection?.sender_id;

      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);

      if (error) throw error;

      toast({
        title: "Connection Accepted",
        description: "You are now connected!",
      });

      // Notify the sender (in-app + email)
      (async () => {
        try {
          if (!senderId || !currentProfileId) return;

          const [acceptorResult, senderResult] = await Promise.all([
            supabase.from("profiles").select("full_name, headline, organisation, user_type, avatar_url").eq("id", currentProfileId).single(),
            supabase.from("profiles").select("full_name, email").eq("id", senderId).single(),
          ]);

          if (acceptorResult.data?.full_name) {
            const { error: notifError } = await supabase.from("notifications").insert({
              profile_id: senderId,
              type: "connection_accepted",
              title: "Connection Accepted",
              message: `${acceptorResult.data.full_name} accepted your connection request.`,
              link: `/profile/${currentProfileId}`,
              related_profile_id: currentProfileId,
            });
            if (notifError) console.error("Error creating acceptance notification:", notifError);
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
        } catch (e) {
          console.error("Error sending acceptance notification:", e);
        }
      })();

      loadConnections();
    } catch (error) {
      console.error("Error accepting connection:", error);
      toast({
        title: "Error",
        description: "Failed to accept connection",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: "rejected" })
        .eq("id", connectionId);

      if (error) throw error;

      toast({
        title: "Connection Rejected",
        description: "The connection request has been rejected.",
      });

      loadConnections();
    } catch (error) {
      console.error("Error rejecting connection:", error);
      toast({
        title: "Error",
        description: "Failed to reject connection",
        variant: "destructive",
      });
    }
  };

  const handleCancelRequest = async (connectionId: string) => {
    try {
      // Withdraw with cooldown — mark withdrawn_at so re-request is blocked for 3 weeks
      const { error } = await supabase
        .from("connections")
        .update({ 
          status: "rejected" as any,
          withdrawn_at: new Date().toISOString(),
        })
        .eq("id", connectionId);

      if (error) throw error;

      toast({
        title: "Request Cancelled",
        description: "Your connection request has been cancelled. You can resend after 3 weeks.",
      });

      loadConnections();
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description: "Failed to cancel request",
        variant: "destructive",
      });
    }
    setCancelConfirm(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getOtherProfile = (connection: Connection): Profile | undefined => {
    if (connection.sender_id === currentProfileId) {
      return connection.receiver;
    }
    return connection.sender;
  };

  const getEmptyMessage = () => {
    if (currentUserType === "laboratory") {
      return "You can send connection requests to advisors through Codonyx to let them know you discovered them on this platform.";
    }
    return "You can receive connection requests from laboratories who are interested in your expertise through this platform.";
  };

  const ConnectionCard = ({ 
    connection, 
    showActions = false,
    isPendingSent = false 
  }: { 
    connection: Connection; 
    showActions?: boolean;
    isPendingSent?: boolean;
  }) => {
    const profile = getOtherProfile(connection);
    if (!profile) return null;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
            <Link to={`/profile/${profile.id}`} className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{profile.full_name}</h3>
                {profile.headline && (
                  <p className="text-sm text-muted-foreground truncate">{profile.headline}</p>
                )}
                {profile.organisation && (
                  <p className="text-xs text-muted-foreground truncate">{profile.organisation}</p>
                )}
              </div>
              <Badge variant="outline" className="capitalize shrink-0 hidden sm:inline-flex">
                {profile.user_type}
              </Badge>
            </Link>
            
            <div className="flex items-center gap-2 shrink-0">
              {showActions && (
                <>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAccept(connection.id);
                    }}
                    className="gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleReject(connection.id);
                    }}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </Button>
                </>
              )}
              {isPendingSent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    setCancelConfirm(connection);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md">{description}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <DashboardNavbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              Connections
            </h1>
            <p className="text-muted-foreground">
              Manage your professional network and connection requests
            </p>
          </div>

          <Tabs defaultValue="accepted" className="w-full overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="accepted" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                <UserCheck className="h-4 w-4 hidden sm:inline" />
                Connected
                {acceptedConnections.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {acceptedConnections.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                <Clock className="h-4 w-4 hidden sm:inline" />
                Requests
                {pendingReceived.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingReceived.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                <Mail className="h-4 w-4 hidden sm:inline" />
                Sent
                {pendingSent.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingSent.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="accepted">
              {acceptedConnections.length > 0 ? (
                <div className="space-y-3">
                  {acceptedConnections.map((connection) => (
                    <ConnectionCard key={connection.id} connection={connection} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No connections yet"
                  description={getEmptyMessage()}
                />
              )}
            </TabsContent>

            <TabsContent value="pending">
              {pendingReceived.length > 0 ? (
                <div className="space-y-3">
                  {pendingReceived.map((connection) => (
                    <ConnectionCard 
                      key={connection.id} 
                      connection={connection} 
                      showActions 
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="No pending requests"
                  description="You don't have any pending connection requests at the moment."
                />
              )}
            </TabsContent>

            <TabsContent value="sent">
              {pendingSent.length > 0 ? (
                <div className="space-y-3">
                  {pendingSent.map((connection) => (
                    <ConnectionCard 
                      key={connection.id} 
                      connection={connection} 
                      isPendingSent 
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Mail}
                  title="No sent requests"
                  description="You haven't sent any connection requests yet."
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelConfirm} onOpenChange={(open) => !open && setCancelConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Connection Request?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your connection request to <strong>{cancelConfirm ? getOtherProfile(cancelConfirm)?.full_name : ""}</strong>?
              <br /><br />
              <span className="text-amber-600 font-medium">⚠️ After cancelling, you will not be able to send a new request to this person for 3 weeks.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelConfirm && handleCancelRequest(cancelConfirm.id)}
            >
              Yes, Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
