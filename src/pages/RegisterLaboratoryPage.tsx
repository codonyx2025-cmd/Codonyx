import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Eye, EyeOff, FlaskConical } from "lucide-react";
import codonyxLogo from "@/assets/codonyx_logo.png";
import EmailVerificationField from "@/components/registration/EmailVerificationField";
import { RegistrationAvatarUpload } from "@/components/registration/RegistrationAvatarUpload";
import { TermsCheckbox } from "@/components/registration/TermsCheckbox";
import { ensureRegistrationUser } from "@/lib/ensureRegistrationUser";

export default function RegisterLaboratoryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

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

  // Lab-specific
  const [companyType, setCompanyType] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [researchAreas, setResearchAreas] = useState("");
  const [services, setServices] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // handleAvatarChange removed — using RegistrationAvatarUpload component

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
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    if (!researchAreas.trim()) {
      toast({ title: "Research Areas required", description: "Please add at least one research area.", variant: "destructive" });
      return;
    }
    if (!services.trim()) {
      toast({ title: "Services required", description: "Please add at least one service.", variant: "destructive" });
      return;
    }
    if (!agreedToTerms) {
      toast({ title: "Terms & Conditions required", description: "Please agree to the Terms & Conditions and Privacy Policy.", variant: "destructive" });
      return;
    }

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

      // Upload avatar + create profile in parallel
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

      const locationStr = [city, country].filter(Boolean).join(", ");

      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        full_name: fullName,
        email,
        contact_number: contactNumber || null,
        organisation: organisation || null,
        user_type: "laboratory" as any,
        approval_status: "pending" as const,
        bio: bio || null,
        avatar_url: uploadedAvatarUrl,
        location: locationStr || null,
        linkedin_url: linkedinUrl || null,
        company_type: companyType || null,
        website_url: websiteUrl || null,
        research_areas: researchAreas || null,
        services: services || null,
      });

      if (profileError) {
        console.error("Profile error:", profileError);
        toast({ title: "Profile creation failed", description: "Account created but profile setup failed.", variant: "destructive" });
        return;
      }

      // Fire-and-forget email
      supabase.functions.invoke("send-notification-email", {
        body: {
          type: "registration_submitted",
          recipientEmail: email,
          recipientName: fullName,
          userType: "laboratory",
        },
      }).catch((err) => console.error("Failed to send confirmation email:", err));

      await supabase.auth.signOut({ scope: "local" });
      setIsRegistered(true);
    } catch (error) {
      console.error("Registration error:", error);
      toast({ title: "Registration failed", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-medium text-foreground mb-3">Registration Submitted</h1>
          <p className="text-muted-foreground mb-2">Thank you for registering as a Laboratory.</p>
          <p className="text-muted-foreground mb-6">
            Your application is <span className="text-amber-600 font-medium">pending admin review</span>.
            You will receive an email once approved.
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
            Register Laboratory
          </h1>
          <p className="text-muted-foreground font-body mb-8">
            Register your laboratory to connect with expert advisors.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <RegistrationAvatarUpload
              avatarUrl={avatarUrl}
              onAvatarChange={(url, blob) => { setAvatarUrl(url); setAvatarBlob(blob); }}
            />

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
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider font-medium">Confirm *</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 pr-10" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
              <Label htmlFor="organisation" className="text-xs uppercase tracking-wider font-medium">Organisation / Company *</Label>
              <Input id="organisation" placeholder="Enter your organisation" value={organisation} onChange={(e) => setOrganisation(e.target.value)} className="h-12" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl" className="text-xs uppercase tracking-wider font-medium">LinkedIn Profile</Label>
              <Input id="linkedinUrl" type="url" placeholder="https://linkedin.com/in/yourprofile" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="h-12" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs uppercase tracking-wider font-medium">Bio</Label>
              <Textarea id="bio" placeholder="Tell us about your laboratory..." value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[80px]" />
            </div>

            {/* Lab-specific fields */}
            <div className="space-y-4 pt-4 border-t border-divider">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Laboratory Details</h3>
              <div className="space-y-2">
                <Label htmlFor="companyType" className="text-xs uppercase tracking-wider font-medium">Company Type *</Label>
                <Input id="companyType" placeholder="e.g., CRO, Biotech, Pharmaceutical" value={companyType} onChange={(e) => setCompanyType(e.target.value)} className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="text-xs uppercase tracking-wider font-medium">Company Website *</Label>
                <Input id="websiteUrl" type="url" placeholder="https://yourcompany.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="researchAreas" className="text-xs uppercase tracking-wider font-medium">Research Areas *</Label>
                <TagInput id="researchAreas" value={researchAreas} onChange={setResearchAreas} placeholder="Search or add research area (e.g., Oncology)" suggestionField="research_areas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="services" className="text-xs uppercase tracking-wider font-medium">Services Offered *</Label>
                <TagInput id="services" value={services} onChange={setServices} placeholder="Search or add service (e.g., Gene Sequencing)" suggestionField="services" />
              </div>
            </div>

            <TermsCheckbox checked={agreedToTerms} onCheckedChange={setAgreedToTerms} />

            <Button type="submit" variant="primary" className="w-full h-12 text-base" disabled={isSubmitting || !isEmailVerified || !agreedToTerms}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Registration"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline font-medium">Sign In</Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-navy via-navy/95 to-primary/20 items-center justify-center p-16">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-8">
            <FlaskConical className="w-10 h-10 text-emerald-glow" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Register Your Laboratory
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Join our platform and connect with world-class advisors in molecular science, AI healthcare, and beyond.
          </p>
          <div className="space-y-4 text-left">
            {[
              "Access expert advisors across 70+ countries",
              "AI-powered advisor matching for your needs",
              "Secure environment for confidential partnerships",
              "Dedicated laboratory dashboard",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-glow shrink-0" />
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
