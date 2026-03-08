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
  const [resetStep, setResetStep] = useState<"email" | "otp" | "password">("email");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

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

    if (resetStep === "email") {
      const trimmedEmail = forgotEmail.trim().toLowerCase();
      if (!trimmedEmail) return;

      setIsSendingReset(true);
      try {
        const { data, error } = await supabase.functions.invoke("reset-password-otp", {
          body: { action: "send", email: trimmedEmail },
        });

        if (error) {
          // Edge function returned non-2xx — parse the structured error from context
          let errorMsg = "Failed to send reset code.";
          try {
            const bodyText = await (error as any)?.context?.json?.() 
              ?? JSON.parse(await (error as any)?.context?.text?.());
            if (bodyText?.error) errorMsg = bodyText.error;
          } catch {
            // fallback
          }
          toast({
            title: "Account Not Found",
            description: errorMsg,
            variant: "destructive",
          });
        } else if (data?.error) {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
        } else {
          toast({ title: "Code sent", description: "Check your email for a 6-digit verification code." });
          setResetStep("otp");
        }
      } catch {
        toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
      } finally {
        setIsSendingReset(false);
      }
      return;
    }

    if (resetStep === "otp") {
      if (resetOtp.length !== 6) {
        toast({ title: "Invalid code", description: "Please enter the 6-digit code.", variant: "destructive" });
        return;
      }
      // Verify OTP with the server before proceeding
      setIsSendingReset(true);
      try {
        const { data, error } = await supabase.functions.invoke("reset-password-otp", {
          body: { action: "verify_code", email: forgotEmail.trim().toLowerCase(), code: resetOtp },
        });
        let errorMsg = "";
        if (error) {
          try {
            const bodyText = await (error as any)?.context?.json?.()
              ?? JSON.parse(await (error as any)?.context?.text?.());
            if (bodyText?.error) errorMsg = bodyText.error;
          } catch {
            errorMsg = "The verification code is incorrect. Please check and try again.";
          }
        } else if (data?.error) {
          errorMsg = data.error;
        }
        if (errorMsg) {
          toast({
            title: "Incorrect Code",
            description: errorMsg,
            variant: "destructive",
          });
          setResetOtp("");
          return;
        }
        setResetStep("password");
      } catch {
        toast({ title: "Error", description: "Could not verify code.", variant: "destructive" });
      } finally {
        setIsSendingReset(false);
      }
      return;
    }

    if (resetStep === "password") {
      if (resetPassword.length < 6) {
        toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
        return;
      }
      if (resetPassword !== resetConfirmPassword) {
        toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
        return;
      }

      setIsSendingReset(true);
      try {
        const { data, error } = await supabase.functions.invoke("reset-password-otp", {
          body: { action: "verify", email: forgotEmail.trim().toLowerCase(), code: resetOtp, newPassword: resetPassword },
        });

        if (error || data?.error) {
          toast({
            title: "Error",
            description: data?.error || error?.message || "Failed to reset password.",
            variant: "destructive",
          });
          // If code was invalid, go back to OTP step
          if (data?.error?.includes("Invalid") || data?.error?.includes("expired")) {
            setResetStep("otp");
            setResetOtp("");
          }
        } else {
          toast({ title: "Password updated!", description: "You can now sign in with your new password." });
          closeForgotPasswordDialog();
        }
      } catch {
        toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
      } finally {
        setIsSendingReset(false);
      }
    }
  };

  const closeForgotPasswordDialog = () => {
    setShowForgotPassword(false);
    setForgotEmail("");
    setResetStep("email");
    setResetOtp("");
    setResetPassword("");
    setResetConfirmPassword("");
    setShowResetPassword(false);
  };

  const handleGoogleSignIn = async () => {
    hasShownUnauthorizedToast.current = false;
    setIsGoogleLoading(true);

    try {
      const hostname = window.location.hostname;
      const isLovableHosted =
        hostname.endsWith(".lovable.app") ||
        hostname.endsWith(".lovableproject.com") ||
        hostname === "localhost";

      if (isLovableHosted) {
        const { error } = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: `${window.location.origin}/auth`,
          extraParams: {
            prompt: "select_account",
          },
        });

        if (error) {
          toast({
            title: "Google Sign-In Failed",
            description: error.message || "An error occurred.",
            variant: "destructive",
          });
        }

        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            prompt: "select_account",
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        toast({
          title: "Google Sign-In Failed",
          description: error.message || "An error occurred.",
          variant: "destructive",
        });
        return;
      }

      if (!data?.url) {
        toast({
          title: "Google Sign-In Failed",
          description: "Could not start Google sign-in.",
          variant: "destructive",
        });
        return;
      }

      const oauthUrl = new URL(data.url);
      const backendAuthHost = new URL(import.meta.env.VITE_SUPABASE_URL).hostname;

      if (
        oauthUrl.hostname !== backendAuthHost &&
        !oauthUrl.hostname.endsWith(".supabase.co") &&
        oauthUrl.hostname !== "accounts.google.com"
      ) {
        toast({
          title: "Google Sign-In Failed",
          description: "Invalid OAuth redirect URL.",
          variant: "destructive",
        });
        return;
      }

      window.location.assign(data.url);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Google Sign-In Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
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
            Advisors, Laboratories and Distributors can sign in below.
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
      <Dialog open={showForgotPassword} onOpenChange={(open) => { if (!open) closeForgotPasswordDialog(); else setShowForgotPassword(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Reset Password</DialogTitle>
            <DialogDescription>
              {resetStep === "email" && "Enter your email address and we'll send you a verification code."}
              {resetStep === "otp" && "Enter the 6-digit code sent to your email."}
              {resetStep === "password" && "Set your new password."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
            {resetStep === "email" && (
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
            )}

            {resetStep === "otp" && (
              <div className="space-y-2">
                <Label htmlFor="reset-otp">Verification Code</Label>
                <Input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">Code sent to {forgotEmail}</p>
              </div>
            )}

            {resetStep === "password" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="reset-new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="reset-new-password"
                      type={showResetPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="h-12 pr-12"
                      required
                    />
                    <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showResetPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-password">Confirm Password</Label>
                  <Input
                    id="reset-confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
              </>
            )}

            <Button type="submit" variant="primary" className="w-full h-12" disabled={isSendingReset}>
              {isSendingReset ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : resetStep === "email" ? (
                "Send Verification Code"
              ) : resetStep === "otp" ? (
                "Verify Code"
              ) : (
                "Update Password"
              )}
            </Button>

            {resetStep !== "email" && (
              <Button type="button" variant="ghost" className="w-full" onClick={() => {
                if (resetStep === "otp") { setResetStep("email"); setResetOtp(""); }
                else if (resetStep === "password") { setResetStep("otp"); }
              }}>
                Back
              </Button>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
