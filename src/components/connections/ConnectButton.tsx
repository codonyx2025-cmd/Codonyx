import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Clock, Check, X, Loader2, MoreVertical, UserMinus } from "lucide-react";
import { useConnections } from "@/hooks/useConnections";
import { toast } from "@/hooks/use-toast";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConnectButtonProps {
  currentProfileId: string | null;
  targetProfileId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ConnectButton({
  currentProfileId,
  targetProfileId,
  variant = "default",
  size = "default",
  className,
}: ConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const {
    getConnectionStatus,
    sendConnectionRequest,
    acceptConnection,
    withdrawConnection,
    isLoading: isHydrating,
  } = useConnections(currentProfileId);

  if (!currentProfileId || currentProfileId === targetProfileId) {
    return null;
  }

  const { status, connectionId, cooldownUntil } = getConnectionStatus(targetProfileId);

  const handleConnect = async () => {
    // Guard: if still hydrating, warn user
    if (isHydrating) {
      toast({
        title: "Checking connection status...",
        description: "Please wait a moment and try again.",
      });
      return;
    }
    // Guard: if already connected/pending, show warning
    if (status === "accepted" || status === "pending_sent") {
      toast({
        title: status === "accepted" ? "Already Connected" : "Request Already Sent",
        description: status === "accepted" 
          ? "You are already connected with this person." 
          : "You have already sent a connection request.",
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendConnectionRequest(targetProfileId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!connectionId) return;
    setIsLoading(true);
    try {
      await acceptConnection(connectionId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!connectionId) return;
    setShowWithdrawDialog(false);
    setIsLoading(true);
    try {
      await withdrawConnection(connectionId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connectionId) return;
    setShowDisconnectDialog(false);
    setIsLoading(true);
    try {
      await withdrawConnection(connectionId);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  const handleCooldownConnect = () => {
    if (cooldownUntil && new Date(cooldownUntil) > new Date()) {
      const daysLeft = Math.ceil((new Date(cooldownUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      toast({
        title: "Cooldown Active",
        description: `You can send a connection request again after ${daysLeft} day(s). Please wait for the 3-week cooldown period to end.`,
        variant: "destructive",
      });
    }
  };

  // Check cooldown (3 weeks)
  if (cooldownUntil && new Date(cooldownUntil) > new Date()) {
    return (
      <Button variant={variant} size={size} className={`gap-2 ${className}`} onClick={handleCooldownConnect}>
        <UserPlus className="w-4 h-4" />
        Connect
      </Button>
    );
  }

  switch (status) {
    case "accepted":
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size={size}
            className={`gap-2 text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700 cursor-default ${className}`}
          >
            <Check className="w-4 h-4" />
            Connected
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowDisconnectDialog(true)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect from this profile?</AlertDialogTitle>
                <AlertDialogDescription>
                  If you disconnect, there will be a <span className="font-semibold">3-week cooldown</span> before you can send a new connection request to this person.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );

    case "pending_sent":
      return (
        <>
          <Button
            variant="outline"
            size={size}
            className={`gap-2 text-amber-600 border-amber-300 hover:bg-amber-50 ${className}`}
            onClick={() => setShowWithdrawDialog(true)}
          >
            <Clock className="w-4 h-4" />
            Pending
          </Button>

          <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Withdraw invitation</AlertDialogTitle>
                <AlertDialogDescription>
                  If you withdraw now, you won't be able to resend to this person for up to 3 weeks.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleWithdraw}>Withdraw</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );

    case "pending_received":
      return (
        <Button
          variant={variant}
          size={size}
          className={`gap-2 ${className}`}
          onClick={handleAccept}
        >
          <Check className="w-4 h-4" />
          Accept Request
        </Button>
      );

    case "rejected":
    case "none":
    default:
      return (
        <Button
          variant={variant}
          size={size}
          className={`gap-2 ${className}`}
          onClick={handleConnect}
        >
          <UserPlus className="w-4 h-4" />
          Connect
        </Button>
      );
  }
}
