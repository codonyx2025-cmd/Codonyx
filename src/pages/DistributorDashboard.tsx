import { useEffect, useState } from "react";
import { useAccountGuard } from "@/hooks/useAccountGuard";
import { useNavigate } from "react-router-dom";
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
import { Loader2, TrendingUp, DollarSign, Briefcase, Target, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
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
  total_subscription: number;
  total_target: number;
}

export default function DistributorDashboard() {
  const navigate = useNavigate();
  useAccountGuard();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [aggregateStats, setAggregateStats] = useState<AggregateStats>({ unique_bidders: 0, approved_distributors: 0, total_subscription: 0, total_target: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidNotes, setBidNotes] = useState("");
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [editingBid, setEditingBid] = useState<Bid | null>(null);
  const [editBidAmount, setEditBidAmount] = useState("");
  const [editBidNotes, setEditBidNotes] = useState("");
  const [isUpdatingBid, setIsUpdatingBid] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('distributor-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deal_bids' }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, organisation, user_type, approval_status")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profileData || profileData.approval_status !== "approved" || profileData.user_type !== "distributor") {
      await supabase.auth.signOut({ scope: "local" });
      navigate("/auth");
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

    setIsLoading(false);
  };

  const handlePlaceBid = async () => {
    if (!selectedDeal || !profile || !bidAmount) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    const minBid = selectedDeal.min_bid_amount ? Number(selectedDeal.min_bid_amount) : 0;
    if (minBid > 0 && amount < minBid) {
      toast({
        title: "Bid amount too low",
        description: `Minimum bid for this deal is ₹${minBid.toLocaleString()}. You can't bid less than this amount.`,
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
      setSelectedDeal(null);
      setBidAmount("");
      setBidNotes("");
      loadData();
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
      loadData();
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
      loadData();
    }
    setIsUpdatingBid(false);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString()}`;
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

  const totalCommitted = myBids
    .filter(b => b.bid_status === "accepted" || b.bid_status === "pending")
    .reduce((sum, b) => sum + b.bid_amount, 0);

  const activeBids = myBids.filter(b => b.bid_status === "accepted" && b.deal_status !== "closed").length;
  const acceptedBids = myBids.filter(b => b.bid_status === "accepted").length;

  return (
    <div className="min-h-screen bg-muted">
      <DashboardNavbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <BackButton />
          <div className="max-w-6xl mx-auto">
            {/* Welcome */}
            <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 rounded-3xl p-8 mb-8 border border-divider">
              <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">
                Welcome, {profile?.full_name?.split(" ")[0]}!
              </h1>
              <p className="text-muted-foreground text-lg">
                Distribution Partner
                {profile?.organisation && <span> at {profile.organisation}</span>}
              </p>
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
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalCommitted)}</p>
                    <p className="text-sm text-muted-foreground">Total Committed</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deal Indicators */}
            {(() => {
               const approvedDistributors = aggregateStats.approved_distributors;
               const totalBidders = 34 + approvedDistributors;
              const totalSubscription = aggregateStats.total_subscription;
              const totalTarget = aggregateStats.total_target;
              const overCommitted = totalTarget > 0 ? Math.max(0, totalSubscription - totalTarget) : 0;
              const investorPercent = Math.min(100, (totalBidders / 250) * 100);
               const subscriptionPercent = totalTarget > 0 ? Math.min(100, (totalSubscription / totalTarget) * 100) : 0;
               const overPercent = totalTarget > 0 ? Math.min(100, (overCommitted / totalTarget) * 100) : 0;

              const fmtCurrency = (val: number) => {
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
                <Card className="mb-8">
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
                        value={totalSubscription > 0 ? fmtCurrency(totalSubscription) : "INR\n20.18 Cr"}
                        color={greenColor}
                      />
                      <CircleIndicator
                        percent={overPercent}
                        label="Over Committed"
                        value={overCommitted > 0 ? fmtCurrency(overCommitted) : "INR\n17.50 L"}
                        color={greenColor}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Available Deals */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Available Deals</CardTitle>
                <CardDescription>Published deals you can bid on</CardDescription>
              </CardHeader>
              <CardContent>
                {deals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No deals available at the moment.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {deals.map((deal) => {
                      const progress = deal.target_amount > 0 ? (deal.raised_amount / deal.target_amount) * 100 : 0;
                      const existingBid = myBids.find(b => b.deal_id === deal.id && b.bid_status !== "withdrawn");
                      return (
                        <Card key={deal.id} className="border border-divider">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-heading text-lg font-semibold text-foreground">{deal.title}</h3>
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                Open
                              </Badge>
                            </div>
                            {deal.description && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{deal.description}</p>
                            )}
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Target</span>
                                <span className="font-semibold text-foreground">{formatCurrency(deal.target_amount)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Raised</span>
                                <span className="font-semibold text-primary">{formatCurrency(deal.raised_amount)}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary rounded-full h-2 transition-all"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground text-right">{progress.toFixed(1)}% funded</p>
                            </div>
                            <div className="mt-4">
                              {existingBid ? (
                                <p className="text-sm text-muted-foreground">
                                  You've bid <span className="font-semibold text-foreground">{formatCurrency(existingBid.bid_amount)}</span>
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
                {myBids.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No bids placed yet.</p>
                ) : (
                  <div className="space-y-3">
                    {myBids.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between p-4 border border-divider rounded-xl">
                        <div>
                          <p className="font-medium text-foreground">{bid.deal_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(bid.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">{formatCurrency(bid.bid_amount)}</span>
                          <Badge className={getStatusColor(bid.bid_status)}>{getBidDisplayStatus(bid)}</Badge>
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
                    ))}
                  </div>
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
              Target: {selectedDeal && formatCurrency(selectedDeal.target_amount)}
              {selectedDeal?.min_bid_amount && (
                <span className="block mt-1 text-amber-600 font-medium">
                  Minimum Bid: ₹{Number(selectedDeal.min_bid_amount).toLocaleString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bid Amount (₹) *</Label>
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
              <Label>Bid Amount (₹) *</Label>
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

      <Footer />
    </div>
  );
}
