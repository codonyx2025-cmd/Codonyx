import { useState, useEffect, useRef, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { applyRememberMePreference, REMEMBER_ME_KEY } from "@/lib/rememberMe";

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
  const isFormSigningIn = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [rememberMe, setRememberMe] = useState(() => {
    try { return localStorage.getItem(REMEMBER_ME_KEY) !== "false"; } catch { return true; }
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "otp" | "password">("email");
  const [resetOtp, setResetOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setTimeout(() => setResetCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resetCooldown]);
  const unauthorizedDescription = "No approved account exists with this email. Please register first or contact support.";
  const deactivatedDescription = "Your account has been deactivated by an administrator. Please contact support for assistance.";
  const hasShownUnauthorizedToast = useRef(false);

  const showAccountNotFoundToast = (isDeactivated = false) => {
    if (hasShownUnauthorizedToast.current) return;
    hasShownUnauthorizedToast.current = true;
    toast({
      title: isDeactivated ? "Account Deactivated" : "Account Not Found",
      description: isDeactivated ? deactivatedDescription : unauthorizedDescription,
      variant: "destructive",
    });
  };

  const signOutUnauthorized = async (isDeactivated = false) => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      await supabase.auth.signOut({ scope: "local" });
    }
    showAccountNotFoundToast(isDeactivated);
  };

  const isSessionApproved = async (userId: string): Promise<{ approved: boolean; deactivated: boolean }> => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("approval_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) return { approved: false, deactivated: false };
    if (profile.approval_status === "deactivated") return { approved: false, deactivated: true };
    return { approved: profile.approval_status === "approved", deactivated: false };
  };

  const validateApprovedSession = async (userId: string) => {
    const { approved, deactivated } = await isSessionApproved(userId);
    if (!approved) {
      await signOutUnauthorized(deactivated);
      return false;
    }
    return true;
  };

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        // Race session check with a 3s timeout to prevent hanging
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
        ]);

        if (cancelled) return;

        const session = sessionResult && typeof sessionResult === 'object' && 'data' in sessionResult
          ? (sessionResult as any).data.session
          : null;

        if (session) {
          const approved = await validateApprovedSession(session.user.id);
          if (cancelled) return;
          if (approved) {
            navigate("/dashboard", { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
      }
      if (!cancelled) setIsCheckingAuth(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      // Skip if form-based sign-in is handling navigation
      if (isFormSigningIn.current) return;

      if (!session) {
        if (event === "SIGNED_OUT") {
          setIsCheckingAuth(false);
        }
        return;
      }

      // IMPORTANT: Do NOT await inside onAuthStateChange to prevent deadlocks.
      // Fire-and-forget the validation.
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        isSessionApproved(session.user.id).then(({ approved, deactivated }) => {
          if (cancelled) return;
          if (approved) {
            navigate("/dashboard", { replace: true });
          } else {
            signOutUnauthorized(deactivated);
            setIsCheckingAuth(false);
          }
        }).catch(() => {
          if (!cancelled) setIsCheckingAuth(false);
        });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    hasShownUnauthorizedToast.current = false;
    isFormSigningIn.current = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        isFormSigningIn.current = false;
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
        const { approved, deactivated } = await isSessionApproved(data.session.user.id);
        if (!approved) {
          isFormSigningIn.current = false;
          await signOutUnauthorized(deactivated);
          return;
        }
        // Persist the user's "Remember Me" choice for this session.
        applyRememberMePreference(rememberMe);
        // Navigate immediately - don't wait for onAuthStateChange
        navigate("/dashboard", { replace: true });
      } else {
        isFormSigningIn.current = false;
      }
    } catch (error: any) {
      isFormSigningIn.current = false;
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
          setResetCooldown(30);
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

        let errorMsg = "";
        if (error) {
          try {
            const bodyText = await (error as any)?.context?.json?.()
              ?? JSON.parse(await (error as any)?.context?.text?.());
            if (bodyText?.error) errorMsg = bodyText.error;
          } catch {
            errorMsg = "Failed to reset password. Please try again.";
          }
        } else if (data?.error) {
          errorMsg = data.error;
        }

        if (errorMsg) {
          toast({
            title: "Password Reset Failed",
            description: errorMsg,
            variant: "destructive",
          });
          if (errorMsg.includes("Invalid") || errorMsg.includes("expired")) {
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
    setResetCooldown(0);
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

  // Fallback: if auth check hangs for 2s, show the form. No auto-reload.
  useEffect(() => {
    if (!isCheckingAuth) return;
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isCheckingAuth]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-16 xl:px-24 py-12">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-lg p-6 sm:p-10">
          <Link to="/" className="inline-block mb-8">
            <img src={codonyxLogo} alt="Codonyx" className="h-14 w-auto" {...({ fetchpriority: "high" } as any)} decoding="sync" />
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(v === true)}
                  />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-medium gap-2" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12 mt-4 gap-3 text-base font-medium"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <img src={googleIcon} alt="Google" className="w-5 h-5" />
              )}
              Continue with Google
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            <Link to="/" className="text-primary hover:underline font-medium">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-16">
        <div className="max-w-md space-y-10">
          <div>
            <h2 className="font-display text-3xl font-medium text-foreground mb-3">
              Your Professional Network Awaits
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Join the most trusted platform connecting advisors, laboratories, and distributors.
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => !open && closeForgotPasswordDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {resetStep === "email" ? "Reset Password" : resetStep === "otp" ? "Enter Verification Code" : "Set New Password"}
            </DialogTitle>
            <DialogDescription>
              {resetStep === "email"
                ? "Enter your email address and we'll send you a verification code."
                : resetStep === "otp"
                ? <span>Enter the 6-digit code sent to <strong className="font-semibold text-foreground">{forgotEmail.trim().toLowerCase()}</strong>.</span>
                : "Choose a new password for your account."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 mt-2">
            {resetStep === "email" && (
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
            )}
            {resetStep === "otp" && (
              <div className="space-y-2">
                <Label>6-digit Code</Label>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg tracking-widest font-mono"
                  required
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    disabled={resetCooldown > 0 || isSendingReset}
                    onClick={async () => {
                      setIsSendingReset(true);
                      try {
                        const { error } = await supabase.functions.invoke("reset-password-otp", {
                          body: { action: "send", email: forgotEmail.trim().toLowerCase() },
                        });
                        if (!error) {
                          toast({ title: "New code sent" });
                          setResetCooldown(30);
                        }
                      } catch { /* ignore */ }
                      setIsSendingReset(false);
                    }}
                  >
                    {resetCooldown > 0 ? `Resend in ${resetCooldown}s` : "Resend code"}
                  </Button>
                </div>
              </div>
            )}
            {resetStep === "password" && (
              <>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showResetPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input
                    type={showResetPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            <Button type="submit" className="w-full" disabled={isSendingReset}>
              {isSendingReset ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {resetStep === "email" ? "Send Code" : resetStep === "otp" ? "Verify Code" : "Reset Password"}
            </Button>
            {resetStep !== "email" && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  if (resetStep === "password") setResetStep("otp");
                  else setResetStep("email");
                }}
              >
                Back
              </Button>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
