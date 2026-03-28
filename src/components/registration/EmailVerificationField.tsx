import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Send } from "lucide-react";

interface EmailVerificationFieldProps {
  email: string;
  onEmailChange: (email: string) => void;
  isVerified: boolean;
  onVerified: (verified: boolean) => void;
}

export default function EmailVerificationField({
  email,
  onEmailChange,
  isVerified,
  onVerified,
}: EmailVerificationFieldProps) {
  const [isSending, setIsSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-verification-code", {
        body: { email: email.trim().toLowerCase() },
      });

      // Handle non-2xx responses (409 email_exists comes back as error with context)
      if (error) {
        // Try to parse the error context for structured errors like email_exists
        const errorMessage = (error as any)?.context?.body
          ? await (error as any).context.text().catch(() => null)
          : null;
        
        if (errorMessage) {
          try {
            const parsed = JSON.parse(errorMessage);
            if (parsed?.error === "email_exists") {
              toast({ title: "Email already registered", description: parsed.message || "This email is already registered. Please use a different email.", variant: "destructive" });
              return;
            }
          } catch {}
        }
        
        toast({ title: "Failed to send code", description: "Please try again.", variant: "destructive" });
        return;
      }
      
      if (!data?.success) {
        toast({ title: "Failed to send code", description: data?.message || data?.error || "Please try again.", variant: "destructive" });
        return;
      }

      setCodeSent(true);
      toast({ title: "Code sent!", description: `A verification code has been sent to ${email}.` });
    } catch (err) {
      toast({ title: "Error", description: "Could not send verification code.", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-verification-code", {
        body: { email: email.trim().toLowerCase(), action: "verify", code: verificationCode },
      });

      let errorMsg = "";
      if (error) {
        try {
          const bodyText = await (error as any)?.context?.json?.()
            ?? JSON.parse(await (error as any)?.context?.text?.());
          if (bodyText?.error) errorMsg = bodyText.error;
        } catch {
          errorMsg = "The verification code is incorrect. Please try again.";
        }
      } else if (data && !data.success) {
        errorMsg = data.error || "The verification code is incorrect. Please try again.";
      }

      if (errorMsg) {
        toast({ title: "Incorrect Code", description: errorMsg, variant: "destructive" });
        return;
      }

      onVerified(true);
      toast({ title: "Email verified!", description: "Your email has been successfully verified." });
    } catch (err) {
      toast({ title: "Error", description: "Could not verify code.", variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs uppercase tracking-wider font-medium">
          Email *
        </Label>
        <div className="flex gap-2">
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              onEmailChange(e.target.value);
              if (isVerified) onVerified(false);
              setCodeSent(false);
              setVerificationCode("");
            }}
            className="h-12 flex-1"
            required
            disabled={isVerified}
          />
          {!isVerified ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 px-4 shrink-0"
              onClick={handleSendCode}
              disabled={isSending || !email}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1.5" />
                  Verify
                </>
              )}
            </Button>
          ) : (
            <div className="h-12 px-4 flex items-center text-primary shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {codeSent && !isVerified && (
        <div className="space-y-2">
          <Label htmlFor="verificationCode" className="text-xs uppercase tracking-wider font-medium">
            Verification Code *
          </Label>
          <div className="flex gap-2">
            <Input
              id="verificationCode"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-12 flex-1 tracking-widest text-center font-mono text-lg"
              maxLength={6}
            />
            <Button
              type="button"
              variant="primary"
              className="h-12 px-6 shrink-0"
              onClick={handleVerifyCode}
              disabled={verificationCode.length !== 6 || isVerifying}
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Check your inbox for a 6-digit verification code.{" "}
            <button type="button" onClick={handleSendCode} className="text-primary hover:underline" disabled={isSending}>
              Resend code
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
