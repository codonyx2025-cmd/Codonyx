import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, Target, MessageCircle, Handshake, CheckCircle, Loader2, XCircle, Eye, EyeOff } from "lucide-react";
import codonyxLogo from "@/assets/codonyx_logo.png";
import EmailVerificationField from "@/components/registration/EmailVerificationField";
import { RegistrationAvatarUpload } from "@/components/registration/RegistrationAvatarUpload";
import { ensureRegistrationUser } from "@/lib/ensureRegistrationUser";

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

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [contactNumber, setContactNumber] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);

  // Advisor-specific fields
  const [expertise, setExpertise] = useState("");
  const [experience, setExperience] = useState("");

  // Validate invite token
  useEffect(() => {
    const validateToken = async () => {
      if (!inviteToken) {
        setIsValidatingToken(false);
        setIsTokenValid(false);
        return;
      }

      try {
        // Clear any stale auth session that might interfere with the query
        await supabase.auth.signOut();

        const { data: rows, error } = await supabase
          .rpc("validate_invite_token_lookup", { _token: inviteToken });
        const data = rows && rows.length > 0 ? rows[0] : null;

        if (error) {
          console.error("Token validation error:", error);
          setIsTokenValid(false);
        } else if (!data) {
          setIsTokenValid(false);
        } else if (!data.is_active || data.used_at || new Date(data.expires_at) < new Date()) {
          setIsTokenValid(false);
        } else {
          setIsTokenValid(true);
          setTokenId(data.id);
        }
      } catch (err) {
        console.error("Token validation exception:", err);
        setIsTokenValid(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailVerified) {
      toast({ title: "Email not verified", description: "Please verify your email before submitting.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (!expertise.trim()) {
      toast({ title: "Areas of Expertise required", description: "Please add at least one area of expertise.", variant: "destructive" });
      return;
    }
    // Experience is now optional

    setIsSubmitting(true);

    try {
      const { userId, error: registrationError } = await ensureRegistrationUser(email, password);

      if (!userId) {
        toast({
          title: "Registration failed",
          description: registrationError || "Could not create account.",
          variant: "destructive",
        });
        return;
      }

      // Upload avatar in parallel with profile creation
      const locationStr = [city, country].filter(Boolean).join(", ");

      const avatarUploadPromise = avatarBlob
        ? (async () => {
            const filePath = `${userId}/avatar.jpg`;
            const file = new File([avatarBlob], "avatar.jpg", { type: "image/jpeg" });
            const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
              return urlData.publicUrl;
            }
            return null;
          })()
        : Promise.resolve(null);

      const [uploadedAvatarUrl] = await Promise.all([avatarUploadPromise]);

      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        full_name: fullName,
        email,
        contact_number: contactNumber || null,
        organisation: organisation || null,
        user_type: "advisor" as const,
        approval_status: "pending" as const,
        invite_token_id: tokenId,
        location: locationStr || null,
        bio: bio || null,
        linkedin_url: linkedinUrl || null,
        avatar_url: uploadedAvatarUrl,
        expertise: expertise || null,
        experience: experience || null,
      });

      if (profileError) {
        console.error("Profile error:", profileError);
        toast({ title: "Profile creation failed", description: "Account created but profile setup failed.", variant: "destructive" });
        return;
      }

      // Fire-and-forget: send email in background, don't block the UI
      supabase.functions.invoke("send-notification-email", {
        body: {
          type: "registration_submitted",
          recipientEmail: email,
          recipientName: fullName,
          userType: "advisor",
        },
      }).catch((err) => console.error("Failed to send confirmation email:", err));

      await supabase.auth.signOut();
      setIsRegistered(true);
    } catch (error) {
      console.error("Registration error:", error);
      toast({ title: "Registration failed", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-medium text-foreground mb-3">Invalid Invitation</h1>
          <p className="text-muted-foreground mb-6">
            This invitation link is invalid, expired, or has already been used.
            Please contact your network administrator for a new invitation.
          </p>
          <Link to="/"><Button variant="outline">Return to Homepage</Button></Link>
        </div>
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-medium text-foreground mb-3">Registration Submitted</h1>
          <p className="text-muted-foreground mb-2">Thank you for registering with Codonyx.</p>
          <p className="text-muted-foreground mb-6">
            Your request is currently <span className="text-amber-600 font-medium">pending admin approval</span>.
            You will receive an email once your account has been approved.
          </p>
          <Link to="/"><Button variant="primary">Return to Homepage</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col px-8 lg:px-16 xl:px-24 py-12 bg-background overflow-y-auto max-h-screen">
        <div className="max-w-md mx-auto w-full">
          <Link to="/" className="inline-block mb-8">
            <img src={codonyxLogo} alt="Codonyx" className="h-12 w-auto" />
          </Link>

          <h1 className="font-display text-3xl lg:text-4xl font-medium text-foreground mb-2">
            Join as Advisor
          </h1>
          <p className="text-muted-foreground font-body mb-8">
            Complete your registration to join the advisor network.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-medium">Profile Picture</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-muted"><User className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                </Avatar>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4" /> Upload Photo
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs uppercase tracking-wider font-medium">Full Name *</Label>
              <Input id="fullName" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12" required />
            </div>

            <EmailVerificationField email={email} onEmailChange={setEmail} isVerified={isEmailVerified} onVerified={setIsEmailVerified} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider font-medium">Password *</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider font-medium">Confirm *</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 pr-10" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-xs uppercase tracking-wider font-medium">Country *</Label>
                <Input id="country" placeholder="Enter your country" value={country} onChange={(e) => setCountry(e.target.value)} className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs uppercase tracking-wider font-medium">City *</Label>
                <Input id="city" placeholder="Enter your city" value={city} onChange={(e) => setCity(e.target.value)} className="h-12" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber" className="text-xs uppercase tracking-wider font-medium">Contact Number *</Label>
              <Input id="contactNumber" type="tel" placeholder="Enter your phone number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="h-12" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl" className="text-xs uppercase tracking-wider font-medium">LinkedIn Profile</Label>
              <Input id="linkedinUrl" type="url" placeholder="https://linkedin.com/in/yourprofile" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="h-12" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs uppercase tracking-wider font-medium">Bio</Label>
              <Textarea id="bio" placeholder="Tell us about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[100px]" />
            </div>

            {/* Advisor-specific fields */}
            <div className="space-y-4 pt-4 border-t border-divider">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Advisor Details</h3>
              <div className="space-y-2">
                <Label htmlFor="organisation" className="text-xs uppercase tracking-wider font-medium">Organisation / Company *</Label>
                <Input id="organisation" placeholder="Enter your organisation" value={organisation} onChange={(e) => setOrganisation(e.target.value)} className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expertise" className="text-xs uppercase tracking-wider font-medium">Areas of Expertise *</Label>
                <TagInput id="expertise" value={expertise} onChange={setExpertise} placeholder="Search or add expertise (e.g., Biotechnology)" suggestionField="expertise" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-xs uppercase tracking-wider font-medium">Experience / Background</Label>
                <TagInput id="experience" value={experience} onChange={setExperience} placeholder="Search or add experience (e.g., Clinical Trials)" suggestionField="experience" />
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full h-12 text-base" disabled={isSubmitting || isUploading || !isEmailVerified}>
              {isSubmitting || isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isUploading ? "Uploading..." : "Registering..."}</>
              ) : (
                "Submit Registration"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-divider text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline font-medium">Sign In</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:flex w-1/2 bg-foreground text-background p-12 xl:p-16 flex-col justify-center fixed right-0 top-0 bottom-0">
        <div className="max-w-md">
          <div className="space-y-8">
            {features.map((feature, index) => (
              <div key={feature.title} className="flex items-start gap-4 group cursor-pointer" style={{ animationDelay: `${index * 0.1}s` }}>
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
    </div>
  );
}
