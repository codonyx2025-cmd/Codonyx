import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FlaskConical, Globe, Shield, Users, Microscope, Beaker, CheckCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import heroHealthcare2 from "@/assets/hero-healthcare-2.jpg";

const benefits = [
  { icon: Users, title: "Expert Advisors", desc: "Connect with world-class advisors across 70+ countries for guidance and collaboration." },
  { icon: Microscope, title: "AI-Powered Matching", desc: "Our intelligent platform pairs you with advisors who align perfectly with your research focus." },
  { icon: Beaker, title: "Breakthrough Research", desc: "Collaborate on cutting-edge projects in molecular biology, diagnostics, and GMP manufacturing." },
  { icon: Shield, title: "Secure Environment", desc: "Confidential partnerships protected by enterprise-grade security and encryption." },
];

const RegisterLaboratoryLandingPage = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero + CTA */}
        <section className="relative pt-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroHealthcare2} alt="" className="w-full h-full object-cover" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
          </div>
          <div className="container mx-auto px-6 lg:px-8 relative z-10 py-16 lg:py-24">
            <div
              ref={heroRef}
              className={`max-w-3xl mb-12 transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm mb-6">
                <FlaskConical className="w-8 h-8 text-emerald-glow" />
              </div>
              <h1 className="font-display text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Register Your <span className="text-emerald-glow">Laboratory</span>
              </h1>
              <p className="text-white/80 text-lg lg:text-xl font-body leading-relaxed max-w-xl">
                Join our global platform to connect with elite advisors, access AI-powered matching, and accelerate your research impact.
              </p>
              <div className="mt-8">
                <Link to="/register-laboratory">
                  <Button variant="primary" size="lg" className="gap-2 text-base px-8 py-4">
                    <FlaskConical className="w-5 h-5" />
                    Register Now
                  </Button>
                </Link>
              </div>
            </div>

            {/* Key highlights */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
              {[
                { value: "70+", label: "Countries" },
                { value: "500+", label: "Expert Advisors" },
                { value: "99.9%", label: "Uptime SLA" },
                { value: "24/7", label: "Support" },
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
              Why Register
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-16 text-center">
              Benefits for Your Laboratory
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
                  { step: "1", title: "Register Your Lab", desc: "Fill out a simple form with your lab details, research areas, and services." },
                  { step: "2", title: "Admin Review", desc: "Our team reviews your application to maintain platform quality and trust." },
                  { step: "3", title: "Get Matched", desc: "Once approved, our AI matches you with relevant advisors and opportunities." },
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

export default RegisterLaboratoryLandingPage;
