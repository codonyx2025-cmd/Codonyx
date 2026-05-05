import { useEffect, useState, useMemo } from "react";
import { useAccountGuard } from "@/hooks/useAccountGuard";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { BackButton } from "@/components/layout/BackButton";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Wallet, Briefcase, Target, Pencil, FileText, Users, Building2, ArrowRight, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useAuthReady } from "@/hooks/useAuthReady";
import { fetchOwnProfile } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Deal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  raised_amount: number;
  deal_status: string;
  created_at: string;
  min_bid_amount: number | null;
  document_url: string | null;
  currency?: string;
}

interface Bid {
  id: string;
  deal_id: string;
  bid_amount: number;
  bid_status: string;
  notes: string | null;
  created_at: string;
  deal_title?: string;
  deal_status?: string;
}

interface Profile {
  id: string;
  full_name: string;
  organisation: string | null;
  user_type: "advisor" | "laboratory" | "distributor";
  approval_status: "approved" | "pending" | "rejected" | "deactivated";
}

interface AggregateStats {
  unique_bidders: number;
  approved_distributors: number;
  total_subscription_inr: number;
  total_subscription_usd: number;
  total_target_inr: number;
  total_target_usd: number;
}

export default function DistributorDashboard() {
  const navigate = useNavigate();
  const { isReady, user } = useAuthReady();
  useAccountGuard();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [aggregateStats, setAggregateStats] = useState<AggregateStats>({ unique_bidders: 0, approved_distributors: 0, total_subscription_inr: 0, total_subscription_usd: 0, total_target_inr: 0, total_target_usd: 0 });
  const [indicatorLimits, setIndicatorLimits] = useState<{ limit_subscription_inr: number; limit_subscription_usd: number; limit_over_committed_inr: number; limit_over_committed_usd: number }>({ limit_subscription_inr: 0, limit_subscription_usd: 0, limit_over_committed_inr: 0, limit_over_committed_usd: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidNotes, setBidNotes] = useState("");
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [editBidAmount, setEditBidAmount] = useState("");
  const [editBidNotes, setEditBidNotes] = useState("");
  const [isUpdatingBid, setIsUpdatingBid] = useState(false);
  const [dealShowCount, setDealShowCount] = useState(15);
  const [dealSearchTerm, setDealSearchTerm] = useState("");
  const [dealCurrencyFilter, setDealCurrencyFilter] = useState("all");
  const [bidShowCount, setBidShowCount] = useState(15);
  const [bidSearchTerm, setBidSearchTerm] = useState("");
  const [bidStatusFilter, setBidStatusFilter] = useState("all");
  const [bidCurrencyFilter, setBidCurrencyFilter] = useState("all");
  const [dealBidCounts, setDealBidCounts] = useState<Record<string, number>>({});
  const [dealSubscriptions, setDealSubscriptions] = useState<Record<string, number>>({});
  const [viewDealDetail, setViewDealDetail] = useState<Deal | null>(null);

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = !dealSearchTerm || deal.title.toLowerCase().includes(dealSearchTerm.toLowerCase());
      const matchesCurrency = dealCurrencyFilter === "all" || (deal.currency || "INR") === dealCurrencyFilter;
      return matchesSearch && matchesCurrency;
    });
  }, [deals, dealSearchTerm, dealCurrencyFilter]);

  const filteredMyBids = useMemo(() => {
    return myBids.filter(bid => {
      const deal = allDeals.find(d => d.id === bid.deal_id);
      const matchesSearch = !bidSearchTerm || (bid.deal_title || "").toLowerCase().includes(bidSearchTerm.toLowerCase());
      const matchesCurrency = bidCurrencyFilter === "all" || (deal?.currency || "INR") === bidCurrencyFilter;
      let matchesStatus = true;
      if (bidStatusFilter !== "all") {
        if (bidStatusFilter === "submitted") matchesStatus = bid.bid_status === "accepted" && bid.deal_status !== "closed";
        else if (bidStatusFilter === "deal_closed") matchesStatus = bid.deal_status === "closed";
        else if (bidStatusFilter === "withdrawn") matchesStatus = bid.bid_status === "withdrawn";
        else if (bidStatusFilter === "cancelled") matchesStatus = bid.deal_status === "cancelled";
        else matchesStatus = bid.bid_status === bidStatusFilter;
      }
      return matchesSearch && matchesStatus && matchesCurrency;
    });
  }, [myBids, bidSearchTerm, bidStatusFilter, bidCurrencyFilter, allDeals]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    void loadData(user.id);
  }, [isReady, navigate, user]);

  // Realtime subscriptions
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('distributor-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        if (user) void loadData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deal_bids' }, () => {
        if (user) void loadData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_settings' }, () => {
        void fetchIndicatorLimits();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, user]);

  const fetchIndicatorLimits = async () => {
    const { data } = await supabase.from("dashboard_settings").select("setting_key, setting_value");
    if (data) {
      const next = { limit_subscription_inr: 0, limit_subscription_usd: 0, limit_over_committed_inr: 0, limit_over_committed_usd: 0 };
      data.forEach((row: any) => {
        if (row.setting_key in next) (next as any)[row.setting_key] = Number(row.setting_value) || 0;
      });
      setIndicatorLimits(next);
    }
  };

  const loadData = async (userId: string) => {
    const { data: profileData } = await fetchOwnProfile<Profile>(
      userId,
      "id, full_name, organisation, user_type, approval_status",
      2
    );

    if (!profileData || profileData.approval_status !== "approved" || profileData.user_type !== "distributor") {
      navigate("/dashboard");
      return;
    }

    setProfile(profileData);

    // Fetch published deals (for bidding)
    const { data: publishedDeals } = await supabase
      .from("deals")
      .select("*")
      .eq("deal_status", "published")
      .order("created_at", { ascending: false });

    setDeals((publishedDeals as Deal[]) || []);

    // Fetch ALL deals the distributor can see (includes closed ones they bid on)
    const { data: allDealsData } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });

    setAllDeals((allDealsData as Deal[]) || []);

    // Fetch my bids
    const { data: bidsData } = await supabase
      .from("deal_bids")
      .select("*")
      .eq("distributor_profile_id", profileData.id)
      .order("created_at", { ascending: false });

    // Enrich bids with deal titles and status
    const allDealsList = (allDealsData as Deal[]) || [];
    if (bidsData) {
      const enriched = (bidsData as Bid[]).map(bid => {
        const deal = allDealsList.find(d => d.id === bid.deal_id);
        return {
          ...bid,
          deal_title: deal?.title || "Unknown Deal",
          deal_status: deal?.deal_status || "unknown",
        };
      });
      setMyBids(enriched);
    }

    // Fetch aggregate stats (same numbers as admin dashboard)
    const { data: statsData } = await supabase.rpc('get_deal_aggregate_stats');
    if (statsData) {
      setAggregateStats(statsData as unknown as AggregateStats);
    }

    // Fetch admin-configured indicator limits
    await fetchIndicatorLimits();

    // Fetch active bid counts per deal (so distributors see total participants)
    const { data: bidCountsData } = await supabase.rpc('get_deal_active_bid_counts');
    if (bidCountsData) {
      const counts: Record<string, number> = {};
      (bidCountsData as any[]).forEach((row) => {
        counts[row.deal_id] = Number(row.active_bids) || 0;
      });
      setDealBidCounts(counts);
    }

    // Fetch subscription totals per deal (live raised amount per deal)
    const { data: subsData } = await supabase.rpc('get_deal_subscription_totals');
    if (subsData) {
      const subs: Record<string, number> = {};
      (subsData as any[]).forEach((row) => {
        subs[row.deal_id] = Number(row.total_subscription) || 0;
      });
      setDealSubscriptions(subs);
    }

    setIsLoading(false);
  };

  const handlePlaceBid = async () => {
    if (!selectedDeal || !profile || !bidAmount) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    const dealCurrSym = (selectedDeal.currency || "INR") === "USD" ? "$" : "₹";

    // Bid must not exceed target amount
    if (amount > selectedDeal.target_amount) {
      toast({
        title: "Bid amount too high",
        description: `Bid amount cannot exceed the target of ${dealCurrSym}${Number(selectedDeal.target_amount).toLocaleString()}.`,
        variant: "destructive",
      });
      return;
    }

    const minBid = selectedDeal.min_bid_amount ? Number(selectedDeal.min_bid_amount) : 0;
    if (minBid > 0 && amount < minBid) {
      toast({
        title: "Bid amount too low",
        description: `Minimum bid for this deal is ${dealCurrSym}${minBid.toLocaleString()}. You can't bid less than this amount.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingBid(true);
    const { error } = await supabase.from("deal_bids").insert({
      deal_id: selectedDeal.id,
      distributor_profile_id: profile.id,
      bid_amount: amount,
      notes: bidNotes || null,
    });

    if (error) {
      toast({ title: "Failed to place bid", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bid placed successfully!" });

      // Notify all admins about the new bid (best-effort, non-blocking)
      try {
        const currencySymbol = (selectedDeal.currency || "INR") === "USD" ? "$" : "₹";
        const formattedAmount = `${currencySymbol}${amount.toLocaleString()}`;
        const distributorName = profile.full_name || "A distributor";
        const message = `${distributorName} (Distributor) bid on "${selectedDeal.title}" deal. Bidding amount: ${formattedAmount}.`;

        // Use SECURITY DEFINER RPC because user_roles has restricted RLS for non-admins
        const { data: adminProfileRows } = await supabase.rpc("get_admin_profile_ids");
        const rows = ((adminProfileRows as { profile_id: string }[] | null) || []).map((ap) => ({
          profile_id: ap.profile_id,
          type: "new_bid",
          title: "New Bid Placed",
          message,
          link: "/admin",
          related_profile_id: profile.id,
        }));
        if (rows.length > 0) {
          await supabase.from("notifications").insert(rows);
        }
      } catch (e) {
        console.error("Failed to send admin bid notifications:", e);
      }

      setSelectedDeal(null);
      setBidAmount("");
      setBidNotes("");
      if (user) void loadData(user.id);
    }
    setIsSubmittingBid(false);
  };

  const handleWithdrawBid = async (bidId: string) => {
    const { error } = await supabase
      .from("deal_bids")
      .update({ bid_status: "withdrawn" })
      .eq("id", bidId);

    if (error) {
      toast({ title: "Failed to withdraw", variant: "destructive" });
    } else {
      toast({ title: "Bid withdrawn" });
      if (user) void loadData(user.id);
    }
  };

  const handleEditBid = (bid: Bid) => {
    setEditingBid(bid);
    setEditBidAmount(String(bid.bid_amount));
    setEditBidNotes(bid.notes || "");
  };

  const handleUpdateBid = async () => {
    if (!editingBid || !editBidAmount) return;

    const amount = parseFloat(editBidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    // Find the deal to validate against target
    const deal = allDeals.find(d => d.id === editingBid.deal_id);
    const editCurrSym = (deal?.currency || "INR") === "USD" ? "$" : "₹";
    if (deal && amount > deal.target_amount) {
      toast({
        title: "Bid amount too high",
        description: `Bid amount cannot exceed the target of ${editCurrSym}${Number(deal.target_amount).toLocaleString()}.`,
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingBid(true);
    const { error } = await supabase
      .from("deal_bids")
      .update({ bid_amount: amount, notes: editBidNotes || null })
      .eq("id", editingBid.id);

    if (error) {
      toast({ title: "Failed to update bid", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bid updated successfully!" });
      setEditingBid(null);
      if (user) void loadData(user.id);
    }
    setIsUpdatingBid(false);
  };

  const formatCurrency = (amount: number, currency?: string) => {
    const c = currency || "INR";
    const sym = c === "USD" ? "$" : "₹";
    if (c === "INR") {
      if (amount >= 10000000) return `${sym}${(amount / 10000000).toFixed(2)} Cr`;
      if (amount >= 100000) return `${sym}${(amount / 100000).toFixed(2)} L`;
    }
    return `${sym}${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "rejected": return "bg-destructive/10 text-destructive border-destructive/20";
      case "withdrawn": return "bg-muted text-muted-foreground border-muted";
      default: return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
  };

  const getBidDisplayStatus = (bid: Bid) => {
    if (bid.deal_status === "closed") {
      if (bid.bid_status === "accepted") return "Submitted · Deal Closed";
      if (bid.bid_status === "rejected") return "Rejected · Deal Closed";
      return `${bid.bid_status === "accepted" ? "Submitted" : bid.bid_status} · Deal Closed`;
    }
    return bid.bid_status === "accepted" ? "Submitted" : bid.bid_status;
  };

  const canEditBid = (bid: Bid) => {
    return bid.deal_status !== "closed" && bid.deal_status !== "cancelled" && (bid.bid_status === "pending" || bid.bid_status === "accepted");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const committedByCurrency = myBids
    .filter(b => b.bid_status === "accepted" || b.bid_status === "pending")
    .reduce((acc, b) => {
      const deal = allDeals.find(d => d.id === b.deal_id);
      const c = (deal?.currency || "INR") === "USD" ? "USD" : "INR";
      acc[c] = (acc[c] || 0) + Number(b.bid_amount);
      return acc;
    }, {} as Record<"INR" | "USD", number>);
  const totalCommittedINR = committedByCurrency.INR || 0;
  const totalCommittedUSD = committedByCurrency.USD || 0;

  const activeBids = myBids.filter(b => b.bid_status === "accepted" && b.deal_status !== "closed").length;
  const acceptedBids = myBids.filter(b => b.bid_status === "accepted").length;

  return (
    <div className="min-h-screen bg-muted">
      <DashboardNavbar />
      <OnboardingTour />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <BackButton />
          <div className="max-w-6xl mx-auto">
            {/* Welcome */}
            <div className="relative bg-gradient-to-br from-primary/8 via-background to-primary/5 rounded-3xl p-6 sm:p-8 md:p-10 mb-8 border border-divider overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/3 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
              <div className="relative z-10">
                <p className="text-muted-foreground text-sm sm:text-base mb-1">{getGreeting()}</p>
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground mb-3">
                  Welcome back, {profile?.full_name?.split(" ")[0]}!
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm sm:text-base">
                  <span>You're logged in as</span>
                  <Badge variant="outline" className="capitalize font-medium text-primary border-primary/30 bg-primary/5 text-sm px-3 py-0.5">
                    Distribution Partner
                  </Badge>
                  {profile?.organisation && (
                    <span className="text-foreground font-medium">at {profile.organisation}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{deals.length}</p>
                    <p className="text-sm text-muted-foreground">Available Deals</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{activeBids}</p>
                    <p className="text-sm text-muted-foreground">Active Bids</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{acceptedBids}</p>
                    <p className="text-sm text-muted-foreground">Submitted Bids</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0">
                      <p className="text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap">{formatCurrency(totalCommittedINR, "INR")}</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap">{formatCurrency(totalCommittedUSD, "USD")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Total Committed</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions — moved to top */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4 px-1">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg font-semibold text-foreground">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { to: "/advisors", icon: Users, title: "Advisor Network", description: "Browse and connect with advisors", gradient: "from-blue-500/20 to-indigo-500/10", hoverGradient: "group-hover:from-blue-500/30 group-hover:to-indigo-500/20", tourId: "quick-network" },
                  { to: "/laboratories", icon: Building2, title: "Laboratory Network", description: "Browse and connect with laboratories", gradient: "from-emerald-500/20 to-teal-500/10", hoverGradient: "group-hover:from-emerald-500/30 group-hover:to-teal-500/20", tourId: "" },
                  { to: "#deals", icon: Briefcase, title: "Deals & Bids", description: "View deals and place bids", gradient: "from-amber-500/20 to-orange-500/10", hoverGradient: "group-hover:from-amber-500/30 group-hover:to-orange-500/20", tourId: "quick-deals" },
                  { to: "/edit-profile", icon: Pencil, title: "Edit Profile", description: "Update your business details", gradient: "from-primary/20 to-primary/5", hoverGradient: "group-hover:from-primary/30 group-hover:to-primary/10", tourId: "quick-edit-profile" },
                ].map((link) => {
                  const cardContent = (
                    <Card data-tour={link.tourId || undefined} className="group hover:shadow-lg hover:scale-[1.01] transition-all duration-300 border-divider cursor-pointer bg-background overflow-hidden h-full">
                      <CardContent className="p-0">
                        <div className="flex items-center gap-4 p-5">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${link.gradient} ${link.hoverGradient} flex items-center justify-center transition-all duration-300 shrink-0`}>
                            <link.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-heading text-base font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors truncate">
                              {link.title}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {link.description}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                  if (link.to === "#deals") {
                    return (
                      <div key={link.to} onClick={() => document.getElementById("deals-section")?.scrollIntoView({ behavior: "smooth" })} className="cursor-pointer">
                        {cardContent}
                      </div>
                    );
                  }
                  return <Link key={link.to} to={link.to}>{cardContent}</Link>;
                })}
              </div>
            </div>

            {/* Deal Indicators removed — now per-deal indicators inside the deal detail dialog */}

            {/* Available Deals */}
            <Card id="deals-section" className="mb-8">
              <CardHeader>
                <CardTitle>Available Deals</CardTitle>
                <CardDescription>Published deals you can bid on</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Input
                    placeholder="Search by deal name..."
                    value={dealSearchTerm}
                    onChange={(e) => { setDealSearchTerm(e.target.value); setDealShowCount(15); }}
                    className="w-48"
                  />
                  <select
                    value={dealCurrencyFilter}
                    onChange={(e) => { setDealCurrencyFilter(e.target.value); setDealShowCount(15); }}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">All Currencies</option>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                {filteredDeals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {deals.length === 0 ? "No deals available at the moment." : "No deals match your filters."}
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredDeals.slice(0, dealShowCount).map((deal) => {
                        const liveRaised = dealSubscriptions[deal.id] ?? deal.raised_amount;
                        const progress = deal.target_amount > 0 ? (liveRaised / deal.target_amount) * 100 : 0;
                        const existingBid = myBids.find(b => b.deal_id === deal.id && b.bid_status !== "withdrawn");
                        return (
                          <Card
                            key={deal.id}
                            className="border border-divider cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
                            onClick={() => setViewDealDetail(deal)}
                          >
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between mb-3 gap-2">
                                <h3 className="font-heading text-lg font-semibold text-foreground">{deal.title}</h3>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge className="bg-orange-500/15 text-orange-600 border border-orange-500/30 hover:bg-orange-500/20">
                                    {dealBidCounts[deal.id] || 0} BIDS
                                  </Badge>
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                    Open
                                  </Badge>
                                </div>
                              </div>
                              {deal.description && (
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{deal.description}</p>
                              )}
                              <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Target</span>
                                  <span className="font-semibold text-foreground">{formatCurrency(deal.target_amount, deal.currency)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Raised</span>
                                  <span className="font-semibold text-primary">{formatCurrency(liveRaised, deal.currency)}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className="bg-primary rounded-full h-2 transition-all"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground text-right">{progress.toFixed(1)}% funded</p>
                              </div>
                              <div className="mt-4 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                {deal.document_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => window.open(deal.document_url!, '_blank')}
                                  >
                                    <FileText className="w-4 h-4 mr-2" /> View Document
                                  </Button>
                                )}
                                {existingBid ? (
                                  <p className="text-sm text-muted-foreground">
                                    You've bid <span className="font-semibold text-foreground">{formatCurrency(existingBid.bid_amount, deal.currency)}</span>
                                    {" "}<Badge className={getStatusColor(existingBid.bid_status)}>{existingBid.bid_status === "accepted" ? "Submitted" : existingBid.bid_status}</Badge>
                                  </p>
                                ) : (
                                  <Button className="w-full" onClick={() => setSelectedDeal(deal)}>
                                    Place Bid
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    {filteredDeals.length > dealShowCount && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => setDealShowCount(c => c + 15)}>Show More</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDealShowCount(filteredDeals.length)}>Show All ({filteredDeals.length})</Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* My Bids */}
            <Card>
              <CardHeader>
                <CardTitle>My Bids</CardTitle>
                <CardDescription>Track all your bids and commitments</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Input
                    placeholder="Search by deal name..."
                    value={bidSearchTerm}
                    onChange={(e) => { setBidSearchTerm(e.target.value); setBidShowCount(15); }}
                    className="w-48"
                  />
                  <select
                    value={bidStatusFilter}
                    onChange={(e) => { setBidStatusFilter(e.target.value); setBidShowCount(15); }}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="deal_closed">Deal Closed</option>
                    <option value="withdrawn">Withdrawn</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <select
                    value={bidCurrencyFilter}
                    onChange={(e) => { setBidCurrencyFilter(e.target.value); setBidShowCount(15); }}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">All Currencies</option>
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                  </select>
                </div>

                {filteredMyBids.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {myBids.length === 0 ? "No bids placed yet." : "No bids match the selected filters."}
                  </p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {filteredMyBids.slice(0, bidShowCount).map((bid) => {
                        const bidDeal = allDeals.find(d => d.id === bid.deal_id);
                        return (
                        <div
                          key={bid.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-divider rounded-xl cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
                          onClick={() => bidDeal && setViewDealDetail(bidDeal)}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground break-words">{bid.deal_title}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(bid.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:justify-end" onClick={(e) => e.stopPropagation()}>
                            <span className="font-semibold text-foreground whitespace-nowrap">{formatCurrency(bid.bid_amount, bidDeal?.currency)}</span>
                            <Badge className={`${getStatusColor(bid.bid_status)} whitespace-nowrap`}>{getBidDisplayStatus(bid)}</Badge>
                            {canEditBid(bid) && (
                              <Button variant="outline" size="sm" onClick={() => handleEditBid(bid)}>
                                <Pencil className="w-3 h-3 mr-1" /> Edit
                              </Button>
                            )}
                            {bid.bid_status === "accepted" && bid.deal_status !== "closed" && (
                              <Button variant="outline" size="sm" onClick={() => handleWithdrawBid(bid.id)}>
                                Withdraw
                              </Button>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    {filteredMyBids.length > bidShowCount && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => setBidShowCount(c => c + 15)}>Show More</Button>
                        <Button variant="ghost" size="sm" onClick={() => setBidShowCount(filteredMyBids.length)}>Show All ({filteredMyBids.length})</Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Place Bid Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Bid on "{selectedDeal?.title}"</DialogTitle>
            <DialogDescription>
              Target: {selectedDeal && formatCurrency(selectedDeal.target_amount, selectedDeal.currency)} ({selectedDeal?.currency || "INR"})
              {selectedDeal?.min_bid_amount && (
                <span className="block mt-1 text-amber-600 font-medium">
                  Minimum Bid: {(selectedDeal.currency || "INR") === "USD" ? "$" : "₹"}{Number(selectedDeal.min_bid_amount).toLocaleString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bid Amount ({(selectedDeal?.currency || "INR") === "USD" ? "$" : "₹"}) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter bid amount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes for the admin..."
                value={bidNotes}
                onChange={(e) => setBidNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDeal(null)}>Cancel</Button>
            <Button onClick={handlePlaceBid} disabled={isSubmittingBid || !bidAmount}>
              {isSubmittingBid ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bid Dialog */}
      <Dialog open={!!editingBid} onOpenChange={() => setEditingBid(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bid - "{editingBid?.deal_title}"</DialogTitle>
            <DialogDescription>
              Modify your bid amount or notes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bid Amount ({(allDeals.find(d => d.id === editingBid?.deal_id)?.currency || "INR") === "USD" ? "$" : "₹"}) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter bid amount"
                value={editBidAmount}
                onChange={(e) => setEditBidAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes for the admin..."
                value={editBidNotes}
                onChange={(e) => setEditBidNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBid(null)}>Cancel</Button>
            <Button onClick={handleUpdateBid} disabled={isUpdatingBid || !editBidAmount}>
              {isUpdatingBid ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Update Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Details Dialog */}
      <Dialog open={!!viewDealDetail} onOpenChange={() => setViewDealDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="break-words">{viewDealDetail?.title}</DialogTitle>
            <DialogDescription>Deal details and current activity</DialogDescription>
          </DialogHeader>
          {viewDealDetail && (() => {
            const dealCurr = viewDealDetail.currency || "INR";
            const sym = dealCurr === "USD" ? "$" : "₹";
            const liveSubscription = dealSubscriptions[viewDealDetail.id] ?? 0;
            const investorsCommitted = dealBidCounts[viewDealDetail.id] || 0;
            const target = Number(viewDealDetail.target_amount) || 0;
            const overSubscription = Math.max(0, liveSubscription - target);
            const pct = target > 0 ? (liveSubscription / target) * 100 : 0;
            const myBidOnDeal = myBids.find(b => b.deal_id === viewDealDetail.id && b.bid_status !== "withdrawn");
            return (
              <div className="space-y-5 py-2">
                {/* Deal-specific circular indicators */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <CircularIndicator
                    label="Investors Committed"
                    value={String(investorsCommitted)}
                    progress={Math.min((investorsCommitted / 200) * 100, 100)}
                  />
                  <CircularIndicator
                    label="Subscription"
                    value={`${dealCurr}\n${formatCompact(liveSubscription, dealCurr)}`}
                    progress={target > 0 ? Math.min((liveSubscription / target) * 100, 100) : 0}
                    emphasized
                  />
                  <CircularIndicator
                    label="Over Subscription"
                    value={`${dealCurr}\n${formatCompact(overSubscription, dealCurr)}`}
                    progress={target > 0 ? Math.min((overSubscription / target) * 100, 100) : 0}
                  />
                </div>

                {/* Subscription progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Subscription Progress</span>
                    <span>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Highlighted Target + Your Bid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Target</p>
                    <p className="font-bold text-lg text-primary break-words">{formatCurrency(target, dealCurr)}</p>
                  </div>
                  {myBidOnDeal ? (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">You've Bid</p>
                      <p className="font-bold text-lg text-emerald-600 break-words">{formatCurrency(Number(myBidOnDeal.bid_amount), dealCurr)}</p>
                      <p className="text-[11px] text-muted-foreground capitalize mt-0.5">Status: {myBidOnDeal.bid_status}</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">You haven't bid on this deal yet</p>
                    </div>
                  )}
                </div>

                {viewDealDetail.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">{viewDealDetail.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Currency</Label>
                    <p className="font-medium">{dealCurr}</p>
                  </div>
                  {viewDealDetail.min_bid_amount != null && (
                    <div>
                      <Label className="text-muted-foreground">Minimum Bid</Label>
                      <p className="font-medium">{sym}{Number(viewDealDetail.min_bid_amount).toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 capitalize">
                        {viewDealDetail.deal_status}
                      </Badge>
                    </p>
                  </div>
                </div>
                {viewDealDetail.document_url && (
                  <Button variant="outline" className="w-full" onClick={() => window.open(viewDealDetail.document_url!, '_blank')}>
                    <FileText className="w-4 h-4 mr-2" /> View Document
                  </Button>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDealDetail(null)}>Close</Button>
            {viewDealDetail && !myBids.find(b => b.deal_id === viewDealDetail.id && b.bid_status !== "withdrawn") && (
              <Button onClick={() => { setSelectedDeal(viewDealDetail); setViewDealDetail(null); }}>
                Place Bid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning ☀️";
  if (hour < 17) return "Good afternoon 🌤️";
  return "Good evening 🌙";
}

function formatCompact(amount: number, currency: string) {
  if (currency === "INR") {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)} L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)} K`;
    return amount.toLocaleString();
  }
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)} B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)} M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)} K`;
  return amount.toLocaleString();
}

function CircularIndicator({
  label,
  value,
  progress,
  emphasized = false,
}: {
  label: string;
  value: string;
  progress: number;
  emphasized?: boolean;
}) {
  const size = 120;
  const stroke = emphasized ? 10 : 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clamped / 100) * circumference;
  const lines = value.split("\n");

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          {lines.map((l, i) => (
            <span
              key={i}
              className={`leading-tight ${
                lines.length > 1 && i === 0
                  ? "text-xs text-muted-foreground"
                  : "text-sm sm:text-base font-bold text-foreground"
              }`}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-medium">
        {label}
      </p>
    </div>
  );
}
