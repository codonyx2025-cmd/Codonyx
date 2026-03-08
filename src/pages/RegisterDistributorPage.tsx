import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Eye, EyeOff, Upload, User, Truck, FileText } from "lucide-react";
import codonyxLogo from "@/assets/codonyx_logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EmailVerificationField from "@/components/registration/EmailVerificationField";
import { ensureRegistrationUser } from "@/lib/ensureRegistrationUser";

export default function RegisterDistributorPage() {
  const navigate = useNavigate();
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
  const [companyName, setCompanyName] = useState("");
  const [region, setRegion] = useState("");
  const [distributionCapacity, setDistributionCapacity] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

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

    setIsSubmitting(true);
    try {
      let userId: string;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });

      if (authError) {
        if (authError.message?.includes("already registered") || (authError as any)?.code === "user_already_exists") {
          const { data: fnData, error: fnError } = await supabase.functions.invoke("handle-existing-auth-user", {
            body: { email, password },
          });
          if (fnError || !fnData?.user_id) {
            let errorMsg = "This email is already registered. Please try signing in instead.";
            if (fnError) {
              try {
                const bodyText = await (fnError as any)?.context?.json?.() ?? JSON.parse(await (fnError as any)?.context?.text?.());
                if (bodyText?.error) errorMsg = bodyText.error;
              } catch { /* use default */ }
            }
            toast({ title: "Registration failed", description: errorMsg, variant: "destructive" });
            return;
          }
          userId = fnData.user_id;
        } else {
          toast({ title: "Registration failed", description: authError.message || "Could not create account.", variant: "destructive" });
          return;
        }
      } else if (!authData.user) {
        toast({ title: "Registration failed", description: "Could not create account.", variant: "destructive" });
        return;
      } else {
        userId = authData.user.id;
      }

      let uploadedAvatarUrl = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${userId}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
          uploadedAvatarUrl = urlData.publicUrl;
        }
      }

      let verificationDocUrl = null;
      if (verificationDoc) {
        const fileExt = verificationDoc.name.split(".").pop();
        const filePath = `${userId}/verification.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("verification-documents").upload(filePath, verificationDoc, { upsert: true });
        if (!uploadError) {
          // Store the file path (not a public URL since bucket is private)
          verificationDocUrl = filePath;
        }
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        full_name: fullName,
        email,
        contact_number: contactNumber || null,
        organisation: companyName || null,
        user_type: "distributor" as any,
        approval_status: "pending" as const,
        bio: bio || null,
        avatar_url: uploadedAvatarUrl,
        region: region || null,
        distribution_capacity: distributionCapacity || null,
        years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
        verification_document_url: verificationDocUrl,
      } as any);

      if (profileError) {
        console.error("Profile error:", profileError);
        toast({ title: "Profile creation failed", description: "Account created but profile setup failed.", variant: "destructive" });
        return;
      }

      // Send registration submitted email before signing out
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            type: "registration_submitted",
            recipientEmail: email,
            recipientName: fullName,
            userType: "distributor",
          },
        });
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
      }

      await supabase.auth.signOut();

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
          <p className="text-muted-foreground mb-2">Thank you for registering as a Distribution Partner.</p>
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
            Distribution Partner
          </h1>
          <p className="text-muted-foreground font-body mb-8">
            Register to become a Codonyx distribution partner and access deals.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar */}
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

            <EmailVerificationField
              email={email}
              onEmailChange={setEmail}
              isVerified={isEmailVerified}
              onVerified={setIsEmailVerified}
            />

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

            <div className="space-y-2">
              <Label htmlFor="contactNumber" className="text-xs uppercase tracking-wider font-medium">Phone Number *</Label>
              <Input id="contactNumber" type="tel" placeholder="Enter phone number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="h-12" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-xs uppercase tracking-wider font-medium">Company Name *</Label>
              <Input id="companyName" placeholder="Enter your company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-12" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region" className="text-xs uppercase tracking-wider font-medium">Region *</Label>
                <Input id="region" placeholder="e.g. South Asia" value={region} onChange={(e) => setRegion(e.target.value)} className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience" className="text-xs uppercase tracking-wider font-medium">Years of Experience *</Label>
                <Input id="yearsOfExperience" type="number" min="0" placeholder="e.g. 5" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} className="h-12" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distributionCapacity" className="text-xs uppercase tracking-wider font-medium">Distribution Capacity *</Label>
              <Input id="distributionCapacity" placeholder="e.g. National, Regional, International" value={distributionCapacity} onChange={(e) => setDistributionCapacity(e.target.value)} className="h-12" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs uppercase tracking-wider font-medium">About Your Business</Label>
              <Textarea id="bio" placeholder="Brief description of your distribution business..." value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[80px]" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-medium">Verification Document *</Label>
              <p className="text-xs text-muted-foreground">Upload a business registration certificate, GST certificate, or company ID for verification.</p>
              <label className="cursor-pointer">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast({ title: "File too large", description: "Max 10MB.", variant: "destructive" });
                      return;
                    }
                    setVerificationDoc(file);
                  }
                }} />
                <div className="flex items-center gap-2 px-4 py-3 border border-input rounded-md text-sm font-medium hover:bg-muted transition-colors">
                  <FileText className="h-4 w-4" />
                  {verificationDoc ? verificationDoc.name : "Upload Document"}
                </div>
              </label>
            </div>

            <Button type="submit" variant="primary" className="w-full h-12 text-base" disabled={isSubmitting || !isEmailVerified || !verificationDoc}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Application"}
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
            <Truck className="w-10 h-10 text-emerald-glow" />
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Become a Distribution Partner
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Join our network of distribution partners and gain access to exclusive deals in the molecular science and AI healthcare space.
          </p>
          <div className="space-y-4 text-left">
            {[
              "Access exclusive deals published by Codonyx",
              "Place bids and commit amounts on opportunities",
              "Track your commitments and deal progress",
              "Dedicated distributor dashboard",
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
