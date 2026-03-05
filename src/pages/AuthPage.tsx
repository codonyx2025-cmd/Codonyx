import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

import { toast } from "@/hooks/use-toast";
import { ArrowRight, Target, MessageCircle, Handshake, Loader2, Eye, EyeOff } from "lucide-react";
import codonyxLogo from "@/assets/codonyx_logo.png";
import googleIcon from "@/assets/google-icon.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const features = [
  {
    icon: Target,
    title: "Exclusive Network",
    description: "Access a curated community of verified professionals",
  },
  {
    icon: MessageCircle,
    title: "Direct Connections",
    description: "Connect with advisors and laboratories worldwide",
  },
  {
    icon: Handshake,
    title: "Private Collaboration",
    description: "Secure environment for confidential partnerships",
  },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const unauthorizedDescription = "No approved account exists with this email. Please register first or contact support.";
  const hasShownUnauthorizedToast = useRef(false);

  const showAccountNotFoundToast = () => {
    if (hasShownUnauthorizedToast.current) return;
    hasShownUnauthorizedToast.current = true;
    toast({
      title: "Account Not Found",
      description: unauthorizedDescription,
      variant: "destructive",
    });
  };

  const signOutUnauthorized = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      await supabase.auth.signOut({ scope: "local" });
    }
    showAccountNotFoundToast();
  };

  const isSessionApproved = async (userId: string) => {
    const { data: isApproved, error } = await supabase.rpc("is_user_approved", {
      _user_id: userId,
    });

    if (error) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("approval_status")
        .eq("user_id", userId)
        .maybeSingle();
      return profile?.approval_status === "approved";
    }

    return Boolean(isApproved);
  };

  const validateApprovedSession = async (userId: string) => {
    const approved = await isSessionApproved(userId);
    if (!approved) {
      await signOutUnauthorized();
      return false;
    }
    return true;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const approved = await validateApprovedSession(session.user.id);
        if (approved) {
          navigate("/dashboard", { replace: true });
          return;
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        if (event === "SIGNED_OUT") {
          setIsCheckingAuth(false);
        }
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        setTimeout(async () => {
          const approved = await validateApprovedSession(session.user.id);
          if (approved) {
            navigate("/dashboard", { replace: true });
            return;
          }
          setIsCheckingAuth(false);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    hasShownUnauthorizedToast.current = false;

    try {
      // Check if session already exists before attempting sign in
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        const approved = await validateApprovedSession(existingSession.user.id);
        if (approved) {
          navigate("/dashboard", { replace: true });
          return;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        let errorMessage = error.message;
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email to confirm your account before signing in.";
        }
        toast({
          title: "Sign in failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data.session) {
        const approved = await validateApprovedSession(data.session.user.id);
        if (!approved) {
          return;
        }
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      const isNetworkError = error?.message?.includes("Failed to fetch") || error?.message?.includes("NetworkError");
      toast({
        title: "Sign in failed",
        description: isNetworkError
          ? "Network error. Please check your internet connection and try again."
          : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = forgotEmail.trim().toLowerCase();
    if (!trimmedEmail) return;

    setIsSendingReset(true);
    try {
      // Check if email exists using SECURITY DEFINER function (bypasses RLS)
      const { data: exists, error: checkError } = await supabase.rpc("check_email_exists", {
        check_email: trimmedEmail,
      });

        if (checkError || !exists) {
          toast({
            title: "Account Not Found",
            description: "No approved account exists with this email address.",
          variant: "destructive",
        });
        setIsSendingReset(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset link sent",
          description: "Check your email for a password reset link.",
        });
        setShowForgotPassword(false);
        setForgotEmail("");
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleGoogleSignIn = async () => {
    hasShownUnauthorizedToast.current = false;
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
        extraParams: {
          prompt: "select_account",
        },
      });
      if (error) {
        toast({ title: "Google Sign-In Failed", description: error.message || "An error occurred.", variant: "destructive" });
        setIsGoogleLoading(false);
        return;
      }
      // OAuth will redirect, the onAuthStateChange listener handles the rest
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({ title: "Google Sign-In Failed", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Auto-refresh after 1 second if stuck on loading
  useEffect(() => {
    if (!isCheckingAuth) return;
    const hasRefreshed = sessionStorage.getItem("auth_page_refreshed");
    const timer = setTimeout(() => {
      if (isCheckingAuth && !hasRefreshed) {
        sessionStorage.setItem("auth_page_refreshed", "true");
        window.location.reload();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isCheckingAuth]);

  // Clear refresh flag when auth check completes
  useEffect(() => {
    if (!isCheckingAuth) {
      sessionStorage.removeItem("auth_page_refreshed");
    }
  }, [isCheckingAuth]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-24 py-12 bg-background">
        <div className="max-w-md mx-auto w-full">
          <Link to="/" className="inline-block mb-12">
            <img src={codonyxLogo} alt="Codonyx" className="h-14 w-auto" />
          </Link>

          <h1 className="font-display text-3xl lg:text-4xl font-medium text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-muted-foreground font-body mb-8">
            Advisors and Laboratories can sign in below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
              >
                Forgot password
              </button>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base gap-3"
            disabled={isGoogleLoading}
            onClick={handleGoogleSignIn}
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <img src={googleIcon} alt="Google" className="w-5 h-5" />
            )}
            Continue with Google
          </Button>

          <p className="mt-8 text-xs text-center text-muted-foreground">
            Access is by invitation only. Contact your network administrator for an invite.
          </p>
        </div>
      </div>

      {/* Right Panel - Features */}
      <div className="hidden lg:flex w-1/2 bg-foreground text-background p-12 xl:p-16 flex-col justify-center">
        <div className="max-w-md">
          <div className="space-y-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-background/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-background" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-lg font-medium">{feature.title}</h3>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-background/70 text-sm font-body">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a password reset link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>
            <Button type="submit" variant="primary" className="w-full h-12" disabled={isSendingReset}>
              {isSendingReset ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
