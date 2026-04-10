import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, TrendingUp, Shield, Globe, BarChart3, Handshake, CheckCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import distributorDealsImage from "@/assets/distributor-deals.jpg";

const benefits = [
  { icon: TrendingUp, title: "Exclusive Deals", desc: "Access curated investment deals in molecular science and AI healthcare published by Codonyx." },
  { icon: Globe, title: "Global Reach", desc: "Expand your distribution network across 70+ countries with verified partners." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track your bids, commitments, and deal progress with a dedicated distributor dashboard." },
  { icon: Shield, title: "Verified Platform", desc: "All partners are admin-verified ensuring trust, quality, and secure transactions." },
];

const DistributorLandingPage = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero + CTA */}
        <section className="relative pt-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={distributorDealsImage} alt="Distribution deals and partnerships" className="w-full h-full object-cover" loading="eager" width={1280} height={720} />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
          </div>
          <div className="container mx-auto px-6 lg:px-8 relative z-10 py-16 lg:py-24">
            <div
              ref={heroRef}
              className={`max-w-3xl mb-12 transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm mb-6">
                <Truck className="w-8 h-8 text-emerald-glow" />
              </div>
              <h1 className="font-display text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Become a <span className="text-emerald-glow">Distribution Partner</span>
              </h1>
              <p className="text-white/80 text-lg lg:text-xl font-body leading-relaxed max-w-xl">
                Join our network of trusted distribution partners and gain access to exclusive deals in molecular science and AI healthcare.
              </p>
              <div className="mt-8">
                <Link to="/register-distributor">
                  <Button variant="primary" size="lg" className="gap-2 text-base px-8 py-4">
                    <Truck className="w-5 h-5" />
                    Register as Partner
                  </Button>
                </Link>
              </div>
            </div>

            {/* Key highlights */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
              {[
                { value: "₹20 Cr+", label: "Total Subscription" },
                { value: "34+", label: "Active Investors" },
                { value: "100%", label: "Verified Deals" },
                { value: "Real-time", label: "Bid Tracking" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-glow">{stat.value}</p>
                  <p className="text-white/60 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-20 lg:py-28 bg-background">
          <div
            ref={benefitsRef}
            className={`container mx-auto px-6 lg:px-8 transition-all duration-700 ${benefitsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <p className="text-primary font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4 text-center">
              Why Partner With Us
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-16 text-center">
              Benefits of Being a Distribution Partner
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((b) => (
                <div key={b.title} className="bg-card border border-divider rounded-xl p-6 text-center hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-5 group-hover:bg-primary/20 transition-colors">
                    <b.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-card-foreground mb-2">{b.title}</h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="mt-20 max-w-3xl mx-auto">
              <h3 className="font-display text-2xl font-bold text-foreground mb-8 text-center">
                How It Works
              </h3>
              <div className="space-y-6">
                {[
                  { step: "1", title: "Submit Application", desc: "Register with your business details and upload a verification document." },
                  { step: "2", title: "Admin Approval", desc: "Our team reviews your application to maintain trust and quality." },
                  { step: "3", title: "Access Deals", desc: "Browse exclusive deals, place bids, and track your investments from your dashboard." },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-heading text-lg font-semibold text-foreground">{item.title}</h4>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DistributorLandingPage;
