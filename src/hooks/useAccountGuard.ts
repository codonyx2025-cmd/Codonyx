import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { fetchOwnProfile } from "@/lib/auth";

/**
 * Periodically checks if the logged-in user's account is still approved.
 * If the account is deactivated/deleted, shows a warning and redirects to /auth.
 */
export function useAccountGuard(intervalMs = 30_000) {
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const isHandlingRef = useRef(false);

  useEffect(() => {
    const check = async () => {
      if (isHandlingRef.current) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile, error } = await fetchOwnProfile<{ approval_status: "pending" | "approved" | "rejected" | "deactivated" }>(
        session.user.id,
        "approval_status",
        2
      );

      if (error) return; // network error — skip

      if (!profile) {
        isHandlingRef.current = true;
        // Account deleted
        await supabase.auth.signOut({ scope: "local" });
        toast({ title: "Account not found", description: "Your account has been removed. Please contact support.", variant: "destructive" });
        navigate("/auth", { replace: true });
        return;
      }

      if (profile.approval_status === "deactivated") {
        isHandlingRef.current = true;
        await supabase.auth.signOut({ scope: "local" });
        toast({ title: "Account Deactivated", description: "Your account has been deactivated by an administrator.", variant: "destructive" });
        navigate("/auth", { replace: true });
        return;
      }

      if (profile.approval_status === "rejected") {
        isHandlingRef.current = true;
        await supabase.auth.signOut({ scope: "local" });
        toast({ title: "Account Rejected", description: "Your account has been rejected. Please contact support.", variant: "destructive" });
        navigate("/auth", { replace: true });
        return;
      }
    };

    // Check once on mount
    check();
    // Then periodically
    intervalRef.current = setInterval(check, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [navigate, intervalMs]);
}
