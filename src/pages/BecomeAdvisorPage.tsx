import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserCheck, Mail, ShieldCheck, Globe, Brain, FlaskConical, Microscope } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import heroHealthcare2 from "@/assets/hero-healthcare-2.jpg";
import chromosomesImg from "@/assets/chromosomes.jpg";

const benefits = [
  { icon: Globe, title: "Global Network", desc: "Connect with laboratories and researchers across 70+ countries worldwide." },
  { icon: Brain, title: "AI-Driven Matching", desc: "Our intelligent platform pairs you with labs that align perfectly with your expertise." },
  { icon: FlaskConical, title: "Cutting-Edge Projects", desc: "Advise on breakthrough research in molecular biology, diagnostics and GMP manufacturing." },
  { icon: Microscope, title: "Shape the Future", desc: "Your insights directly influence the next generation of healthcare innovation." },
];

const BecomeAdvisorPage = () => {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();
  const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Combined Hero + Invitation CTA */}
        <section className="relative pt-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroHealthcare2} alt="" className="w-full h-full object-cover" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/80 to-navy/95" />
          </div>
          <div className="container mx-auto px-6 lg:px-8 relative z-10 py-16 lg:py-24">
            <div
              ref={heroRef}
              className={`max-w-3xl mb-16 transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm mb-6">
                <UserCheck className="w-8 h-8 text-emerald-glow" />
              </div>
              <h1 className="font-display text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Become an <span className="text-emerald-glow">Advisor</span>
              </h1>
              <p className="text-white/80 text-lg lg:text-xl font-body leading-relaxed max-w-xl">
                Join our exclusive network of world-class advisors shaping the future of molecular science, AI-driven healthcare, and sustainable innovation.
              </p>
            </div>

            {/* Invitation CTA inline */}
            <div
              ref={ctaRef}
              className={`max-w-2xl mx-auto text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-10 lg:p-14 transition-all duration-700 ${ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-glow/20 mb-6">
                <ShieldCheck className="w-7 h-7 text-emerald-glow" />
              </div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-5">
                Invitation-Only Registration
              </h2>
              <p className="text-white/70 font-body text-base leading-relaxed mb-4">
                We maintain the highest standards by operating on an invitation-only basis.
                To ensure quality and trust within our advisor network, registration is exclusively
                available through a personal invitation from the Codonyx team.
              </p>
              <p className="text-white/70 font-body text-base leading-relaxed mb-8">
                If you are a seasoned professional in life sciences, biotechnology, pharmaceutical development,
                or AI-driven healthcare and wish to contribute as an advisor, please reach out to us.
              </p>
              <Link to="/contact">
                <Button variant="primary" size="lg" className="gap-2 text-base px-8 py-4">
                  <Mail className="w-5 h-5" />
                  Contact Us for Registration
                </Button>
              </Link>
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
              Why Join Us
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-16 text-center">
              Benefits of Being an Advisor
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
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BecomeAdvisorPage;
