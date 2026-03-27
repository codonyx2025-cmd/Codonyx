import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { CustomFieldsSection } from "@/components/profile/CustomFieldsSection";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, User, Upload, Calendar, Linkedin } from "lucide-react";
import { BackButton } from "@/components/layout/BackButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropper } from "@/components/ui/image-cropper";
import { format } from "date-fns";

interface Profile {
  full_name: string;
  email: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  organisation: string | null;
  contact_number: string | null;
  avatar_url: string | null;
  user_type: string;
  created_at: string;
  linkedin_url: string | null;
  education: string | null;
  expertise: string | null;
  mentoring_areas: string | null;
  languages: string | null;
  industry_expertise: string | null;
  company_type: string | null;
  company_size: string | null;
  founded_year: number | null;
  website_url: string | null;
  services: string | null;
  research_areas: string | null;
}

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Form state - common fields
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Advisor specific fields
  const [education, setEducation] = useState("");
  const [expertise, setExpertise] = useState("");
  const [mentoringAreas, setMentoringAreas] = useState("");
  const [languages, setLanguages] = useState("");
  const [industryExpertise, setIndustryExpertise] = useState("");

  // Laboratory specific fields
  const [companyType, setCompanyType] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [services, setServices] = useState("");
  const [researchAreas, setResearchAreas] = useState("");

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
        setProfileId(profileData.id);
        setFullName(profileData.full_name || "");
        setHeadline(profileData.headline || "");
        setBio(profileData.bio || "");
        setLocation(profileData.location || "");
        setOrganisation(profileData.organisation || "");
        setContactNumber(profileData.contact_number || "");
        setLinkedinUrl(profileData.linkedin_url || "");
        setAvatarUrl(profileData.avatar_url);
        // Advisor fields
        setEducation(profileData.education || "");
        setExpertise(profileData.expertise || "");
        setMentoringAreas(profileData.mentoring_areas || "");
        setLanguages(profileData.languages || "");
        setIndustryExpertise(profileData.industry_expertise || "");
        // Laboratory fields
        setCompanyType(profileData.company_type || "");
        setCompanySize(profileData.company_size || "");
        setFoundedYear(profileData.founded_year?.toString() || "");
        setWebsiteUrl(profileData.website_url || "");
        setServices(profileData.services || "");
        setResearchAreas(profileData.research_areas || "");
      }
      setIsLoading(false);
    };

    checkAuthAndLoadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCroppedUpload = async (croppedBlob: Blob) => {
    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fileName = `${session.user.id}/avatar.jpg`;
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithCacheBuster);

      await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBuster })
        .eq("user_id", session.user.id);

      toast({ title: "Success", description: "Profile photo uploaded successfully." });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: "Failed to upload profile photo. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setPendingFile(null);
      setRawImageSrc(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const updateData: Record<string, unknown> = {
      full_name: fullName.trim(),
      headline: headline.trim() || null,
      bio: bio.trim() || null,
      location: location.trim() || null,
      organisation: organisation.trim() || null,
      contact_number: contactNumber.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
    };

    if (profile?.user_type === 'advisor') {
      updateData.education = education.trim() || null;
      updateData.expertise = expertise.trim() || null;
      updateData.mentoring_areas = mentoringAreas.trim() || null;
      updateData.languages = languages.trim() || null;
      updateData.industry_expertise = industryExpertise.trim() || null;
    }

    if (profile?.user_type === 'laboratory') {
      updateData.company_type = companyType.trim() || null;
      updateData.company_size = companySize.trim() || null;
      updateData.founded_year = foundedYear ? parseInt(foundedYear) : null;
      updateData.website_url = websiteUrl.trim() || null;
      updateData.services = services.trim() || null;
      updateData.research_areas = researchAreas.trim() || null;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", session.user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } else {
      // Save custom field values in a single upsert for reliability and performance
      let customValuesError: Error | null = null;
      if (profileId && Object.keys(customFieldValues).length > 0) {
        const upserts = Object.entries(customFieldValues).map(([fieldId, value]) => ({
          profile_id: profileId,
          field_id: fieldId,
          value: value.trim() || null,
        }));

        const { error: upsertError } = await supabase
          .from("custom_profile_values")
          .upsert(upserts, { onConflict: "profile_id,field_id" });

        customValuesError = upsertError;
      }

      if (customValuesError) {
        toast({
          title: "Partial update",
          description: "Profile updated, but additional details could not be saved. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Your profile has been updated.",
        });
      }
    }

    setIsSaving(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAdvisor = profile?.user_type === 'advisor';
  const isLaboratory = profile?.user_type === 'laboratory';

  return (
    <div className="min-h-screen bg-muted">
      <DashboardNavbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <BackButton />
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
                Edit Profile
              </h1>
              <p className="text-muted-foreground">
                Update your profile information visible to other members
              </p>
            </div>

            {/* Profile Card */}
            <div className="bg-background rounded-2xl border border-divider p-8">
              {/* Avatar Section with Upload */}
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-divider">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {fullName ? getInitials(fullName) : <User className="h-8 w-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div>
                  <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none" title={profile?.email}>{profile?.email}</p>
                  <p className="text-sm text-muted-foreground capitalize mb-2">
                    {profile?.user_type}
                  </p>
                  {profile?.created_at && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Member since {format(new Date(profile.created_at), 'MMMM yyyy')}
                    </p>
                  )}
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headline">Headline</Label>
                    <Input
                      id="headline"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g., CEO at TechCorp"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="organisation">Organisation</Label>
                    <Input
                      id="organisation"
                      value={organisation}
                      onChange={(e) => setOrganisation(e.target.value)}
                      placeholder="Company or institution"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., New York City"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl" className="flex items-center gap-1">
                      <Linkedin className="h-4 w-4" /> LinkedIn URL
                    </Label>
                    <Input
                      id="linkedinUrl"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself, your experience, and expertise..."
                    rows={4}
                  />
                </div>

                {/* Advisor Specific Fields */}
                {isAdvisor && (
                  <>
                    <div className="pt-4 border-t border-divider">
                      <h3 className="font-heading font-semibold text-foreground mb-4">Advisor Details</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="education">Education Institute</Label>
                      <TagInput
                        id="education"
                        value={education}
                        onChange={setEducation}
                        placeholder="Search or add education"
                        suggestionField="education"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expertise">Deep Area of Expertise</Label>
                      <TagInput
                        id="expertise"
                        value={expertise}
                        onChange={setExpertise}
                        placeholder="Search or add expertise"
                        suggestionField="expertise"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mentoringAreas">Functional Areas for Mentoring</Label>
                      <TagInput
                        id="mentoringAreas"
                        value={mentoringAreas}
                        onChange={setMentoringAreas}
                        placeholder="Search or add area"
                        suggestionField="mentoring_areas"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="languages">Languages</Label>
                      <TagInput
                        id="languages"
                        value={languages}
                        onChange={setLanguages}
                        placeholder="Search or add language"
                        suggestionField="languages"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industryExpertise">Industry Expertise</Label>
                      <TagInput
                        id="industryExpertise"
                        value={industryExpertise}
                        onChange={setIndustryExpertise}
                        placeholder="Search or add industry"
                        suggestionField="industry_expertise"
                      />
                    </div>
                  </>
                )}

                {/* Laboratory Specific Fields */}
                {isLaboratory && (
                  <>
                    <div className="pt-4 border-t border-divider">
                      <h3 className="font-heading font-semibold text-foreground mb-4">Company Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="companyType">Company Type</Label>
                        <Input
                          id="companyType"
                          value={companyType}
                          onChange={(e) => setCompanyType(e.target.value)}
                          placeholder="e.g., Startup, Research Lab"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="companySize">Company Size</Label>
                        <Input
                          id="companySize"
                          value={companySize}
                          onChange={(e) => setCompanySize(e.target.value)}
                          placeholder="e.g., 1-10, 11-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="foundedYear">Founded Year</Label>
                        <Input
                          id="foundedYear"
                          type="number"
                          value={foundedYear}
                          onChange={(e) => setFoundedYear(e.target.value)}
                          placeholder="e.g., 2020"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="websiteUrl">Website URL</Label>
                        <Input
                          id="websiteUrl"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://yourcompany.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="services">Services Offered</Label>
                      <TagInput
                        id="services"
                        value={services}
                        onChange={setServices}
                        placeholder="Search or add service"
                        suggestionField="services"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="researchAreas">Research Areas / Focus</Label>
                      <TagInput
                        id="researchAreas"
                        value={researchAreas}
                        onChange={setResearchAreas}
                        placeholder="Search or add research area"
                        suggestionField="research_areas"
                      />
                    </div>
                  </>
                )}

                {/* Admin-defined Custom Fields */}
                {profileId && profile?.user_type && (
                  <CustomFieldsSection
                    profileId={profileId}
                    userType={profile.user_type}
                    onValuesChange={setCustomFieldValues}
                  />
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !fullName.trim()}
                    variant="primary"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
