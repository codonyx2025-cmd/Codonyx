import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { showSuccessToast, showErrorToast } from "@/components/ui/animated-toast";
import { Check, X, Building2, Phone, Mail, MapPin, Clock, Link2, Copy, CalendarIcon, Power, Eye, Settings2, Trash2, Ban } from "lucide-react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { Footer } from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PendingUserDetailModal } from "@/components/admin/PendingUserDetailModal";
import { CustomFieldsManager } from "@/components/admin/CustomFieldsManager";
import { KeywordSuggestionsManager } from "@/components/admin/KeywordSuggestionsManager";
import { BackButton } from "@/components/layout/BackButton";
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

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  contact_number: string | null;
  organisation: string | null;
  user_type: "advisor" | "laboratory" | "distributor";
  created_at: string;
  location: string | null;
  headline: string | null;
  bio: string | null;
  approval_status: "pending" | "approved" | "rejected" | "deactivated";
  avatar_url: string | null;
  company_type: string | null;
  linkedin_url: string | null;
  education: string | null;
  expertise: string | null;
  experience: string | null;
  mentoring_areas: string | null;
  languages: string | null;
  industry_expertise: string | null;
  company_size: string | null;
  founded_year: number | null;
  website_url: string | null;
  services: string | null;
  research_areas: string | null;
  region: string | null;
  distribution_capacity: string | null;
  years_of_experience: number | null;
  verification_document_url: string | null;
}

interface InviteConfig {
  id: string;
  token: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  used_by: string | null;
}

