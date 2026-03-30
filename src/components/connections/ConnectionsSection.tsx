import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, Users, UserPlus, Mail } from "lucide-react";
import { useConnections } from "@/hooks/useConnections";
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

interface ConnectionsSectionProps {
  currentProfileId: string;
  userType: "advisor" | "laboratory";
}

export function ConnectionsSection({ currentProfileId, userType }: ConnectionsSectionProps) {
  const navigate = useNavigate();
  const {
    acceptedConnections,
    pendingSentRequests,
    pendingReceivedRequests,
    isLoading,
    acceptConnection,
    rejectConnection,
    withdrawConnection,
    removeConnection,
  } = useConnections(currentProfileId);
  const [withdrawDialogId, setWithdrawDialogId] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getOtherProfile = (connection: any) => {
    if (connection.sender_id === currentProfileId) {
      return connection.receiver_profile;
    }
    return connection.sender_profile;
  };

  const EmptyState = ({ type }: { type: "connections" | "pending" | "sent" }) => {
    const isLab = userType === "laboratory";
    
    if (type === "connections") {
      return (
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-heading text-lg font-medium text-foreground mb-2">
            No Connections Yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {isLab
              ? "You can send connection requests to advisors through Codonyx. When you connect, they'll receive an email letting them know you came from this platform."
              : "You can send connection requests to laboratories through Codonyx. When you connect, they'll receive an email letting them know you came from this platform."
            }
          </p>
          <Button
            variant="outline"
            className="mt-6 gap-2"
            onClick={() => navigate(isLab ? "/advisors" : "/laboratories")}
          >
            <UserPlus className="w-4 h-4" />
            Browse {isLab ? "Advisors" : "Laboratories"}
          </Button>
        </div>
      );
    }

    if (type === "pending") {
      return (
        <div className="text-center py-12 px-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-heading text-lg font-medium text-foreground mb-2">
            No Pending Requests
          </h3>
          <p className="text-muted-foreground text-sm">
            You don't have any pending connection requests to review.
          </p>
        </div>
      );
    }

    return (
      <div className="text-center py-12 px-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-heading text-lg font-medium text-foreground mb-2">
          No Sent Requests
        </h3>
        <p className="text-muted-foreground text-sm">
          You haven't sent any connection requests yet.
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-divider">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-divider">
      <CardHeader>
        <CardTitle className="font-heading text-xl flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Connections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="connections" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="connections" className="gap-2">
              <Users className="w-4 h-4" />
              Connected
              {acceptedConnections.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {acceptedConnections.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending
              {pendingReceivedRequests.length > 0 && (
                <Badge className="ml-1 text-xs bg-primary">
                  {pendingReceivedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Mail className="w-4 h-4" />
              Sent
              {pendingSentRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {pendingSentRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections">
            {acceptedConnections.length === 0 ? (
              <EmptyState type="connections" />
            ) : (
              <div className="space-y-3">
                {acceptedConnections.map((connection) => {
                  const profile = getOtherProfile(connection);
                  if (!profile) return null;

                  return (
                    <div
                      key={connection.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-divider hover:bg-muted/50 transition-colors"
                    >
                      <Avatar
                        className="h-12 w-12 cursor-pointer"
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/profile/${profile.id}`)}
                        >
                          {profile.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.headline || profile.organisation || profile.user_type}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize shrink-0">
                        {profile.user_type}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pendingReceivedRequests.length === 0 ? (
              <EmptyState type="pending" />
            ) : (
              <div className="space-y-3">
                {pendingReceivedRequests.map((connection) => {
                  const profile = connection.sender_profile;
                  if (!profile) return null;

                  return (
                    <div
                      key={connection.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-divider bg-primary/5"
                    >
                      <Avatar
                        className="h-12 w-12 cursor-pointer"
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/profile/${profile.id}`)}
                        >
                          {profile.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.headline || profile.organisation}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Wants to connect with you
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        <Button
                          size="sm"
                          onClick={() => acceptConnection(connection.id)}
                          className="gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectConnection(connection.id)}
                          className="gap-1"
                        >
                          <X className="w-4 h-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent">
            {pendingSentRequests.length === 0 ? (
              <EmptyState type="sent" />
            ) : (
              <div className="space-y-3">
                {pendingSentRequests.map((connection) => {
                  const profile = connection.receiver_profile;
                  if (!profile) return null;

                  return (
                    <div
                      key={connection.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-divider"
                    >
                      <Avatar
                        className="h-12 w-12 cursor-pointer"
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/profile/${profile.id}`)}
                        >
                          {profile.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.headline || profile.organisation}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setWithdrawDialogId(connection.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Withdraw confirmation dialog */}
        <AlertDialog open={!!withdrawDialogId} onOpenChange={() => setWithdrawDialogId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Withdraw invitation</AlertDialogTitle>
              <AlertDialogDescription>
                If you withdraw now, you won't be able to resend to this person for up to 2 weeks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (withdrawDialogId) withdrawConnection(withdrawDialogId);
                setWithdrawDialogId(null);
              }}>Withdraw</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