const FIXED_INVITE_PATH = `/register?invite=codonyx-invite-${new Date().getFullYear()}`;

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allAdvisors, setAllAdvisors] = useState<PendingUser[]>([]);
  const [allLabs, setAllLabs] = useState<PendingUser[]>([]);
  const [allDistributors, setAllDistributors] = useState<PendingUser[]>([]);
  const [inviteConfig, setInviteConfig] = useState<InviteConfig | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [dealBids, setDealBids] = useState<any[]>([]);
  const [aggregateStats, setAggregateStats] = useState<{ approved_distributors: number; unique_bidders: number; total_subscription: number; total_target: number }>({ approved_distributors: 0, unique_bidders: 0, total_subscription: 0, total_target: 0 });
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date>(addDays(new Date(), 7));
  const [saving, setSaving] = useState(false);
  const [advisorStatusFilter, setAdvisorStatusFilter] = useState<string>("all");
  const [labStatusFilter, setLabStatusFilter] = useState<string>("all");
  const [selectedPendingUser, setSelectedPendingUser] = useState<PendingUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [distributorStatusFilter, setDistributorStatusFilter] = useState<string>("all");
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealDescription, setNewDealDescription] = useState("");
  const [newDealTarget, setNewDealTarget] = useState("");
  const [newDealDocFile, setNewDealDocFile] = useState<File | null>(null);
  const [newDealMinBid, setNewDealMinBid] = useState("");
  const [newDealCurrency, setNewDealCurrency] = useState<"INR" | "USD">("INR");
  const [accountAction, setAccountAction] = useState<{ user: PendingUser; type: "deactivate" | "delete" } | null>(null);
  const [showDealConfirm, setShowDealConfirm] = useState(false);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [selectedBidDetail, setSelectedBidDetail] = useState<any>(null);
  const [selectedDealDetail, setSelectedDealDetail] = useState<any>(null);
  const [dealDeleteConfirm, setDealDeleteConfirm] = useState<any>(null);
  // Deal filters
  const [dealSearchTerm, setDealSearchTerm] = useState("");
  const [dealStatusFilter, setDealStatusFilter] = useState("all");
  const [dealCurrencyFilter, setDealCurrencyFilter] = useState("all");
  const [dealSortBy, setDealSortBy] = useState<"date" | "price">("date");
  const [dealSortOrder, setDealSortOrder] = useState<"desc" | "asc">("desc");
  const [dealShowCount, setDealShowCount] = useState(15);
  // Bid filters
  const [bidSearchTerm, setBidSearchTerm] = useState("");
  const [bidStatusFilter, setBidStatusFilter] = useState("all");
  const [bidCurrencyFilter, setBidCurrencyFilter] = useState("all");
  const [bidSortBy, setBidSortBy] = useState<"date" | "amount">("date");
  const [bidSortOrder, setBidSortOrder] = useState<"desc" | "asc">("desc");
  const [bidShowCount, setBidShowCount] = useState(15);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchPendingUsers();
        fetchAllUsers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        fetchDeals();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deal_bids' }, () => {
        fetchDeals();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: hasAdminRole, error } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (error || !hasAdminRole) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    fetchPendingUsers();
    fetchInviteConfig();
    fetchAllUsers();
    fetchDeals();
  };

  const fetchAllUsers = async () => {
    setUsersLoading(true);

    // Fetch admin user IDs to exclude from listings
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminUserIds = new Set((adminRoles || []).map((r) => r.user_id));
    
    const { data: advisors } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "advisor")
      .order("full_name");
    
    const { data: labs } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "laboratory")
      .order("full_name");

    const { data: distributors } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "distributor")
      .order("full_name");
    
    const filterAdmins = (users: any[]) => users.filter((u) => !adminUserIds.has(u.user_id));
    
    setAllAdvisors(filterAdmins(advisors || []));
    setAllLabs(filterAdmins(labs || []));
    setAllDistributors(filterAdmins(distributors || []));
    setUsersLoading(false);
  };

  const fetchDeals = async () => {
    const { data: dealsData } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });
    setDeals(dealsData || []);

    const { data: bidsData } = await supabase
      .from("deal_bids")
      .select("*, profiles:distributor_profile_id(id, full_name, organisation, avatar_url)")
      .order("created_at", { ascending: false });
    setDealBids(bidsData || []);

    // Fetch aggregate stats via RPC for consistent indicators
    const { data: statsData } = await supabase.rpc('get_deal_aggregate_stats');
    if (statsData) {
      setAggregateStats(statsData as unknown as typeof aggregateStats);
    }
  };

  const handleDealDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 20MB.", variant: "destructive" });
        return;
      }
      setNewDealDocFile(file);
    }
  };

  const handleCreateDeal = async () => {
    if (!newDealTitle || !newDealTarget) return;
    
    const targetAmount = parseFloat(newDealTarget);
    if (newDealMinBid && parseFloat(newDealMinBid) >= targetAmount) {
      showErrorToast("Invalid Minimum Bid", { description: "Minimum Bid Amount must be less than the Target Amount.", duration: 5000 });
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();

    let documentUrl: string | null = null;
    if (newDealDocFile) {
      const fileExt = newDealDocFile.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("deal-documents").upload(filePath, newDealDocFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("deal-documents").getPublicUrl(filePath);
        documentUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from("deals").insert({
      title: newDealTitle,
      description: newDealDescription || null,
      target_amount: parseFloat(newDealTarget),
      deal_status: "published",
      created_by: user?.id,
      document_url: documentUrl,
      min_bid_amount: newDealMinBid ? parseFloat(newDealMinBid) : null,
      currency: newDealCurrency,
    } as any);
    if (error) {
      showErrorToast("Failed to create deal", { description: "Please try again." });
    } else {
      const currencySymbol = newDealCurrency === "USD" ? "$" : "₹";
      showSuccessToast(`Deal created and published! Target: ${currencySymbol}${parseFloat(newDealTarget).toLocaleString()} (${newDealCurrency})`);
      setNewDealTitle("");
      setNewDealDescription("");
      setNewDealTarget("");
      setNewDealMinBid("");
      setNewDealDocFile(null);
      setNewDealCurrency("INR");
      setShowDealConfirm(false);
      fetchDeals();
    }
  };

  const handleBidAction = async (bidId: string, action: "accepted" | "rejected") => {
    const { error } = await supabase.from("deal_bids").update({ bid_status: action }).eq("id", bidId);
    if (error) {
      toast({ title: "Error", description: "Failed to update bid.", variant: "destructive" });
    } else {
      toast({ title: `Bid ${action}` });
      fetchDeals();
    }
  };

  const handleDealStatusChange = async (dealId: string, status: string) => {
    const { error } = await supabase.from("deals").update({ deal_status: status }).eq("id", dealId);
    if (error) {
      toast({ title: "Error", description: "Failed to update deal.", variant: "destructive" });
    } else {
      toast({ title: `Deal status updated to ${status}` });
      fetchDeals();
    }
  };

  const fetchInviteConfig = async () => {
    const { data, error } = await supabase
      .from("invite_tokens")
      .select("*")
      .eq("token", `codonyx-invite-${new Date().getFullYear()}`)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching invite config:", error);
    } else if (data) {
      setInviteConfig(data);
      setExpirationDate(new Date(data.expires_at));
    }
  };

  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pending users.",
        variant: "destructive",
      });
    } else {
      setPendingUsers(data || []);
    }
    setLoading(false);
  };

  const handleApproval = async (userId: string, profileId: string, approve: boolean) => {
    setProcessingId(profileId);
    
    // Get user details before updating
    const targetUser = pendingUsers.find(u => u.id === profileId);
    
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: approve ? "approved" : "rejected" })
      .eq("id", profileId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${approve ? "approve" : "reject"} user.`,
        variant: "destructive",
      });
      setProcessingId(null);
      return;
    }

    // Send notification email in the background (non-blocking)
    if (targetUser) {
      supabase.functions.invoke("send-notification-email", {
        body: {
          type: approve ? "registration_approved" : "registration_rejected",
          recipientEmail: targetUser.email,
          recipientName: targetUser.full_name,
          userType: targetUser.user_type,
          loginUrl: window.location.origin + "/auth",
        },
      }).catch(emailError => {
        console.error("Error sending notification email:", emailError);
      });
    }

    toast({
      title: "Success",
      description: `User has been ${approve ? "approved" : "rejected"}.`,
    });
    setPendingUsers(prev => prev.filter(u => u.id !== profileId));
    fetchAllUsers();
    setIsModalOpen(false);
    setSelectedPendingUser(null);
    setProcessingId(null);
  };

  const handleViewPendingUser = async (user: PendingUser) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load profile details.",
        variant: "destructive",
      });
      return;
    }

    setSelectedPendingUser((data as PendingUser) || user);
    setIsModalOpen(true);
  };

  const saveInviteConfig = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (inviteConfig) {
      // Update existing config — preserve current is_active status
      const { error } = await supabase
        .from("invite_tokens")
        .update({ 
          expires_at: expirationDate.toISOString(),
        })
        .eq("id", inviteConfig.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update invite link.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Invite link settings saved.",
        });
        fetchInviteConfig();
      }
    } else {
      // Create new config with fixed token
      const { data, error } = await supabase
        .from("invite_tokens")
        .insert({ 
          created_by: user?.id,
          token: `codonyx-invite-${new Date().getFullYear()}`,
          expires_at: expirationDate.toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create invite link.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Invite link created and enabled.",
        });
        setInviteConfig(data);
      }
    }
    setSaving(false);
  };

  const toggleLinkStatus = async () => {
    if (!inviteConfig) return;

    const newStatus = !inviteConfig.is_active;
    const { error } = await supabase
      .from("invite_tokens")
      .update({ is_active: newStatus })
      .eq("id", inviteConfig.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update link status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Link ${newStatus ? "enabled" : "disabled"}.`,
      });
      setInviteConfig(prev => prev ? { ...prev, is_active: newStatus } : null);
    }
  };

  const copyInviteLink = () => {
    const baseUrl = websiteUrl.trim() || window.location.origin;
    const cleanUrl = baseUrl.replace(/\/$/, "");
    const link = `${cleanUrl}${FIXED_INVITE_PATH}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard.",
    });
  };

  const handleDeactivateAccount = async (user: PendingUser) => {
    setAccountActionLoading(true);
    const newStatus = user.approval_status === "deactivated" ? "approved" : "deactivated";
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: newStatus } as any)
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update account status.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Account ${newStatus === "deactivated" ? "deactivated" : "reactivated"} successfully.` });
      fetchAllUsers();
      fetchPendingUsers();
    }
    setAccountActionLoading(false);
    setAccountAction(null);
  };

  const handleDeleteAccount = async (user: PendingUser) => {
    setAccountActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user-account", {
        body: { profileId: user.id },
      });

      if (error) {
        toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
      } else {
        toast({ title: "Account Deleted", description: `${user.full_name}'s account has been permanently deleted.` });
        fetchAllUsers();
        fetchPendingUsers();
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
    setAccountActionLoading(false);
    setAccountAction(null);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  const isExpired = inviteConfig ? new Date(inviteConfig.expires_at) < new Date() : false;
  const isInvalid = inviteConfig ? (!inviteConfig.is_active || isExpired) : true;

  const getStatus = () => {
    if (!inviteConfig) return { label: "Not Created", variant: "outline" as const };
    if (!inviteConfig.is_active) return { label: "Disabled", variant: "outline" as const };
    if (isExpired) return { label: "Expired", variant: "destructive" as const };
    return { label: "Active", variant: "default" as const };
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    );
  }

  const status = getStatus();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardNavbar />
      <main className="flex-1 container mx-auto px-4 py-8 pt-28">
        <BackButton />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, deals, and invite links
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending Users</TabsTrigger>
            <TabsTrigger value="advisors" className="text-xs sm:text-sm">Advisors</TabsTrigger>
            <TabsTrigger value="labs" className="text-xs sm:text-sm">Laboratories</TabsTrigger>
            <TabsTrigger value="distributors" className="text-xs sm:text-sm">Distributors</TabsTrigger>
            <TabsTrigger value="deals" className="text-xs sm:text-sm">Deals</TabsTrigger>
            <TabsTrigger value="invites" className="text-xs sm:text-sm">Invite Link</TabsTrigger>
            <TabsTrigger value="custom-fields" className="text-xs sm:text-sm">
              <Settings2 className="h-3 w-3 mr-1" />Profile Fields
            </TabsTrigger>
            <TabsTrigger value="keyword-suggestions" className="text-xs sm:text-sm">
              <Settings2 className="h-3 w-3 mr-1" />Keywords
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading pending users...</p>
              </div>
            ) : pendingUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No pending registrations.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingUsers.map((user) => (
                  <Card 
                    key={user.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleViewPendingUser(user)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{user.full_name.slice(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{user.full_name}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={user.user_type === "advisor" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {user.user_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        {user.organisation && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>{user.organisation}</span>
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{user.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                      </div>

                      {user.headline && (
                        <p className="text-sm text-foreground font-medium">{user.headline}</p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPendingUser(user);
                          }}
                          variant="outline"
                          className="flex-1"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          </TabsContent>

          {/* Advisors Tab */}
          <TabsContent value="advisors">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Advisors</CardTitle>
                    <CardDescription>Manage all advisor accounts</CardDescription>
                  </div>
                  <Select value={advisorStatusFilter} onValueChange={setAdvisorStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="deactivated">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading advisors...</p>
                ) : (
                  <div className="w-full overflow-x-auto">
                  <Table className="min-w-max whitespace-nowrap">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">User</TableHead>
                        <TableHead className="whitespace-nowrap">Email</TableHead>
                        <TableHead className="whitespace-nowrap">Organisation</TableHead>
                        <TableHead className="whitespace-nowrap">Location</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Joined</TableHead>
                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allAdvisors
                        .filter(a => advisorStatusFilter === "all" || a.approval_status === advisorStatusFilter)
                        .map((advisor) => (
                        <TableRow key={advisor.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/profile/${advisor.id}`)}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={advisor.avatar_url || undefined} />
                                <AvatarFallback>{advisor.full_name.slice(0,2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{advisor.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap max-w-[220px] truncate">{advisor.email}</TableCell>
                          <TableCell className="whitespace-nowrap">{advisor.organisation || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">{advisor.location || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={
                              advisor.approval_status === "approved" ? "default" :
                              advisor.approval_status === "pending" ? "secondary" :
                              advisor.approval_status === "deactivated" ? "outline" : "destructive"
                            } className="capitalize">
                              {advisor.approval_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{format(new Date(advisor.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={advisor.approval_status === "deactivated" ? "Reactivate" : "Deactivate"}
                                onClick={() => setAccountAction({ user: advisor, type: "deactivate" })}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete permanently"
                                onClick={() => setAccountAction({ user: advisor, type: "delete" })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Laboratories Tab */}
          <TabsContent value="labs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Laboratories</CardTitle>
                    <CardDescription>Manage all laboratory accounts</CardDescription>
                  </div>
                  <Select value={labStatusFilter} onValueChange={setLabStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="deactivated">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading laboratories...</p>
                ) : (
                  <div className="w-full overflow-x-auto">
                  <Table className="min-w-max whitespace-nowrap">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Company</TableHead>
                        <TableHead className="whitespace-nowrap">Email</TableHead>
                        <TableHead className="whitespace-nowrap">Type</TableHead>
                        <TableHead className="whitespace-nowrap">Location</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Joined</TableHead>
                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allLabs
                        .filter(l => labStatusFilter === "all" || l.approval_status === labStatusFilter)
                        .map((lab) => (
                        <TableRow key={lab.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/profile/${lab.id}`)}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={lab.avatar_url || undefined} />
                                <AvatarFallback>{lab.full_name.slice(0,2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{lab.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap max-w-[220px] truncate">{lab.email}</TableCell>
                          <TableCell className="whitespace-nowrap">{lab.company_type || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">{lab.location || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={
                              lab.approval_status === "approved" ? "default" :
                              lab.approval_status === "pending" ? "secondary" :
                              lab.approval_status === "deactivated" ? "outline" : "destructive"
                            } className="capitalize">
                              {lab.approval_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{format(new Date(lab.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={lab.approval_status === "deactivated" ? "Reactivate" : "Deactivate"}
                                onClick={() => setAccountAction({ user: lab, type: "deactivate" })}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete permanently"
                                onClick={() => setAccountAction({ user: lab, type: "delete" })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distributors Tab */}
          <TabsContent value="distributors">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Distributors</CardTitle>
                    <CardDescription>Manage all distributor accounts</CardDescription>
                  </div>
                  <Select value={distributorStatusFilter} onValueChange={setDistributorStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="deactivated">Deactivated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading distributors...</p>
                ) : allDistributors.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No distributors registered yet.</p>
                ) : (
                  <div className="w-full overflow-x-auto">
                  <Table className="min-w-max whitespace-nowrap">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Name</TableHead>
                        <TableHead className="whitespace-nowrap">Email</TableHead>
                        <TableHead className="whitespace-nowrap">Company</TableHead>
                        <TableHead className="whitespace-nowrap">Region</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Joined</TableHead>
                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allDistributors
                        .filter(d => distributorStatusFilter === "all" || d.approval_status === distributorStatusFilter)
                        .map((dist) => (
                        <TableRow key={dist.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewPendingUser(dist)}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={dist.avatar_url || undefined} />
                                <AvatarFallback>{dist.full_name.slice(0,2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{dist.full_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap max-w-[220px] truncate">{dist.email}</TableCell>
                          <TableCell className="whitespace-nowrap">{dist.organisation || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">{dist.region || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={
                              dist.approval_status === "approved" ? "default" :
                              dist.approval_status === "pending" ? "secondary" :
                              dist.approval_status === "deactivated" ? "outline" : "destructive"
                            } className="capitalize">
                              {dist.approval_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">{format(new Date(dist.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={dist.approval_status === "deactivated" ? "Reactivate" : "Deactivate"}
                                onClick={() => setAccountAction({ user: dist, type: "deactivate" })}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete permanently"
                                onClick={() => setAccountAction({ user: dist, type: "delete" })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals">
            <div className="space-y-6">
              {/* Deal Indicators */}
              {(() => {
                const approvedDistributors = aggregateStats.approved_distributors;
                const totalBidders = 34 + approvedDistributors;
                const totalSubscription = aggregateStats.total_subscription;
                const totalTarget = aggregateStats.total_target;
                const overCommitted = totalTarget > 0 ? Math.max(0, totalSubscription - totalTarget) : 0;
                // Investors: full circle at 250
                const investorPercent = Math.min(100, (totalBidders / 250) * 100);
                const subscriptionPercent = totalTarget > 0 ? Math.min(100, (totalSubscription / totalTarget) * 100) : 0;
                const overPercent = totalTarget > 0 ? Math.min(100, (overCommitted / totalTarget) * 100) : 0;

                const formatCurrency = (val: number) => {
                  if (val >= 10000000) return `INR\n${(val / 10000000).toFixed(2)} Cr`;
                  if (val >= 100000) return `INR\n${(val / 100000).toFixed(2)} L`;
                  return `₹${val.toLocaleString()}`;
                };

                const greenColor = "hsl(142, 71%, 29%)";

                const CircleIndicator = ({ percent, label, value, color }: { percent: number; label: string; value: string; color: string }) => {
                  const radius = 54;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (percent / 100) * circumference;
                  return (
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                          <circle cx="64" cy="64" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                          <circle cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="8"
                            strokeDasharray={circumference} strokeDashoffset={offset}
                            strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-foreground text-center leading-tight whitespace-pre-line">{value}</span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground text-center">{label}</span>
                    </div>
                  );
                };

                return (
                  <Card>
                    <CardContent className="py-6">
                      <div className="flex justify-around items-center flex-wrap gap-6">
                        <CircleIndicator
                          percent={investorPercent}
                          label="Investors Committed"
                          value={String(totalBidders)}
                          color="hsl(var(--muted-foreground))"
                        />
                        <CircleIndicator
                          percent={subscriptionPercent}
                          label="Subscription"
                          value={totalSubscription > 0 ? formatCurrency(totalSubscription) : "INR\n20.18 Cr"}
                          color={greenColor}
                        />
                        <CircleIndicator
                          percent={overPercent}
                          label="Over Committed"
                          value={overCommitted > 0 ? formatCurrency(overCommitted) : "INR\n17.50 L"}
                          color={greenColor}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Create Deal */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Deal</CardTitle>
                  <CardDescription>Publish a deal for distributors to bid on</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input placeholder="Deal title" value={newDealTitle} onChange={(e) => setNewDealTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency *</Label>
                      <Select value={newDealCurrency} onValueChange={(v) => setNewDealCurrency(v as "INR" | "USD")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">₹ INR (Indian Rupee)</SelectItem>
                          <SelectItem value="USD">$ USD (US Dollar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Amount ({newDealCurrency === "USD" ? "$" : "₹"}) *</Label>
                      <Input type="number" placeholder="e.g. 10000000" value={newDealTarget} onChange={(e) => setNewDealTarget(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Minimum Bid Amount ({newDealCurrency === "USD" ? "$" : "₹"})</Label>
                      <Input type="number" placeholder="e.g. 500000" value={newDealMinBid} onChange={(e) => setNewDealMinBid(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input placeholder="Brief description" value={newDealDescription} onChange={(e) => setNewDealDescription(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Document (optional)</Label>
                      <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png" onChange={handleDealDocumentChange} />
                      {newDealDocFile && <p className="text-xs text-muted-foreground">Selected: {newDealDocFile.name}</p>}
                    </div>
                  </div>
                  <Button className="mt-4" onClick={() => setShowDealConfirm(true)} disabled={!newDealTitle || !newDealTarget}>
                    Create & Publish Deal
                  </Button>
                </CardContent>
              </Card>

              {/* Deals List */}
              <Card>
                <CardHeader>
                  <CardTitle>All Deals</CardTitle>
                  <CardDescription>Click a row to view full deal details</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Input
                      placeholder="Search by title..."
                      value={dealSearchTerm}
                      onChange={(e) => setDealSearchTerm(e.target.value)}
                      className="max-w-[200px] h-9"
                    />
                    <Select value={dealStatusFilter} onValueChange={setDealStatusFilter}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dealCurrencyFilter} onValueChange={setDealCurrencyFilter}>
                      <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Currency</SelectItem>
                        <SelectItem value="INR">₹ INR</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={dealSortBy} onValueChange={(v) => setDealSortBy(v as any)}>
                      <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="price">Target Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="h-9" onClick={() => setDealSortOrder(o => o === "desc" ? "asc" : "desc")}>
                      {dealSortOrder === "desc" ? "↓ Newest" : "↑ Oldest"}
                    </Button>
                  </div>

                  {(() => {
                    const filtered = deals
                      .filter(d => dealStatusFilter === "all" || d.deal_status === dealStatusFilter)
                      .filter(d => dealCurrencyFilter === "all" || (d.currency || "INR") === dealCurrencyFilter)
                      .filter(d => !dealSearchTerm || d.title.toLowerCase().includes(dealSearchTerm.toLowerCase()))
                      .sort((a, b) => {
                        if (dealSortBy === "price") {
                          return dealSortOrder === "desc" ? Number(b.target_amount) - Number(a.target_amount) : Number(a.target_amount) - Number(b.target_amount);
                        }
                        return dealSortOrder === "desc" ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                      });
                    const visible = filtered.slice(0, dealShowCount);

                    if (filtered.length === 0) {
                      return <p className="text-muted-foreground text-center py-8">No deals match your filters.</p>;
                    }

                    return (
                      <>
                        <div className="w-full overflow-x-auto">
                        <Table className="min-w-max whitespace-nowrap">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">Title</TableHead>
                              <TableHead className="whitespace-nowrap">Notes</TableHead>
                              <TableHead className="whitespace-nowrap">Target</TableHead>
                              <TableHead className="whitespace-nowrap">Raised</TableHead>
                              <TableHead className="whitespace-nowrap">Status</TableHead>
                              <TableHead className="whitespace-nowrap">Bids</TableHead>
                              <TableHead className="whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {visible.map((deal: any) => {
                              const bidsForDeal = dealBids.filter((b: any) => b.deal_id === deal.id);
                              const cs = (deal.currency || "INR") === "USD" ? "$" : "₹";
                              return (
                                <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedDealDetail(deal)}>
                                  <TableCell className="font-medium whitespace-nowrap">{deal.title}</TableCell>
                                  <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                                    {deal.description || <span className="italic text-muted-foreground/50">No description</span>}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">{cs}{Number(deal.target_amount).toLocaleString()} <span className="text-xs text-muted-foreground">{deal.currency || "INR"}</span></TableCell>
                                  <TableCell className="whitespace-nowrap">{cs}{Number(deal.raised_amount).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Badge className="capitalize" variant={deal.deal_status === "published" ? "default" : "secondary"}>
                                      {deal.deal_status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">{bidsForDeal.length}</TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                      <Select value={deal.deal_status} onValueChange={(val) => handleDealStatusChange(deal.id, val)}>
                                        <SelectTrigger className="w-[120px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="draft">Draft</SelectItem>
                                          <SelectItem value="published">Published</SelectItem>
                                          <SelectItem value="closed">Closed</SelectItem>
                                          <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        title="Delete deal"
                                        onClick={() => setDealDeleteConfirm(deal)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        </div>
                        {filtered.length > dealShowCount && (
                          <div className="flex justify-center gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => setDealShowCount(c => c + 15)}>Show More</Button>
                            <Button variant="ghost" size="sm" onClick={() => setDealShowCount(filtered.length)}>Show All ({filtered.length})</Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Deal Detail Dialog */}
              {selectedDealDetail && (
                <Dialog open={!!selectedDealDetail} onOpenChange={(open) => !open && setSelectedDealDetail(null)}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Deal Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Title</p>
                        <p className="font-semibold text-lg">{selectedDealDetail.title}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Target Amount</p>
                          <p className="font-medium">{(selectedDealDetail.currency || "INR") === "USD" ? "$" : "₹"}{Number(selectedDealDetail.target_amount).toLocaleString()} <span className="text-xs text-muted-foreground">{selectedDealDetail.currency || "INR"}</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Raised Amount</p>
                          <p className="font-medium">{(selectedDealDetail.currency || "INR") === "USD" ? "$" : "₹"}{Number(selectedDealDetail.raised_amount).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                          <Badge className="capitalize mt-1" variant={selectedDealDetail.deal_status === "published" ? "default" : "secondary"}>
                            {selectedDealDetail.deal_status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Min Bid</p>
                          <p className="font-medium">{selectedDealDetail.min_bid_amount ? `${(selectedDealDetail.currency || "INR") === "USD" ? "$" : "₹"}${Number(selectedDealDetail.min_bid_amount).toLocaleString()}` : "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Bids</p>
                          <p className="font-medium">{dealBids.filter((b: any) => b.deal_id === selectedDealDetail.id).length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Created</p>
                          <p className="font-medium">{format(new Date(selectedDealDetail.created_at), "MMM d, yyyy HH:mm")}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                        <div className="bg-muted/50 rounded-lg p-3 min-h-[60px]">
                          {selectedDealDetail.description ? (
                            <p className="text-sm whitespace-pre-wrap">{selectedDealDetail.description}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No description provided.</p>
                          )}
                        </div>
                      </div>
                      {selectedDealDetail.document_url && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Document</p>
                          <Button variant="outline" size="sm" onClick={() => window.open(selectedDealDetail.document_url, "_blank")}>
                            View Document
                          </Button>
                        </div>
                      )}
                      <div className="flex justify-end pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => { setSelectedDealDetail(null); setDealDeleteConfirm(selectedDealDetail); }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete Deal
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Deal Delete Confirm */}
              <AlertDialog open={!!dealDeleteConfirm} onOpenChange={(open) => !open && setDealDeleteConfirm(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Deal</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to permanently delete the deal "<strong>{dealDeleteConfirm?.title}</strong>"? All bids associated with this deal will also be deleted. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={async () => {
                        if (!dealDeleteConfirm) return;
                        // Delete bids first, then deal
                        await supabase.from("deal_bids").delete().eq("deal_id", dealDeleteConfirm.id);
                        const { error } = await supabase.from("deals").delete().eq("id", dealDeleteConfirm.id);
                        if (error) {
                          showErrorToast("Failed to delete deal");
                        } else {
                          showSuccessToast("Deal deleted successfully");
                          fetchDeals();
                        }
                        setDealDeleteConfirm(null);
                      }}
                    >
                      Yes, Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Bids Management */}
              <Card>
                <CardHeader>
                  <CardTitle>All Bids</CardTitle>
                  <CardDescription>Review and manage distributor bids — click a row to view full details</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Bid Filters */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Input
                      placeholder="Search by name or deal..."
                      value={bidSearchTerm}
                      onChange={(e) => setBidSearchTerm(e.target.value)}
                      className="max-w-[200px] h-9"
                    />
                    <Select value={bidStatusFilter} onValueChange={setBidStatusFilter}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="accepted">Submitted</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={bidCurrencyFilter} onValueChange={setBidCurrencyFilter}>
                      <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Currency</SelectItem>
                        <SelectItem value="INR">₹ INR</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={bidSortBy} onValueChange={(v) => setBidSortBy(v as any)}>
                      <SelectTrigger className="w-[130px] h-9">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="h-9" onClick={() => setBidSortOrder(o => o === "desc" ? "asc" : "desc")}>
                      {bidSortOrder === "desc" ? "↓ Newest" : "↑ Oldest"}
                    </Button>
                  </div>

                  {(() => {
                    const filtered = dealBids
                      .filter((bid: any) => bidStatusFilter === "all" || bid.bid_status === bidStatusFilter)
                      .filter((bid: any) => {
                        if (bidCurrencyFilter === "all") return true;
                        const deal = deals.find((d: any) => d.id === bid.deal_id);
                        return (deal?.currency || "INR") === bidCurrencyFilter;
                      })
                      .filter((bid: any) => {
                        if (!bidSearchTerm) return true;
                        const term = bidSearchTerm.toLowerCase();
                        const deal = deals.find((d: any) => d.id === bid.deal_id);
                        return (bid.profiles?.full_name || "").toLowerCase().includes(term) ||
                               (deal?.title || "").toLowerCase().includes(term);
                      })
                      .sort((a: any, b: any) => {
                        if (bidSortBy === "amount") {
                          return bidSortOrder === "desc" ? Number(b.bid_amount) - Number(a.bid_amount) : Number(a.bid_amount) - Number(b.bid_amount);
                        }
                        return bidSortOrder === "desc" ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                      });
                    const visible = filtered.slice(0, bidShowCount);

                    if (filtered.length === 0) {
                      return <p className="text-muted-foreground text-center py-8">No bids match your filters.</p>;
                    }

                    return (
                      <>
                        <div className="w-full overflow-x-auto">
                        <Table className="min-w-max whitespace-nowrap">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="whitespace-nowrap">Distributor</TableHead>
                              <TableHead className="whitespace-nowrap">Deal</TableHead>
                              <TableHead className="whitespace-nowrap">Amount</TableHead>
                              <TableHead className="whitespace-nowrap">Notes</TableHead>
                              <TableHead className="whitespace-nowrap">Status</TableHead>
                              <TableHead className="whitespace-nowrap">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {visible.map((bid: any) => {
                              const deal = deals.find((d: any) => d.id === bid.deal_id);
                              return (
                                <TableRow key={bid.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedBidDetail({ ...bid, deal })}>
                                  <TableCell className="whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={bid.profiles?.avatar_url || undefined} />
                                        <AvatarFallback>{(bid.profiles?.full_name || "?").slice(0,2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <span className="font-medium">{bid.profiles?.full_name || "Unknown"}</span>
                                        {bid.profiles?.organisation && <p className="text-muted-foreground text-xs">({bid.profiles.organisation})</p>}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">{deal?.title || "Unknown"}</TableCell>
                                  <TableCell className="whitespace-nowrap">{((deal?.currency || "INR") === "USD" ? "$" : "₹")}{Number(bid.bid_amount).toLocaleString()} <span className="text-xs text-muted-foreground">{deal?.currency || "INR"}</span></TableCell>
                                  <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                                    {bid.notes || <span className="italic text-muted-foreground/50">No notes</span>}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className="capitalize" variant={
                                      bid.bid_status === "accepted" ? "default" :
                                      bid.bid_status === "rejected" ? "destructive" : "secondary"
                                    }>
                                      {bid.bid_status === "accepted" ? "Submitted" : bid.bid_status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground text-xs font-mono whitespace-nowrap">{format(new Date(bid.created_at), "MMM d, yyyy HH:mm:ss.SSS")}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        </div>
                        {filtered.length > bidShowCount && (
                          <div className="flex justify-center gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => setBidShowCount(c => c + 15)}>Show More</Button>
                            <Button variant="ghost" size="sm" onClick={() => setBidShowCount(filtered.length)}>Show All ({filtered.length})</Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Bid Detail Dialog */}
              {selectedBidDetail && (
                <Dialog open={!!selectedBidDetail} onOpenChange={(open) => !open && setSelectedBidDetail(null)}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Bid Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedBidDetail.profiles?.avatar_url || undefined} />
                          <AvatarFallback>{(selectedBidDetail.profiles?.full_name || "?").slice(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-lg">{selectedBidDetail.profiles?.full_name || "Unknown"}</p>
                          {selectedBidDetail.profiles?.organisation && (
                            <p className="text-sm text-muted-foreground">{selectedBidDetail.profiles.organisation}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Deal</p>
                          <p className="font-medium">{selectedBidDetail.deal?.title || "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Bid Amount</p>
                          <p className="font-medium text-primary">{((selectedBidDetail.deal?.currency || "INR") === "USD" ? "$" : "₹")}{Number(selectedBidDetail.bid_amount).toLocaleString()} {selectedBidDetail.deal?.currency || "INR"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                          <Badge className="capitalize mt-1" variant={
                            selectedBidDetail.bid_status === "accepted" ? "default" :
                            selectedBidDetail.bid_status === "rejected" ? "destructive" : "secondary"
                          }>
                            {selectedBidDetail.bid_status === "accepted" ? "Submitted" : selectedBidDetail.bid_status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Submitted On</p>
                          <p className="font-medium">{format(new Date(selectedBidDetail.created_at), "MMM d, yyyy HH:mm")}</p>
                        </div>
                      </div>
                      {selectedBidDetail.deal && (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Deal Target</p>
                            <p className="font-medium">{((selectedBidDetail.deal?.currency || "INR") === "USD" ? "$" : "₹")}{Number(selectedBidDetail.deal.target_amount).toLocaleString()} {selectedBidDetail.deal.currency || "INR"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deal Description</p>
                            <div className="bg-muted/50 rounded-lg p-3 min-h-[40px]">
                              {selectedBidDetail.deal.description ? (
                                <p className="text-sm whitespace-pre-wrap">{selectedBidDetail.deal.description}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No deal description.</p>
                              )}
                            </div>
                          </div>
                          {selectedBidDetail.deal.document_url && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Document</p>
                              <Button variant="outline" size="sm" onClick={() => window.open(selectedBidDetail.deal.document_url, "_blank")}>
                                View Document
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Distributor Notes / Description</p>
                        <div className="bg-muted/50 rounded-lg p-3 min-h-[60px]">
                          {selectedBidDetail.notes ? (
                            <p className="text-sm whitespace-pre-wrap">{selectedBidDetail.notes}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No description provided by the distributor.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invites">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Invite Link Configuration
                </CardTitle>
                <CardDescription>
                  Configure the registration invite link with expiration date and enable/disable it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fixed Invite Path Display */}
                <div className="space-y-2">
                  <Label>Invite Link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="max-w-[250px]"
                    />
                    <span className="text-sm font-mono text-muted-foreground bg-muted px-3 py-2 rounded-md">
                      {FIXED_INVITE_PATH}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyInviteLink}
                      disabled={isInvalid}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your website URL to generate the full invite link.
                  </p>
                </div>

                {/* Status Display */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {isInvalid && inviteConfig && (
                        <span className="text-sm text-destructive font-medium">Invalid Link</span>
                      )}
                    </div>
                    {inviteConfig && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Expires: {formatDate(inviteConfig.expires_at)}
                      </p>
                    )}
                  </div>
                  {inviteConfig && (
                    <Button
                      variant={inviteConfig.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={toggleLinkStatus}
                      className="gap-2"
                    >
                      <Power className="h-4 w-4" />
                      {inviteConfig.is_active ? "Disable" : "Enable"}
                    </Button>
                  )}
                </div>

                {/* Expiration Date Picker */}
                <div className="space-y-2">
                  <Label>Expiration Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !expirationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expirationDate}
                        onSelect={(date) => date && setExpirationDate(date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={saveInviteConfig} 
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  {saving ? "Saving..." : inviteConfig ? "Save Changes" : "Create & Enable Link"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom-fields">
            <CustomFieldsManager />
          </TabsContent>

          <TabsContent value="keyword-suggestions">
            <KeywordSuggestionsManager />
          </TabsContent>
        </Tabs>

        <PendingUserDetailModal
          user={selectedPendingUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPendingUser(null);
          }}
          onApprove={(userId, profileId) => handleApproval(userId, profileId, true)}
          onReject={(userId, profileId) => handleApproval(userId, profileId, false)}
          isProcessing={processingId !== null}
        />

        {/* Deactivate / Delete Confirmation Dialog */}
        <AlertDialog open={!!accountAction} onOpenChange={(open) => !open && setAccountAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {accountAction?.type === "delete"
                  ? "Permanently Delete Account"
                  : accountAction?.user.approval_status === "deactivated"
                    ? "Reactivate Account"
                    : "Deactivate Account"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {accountAction?.type === "delete" ? (
                  <>
                    Are you really sure you want to <strong>permanently delete</strong> the account of{" "}
                    <strong>{accountAction?.user.full_name}</strong> ({accountAction?.user.email})?
                    <br /><br />
                    This action <strong>cannot be undone</strong>. All data including profile, publications, connections, and bids will be permanently removed.
                  </>
                ) : accountAction?.user.approval_status === "deactivated" ? (
                  <>
                    Are you sure you want to <strong>reactivate</strong> the account of{" "}
                    <strong>{accountAction?.user.full_name}</strong> ({accountAction?.user.email})?
                    <br /><br />
                    The user will be able to log in again after reactivation.
                  </>
                ) : (
                  <>
                    Are you really sure you want to <strong>deactivate</strong> the account of{" "}
                    <strong>{accountAction?.user.full_name}</strong> ({accountAction?.user.email})?
                    <br /><br />
                    The user will not be able to log in while deactivated. You can reactivate the account later.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={accountActionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={accountActionLoading}
                className={accountAction?.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                onClick={() => {
                  if (!accountAction) return;
                  if (accountAction.type === "delete") {
                    handleDeleteAccount(accountAction.user);
                  } else {
                    handleDeactivateAccount(accountAction.user);
                  }
                }}
              >
                {accountActionLoading
                  ? "Processing..."
                  : accountAction?.type === "delete"
                    ? "Yes, Delete Permanently"
                    : accountAction?.user.approval_status === "deactivated"
                      ? "Yes, Reactivate"
                      : "Yes, Deactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Deal Creation Confirm Dialog */}
        <AlertDialog open={showDealConfirm} onOpenChange={setShowDealConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deal Creation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to create and publish the deal "{newDealTitle}" with a target amount of {newDealCurrency === "USD" ? "$" : "₹"}{parseFloat(newDealTarget || "0").toLocaleString()} ({newDealCurrency})? This will be visible to all approved distributors.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateDeal}>
                Yes, Create Deal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
