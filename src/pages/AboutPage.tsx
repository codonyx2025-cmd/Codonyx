import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import chromosomesImage from "@/assets/chromosomes.jpg";
import dnaHelixBg from "@/assets/dna-helix-bg.jpg";
import codonyxLogo from "@/assets/codonyx_logo.png";

export default function AboutPage() {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: aboutRef, isVisible: aboutVisible } = useScrollAnimation();
  const { ref: whatRef, isVisible: whatVisible } = useScrollAnimation();
  const { ref: howRef, isVisible: howVisible } = useScrollAnimation();
  const { ref: visionRef, isVisible: visionVisible } = useScrollAnimation();
  const { ref: spiritRef, isVisible: spiritVisible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Banner */}
        <section className="relative pt-20 overflow-hidden">
          <div className="absolute inset-0">
            <img src={dnaHelixBg} alt="" className="w-full h-full object-cover animate-dna-drift" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/70" />
          </div>
          <div
            ref={heroRef}
            className={`container mx-auto px-6 lg:px-8 relative z-10 py-20 lg:py-32 transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <div className="max-w-3xl">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm mb-6">
                <img src={codonyxLogo} alt="Codonyx" className="w-12 h-12 object-contain" />
              </div>
              <h1 className="font-display text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                About <span className="text-emerald-glow">CODONYX</span>
              </h1>
              <p className="text-white/80 text-lg lg:text-xl font-body leading-relaxed max-w-2xl">
                A purpose-driven life sciences organization at the intersection of molecular biology, diagnostics with artificial intelligence.
              </p>
            </div>
          </div>
        </section>

        {/* About CODONYX - Name Philosophy */}
        <section className="py-20 lg:py-28 bg-background">
          <div
            ref={aboutRef}
            className={`container mx-auto px-6 lg:px-8 transition-all duration-700 ${aboutVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-primary font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4">
                  About CODONYX
                </p>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-8 leading-tight">
                  Our Name Reflects Our Philosophy
                </h2>
                <div className="space-y-5 text-muted-foreground font-body text-lg leading-relaxed">
                  <p>
                    <strong className="text-primary">Codon</strong> represents the fundamental code of life — the triplet language that translates biology into function.
                  </p>
                  <p>
                    <strong className="text-primary">Onyx</strong> symbolizes Earth's depth, strength, and enduring energy.
                  </p>
                  <p>
                    The embedded <strong className="text-emerald-glow">"YX"</strong> subtly echoes the chromosomes that shape biological identity — honouring diversity, balance, and life itself.
                  </p>
                  <p>
                    Together, CODONYX stands where <strong className="text-foreground">life's code meets planetary responsibility</strong>.
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={chromosomesImage}
                    alt="Scientific visualization of chromosomes"
                    className="w-80 h-80 lg:w-96 lg:h-96 object-cover rounded-2xl shadow-2xl"
                  />
                  <div className="absolute inset-0 rounded-2xl border border-primary/20" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section className="relative py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0">
            <img src={dnaHelixBg} alt="" className="w-full h-full object-cover animate-dna-drift" aria-hidden="true" />
            <div className="absolute inset-0 bg-navy/80" />
          </div>
          <div
            ref={whatRef}
            className={`container mx-auto px-6 lg:px-8 relative z-10 transition-all duration-700 ${whatVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <p className="text-emerald-glow font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              What We Do
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-8 leading-tight max-w-3xl">
              Molecular and AI-Enabled Solutions
            </h2>
            <p className="text-white/90 font-body text-lg leading-relaxed mb-8 max-w-4xl">
              We innovate, develop, manufacture, and co-create <strong className="text-white">molecular and AI-enabled solutions</strong> for laboratories, researchers, healthcare systems, and industry partners worldwide.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {[
                "Molecular Biology",
                "Genomics & Genetic Engineering",
                "Clinical Diagnostics",
                "AI-driven data analytics and algorithm development",
                "GMP-aligned manufacturing and technology transfer",
                "Regulatory strategy and compliance",
                "Strategic joint ventures and global partnerships",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-glow mt-2.5 shrink-0" />
                  <span className="text-white/90 font-body text-base">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-white/85 font-body text-lg leading-relaxed max-w-4xl border-l-2 border-emerald-glow pl-6">
              We design solutions that are not only scientifically advanced, but <strong className="text-white">validated, traceable, and globally compliant</strong>.
            </p>
          </div>
        </section>

        {/* How We Work */}
        <section className="py-20 lg:py-28 bg-background">
          <div
            ref={howRef}
            className={`container mx-auto px-6 lg:px-8 transition-all duration-700 ${howVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <p className="text-primary font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              How We Work
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight max-w-3xl">
              Science Is Not Just a Tool — It Is a Responsibility
            </h2>
            <p className="text-muted-foreground font-body text-lg leading-relaxed mb-10 max-w-3xl">
              At CODONYX, science is not just a tool — it is a responsibility. We integrate:
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {[
                { title: "Regulatory rigor", desc: "Ensuring every product meets global compliance standards." },
                { title: "Quality by design", desc: "Building quality into every step of the process." },
                { title: "Ethical AI deployment", desc: "Responsible integration of artificial intelligence." },
                { title: "Collaborative innovation", desc: "Partnering across disciplines and borders." },
                { title: "Sustainable manufacturing", desc: "Principles that protect both people and planet." },
              ].map((item) => (
                <div key={item.title} className="bg-card border border-divider rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                  <h3 className="font-heading text-lg font-semibold text-card-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground font-body text-lg leading-relaxed max-w-4xl">
              From early R&D to technology transfer, clinical validation, regulatory approval, and global distribution, we build systems that stand up to scrutiny — and scale with integrity.
            </p>
          </div>
        </section>

        {/* Our Vision */}
        <section className="relative py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0">
            <img src={chromosomesImage} alt="" className="w-full h-full object-cover" aria-hidden="true" />
            <div className="absolute inset-0 bg-navy/90" />
          </div>
          <div
            ref={visionRef}
            className={`container mx-auto px-6 lg:px-8 relative z-10 max-w-3xl text-center transition-all duration-700 ${visionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <p className="text-emerald-glow font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              Our Vision
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-8">
              A Global Reference
            </h2>
            <p className="text-white/80 font-body text-lg leading-relaxed mb-8">
              We aim to become a global reference — not only for what we build, but for how we build it. We believe:
            </p>
            <div className="space-y-4 text-left max-w-2xl mx-auto">
              {[
                "Tiny molecular systems can create giant impact.",
                "AI can enhance biological intelligence when responsibly governed.",
                "Innovation must serve both humanity and Gaia — the living Earth.",
              ].map((belief) => (
                <div key={belief} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-glow mt-2.5 shrink-0" />
                  <span className="text-white/80 font-body text-lg">{belief}</span>
                </div>
              ))}
            </div>
            <p className="text-white/70 font-body text-lg leading-relaxed mt-8">
              Every molecule we engineer, every dataset we analyze, and every partnership we form is a step toward a healthier, more sustainable future.
            </p>
          </div>
        </section>

        {/* Our Spirit */}
        <section className="py-20 lg:py-28 bg-background">
          <div
            ref={spiritRef}
            className={`container mx-auto px-6 lg:px-8 max-w-3xl text-center transition-all duration-700 ${spiritVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <p className="text-primary font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              Our Spirit
            </p>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-8">
              We Cheer to Life!
            </h2>
            <div className="space-y-4 text-muted-foreground font-body text-xl leading-relaxed italic">
              <p>At CODONYX, we don't just operate in molecular science.</p>
              <p>We tune the code,</p>
              <p>we bridge life and possibility,</p>
              <p>and in everything we do —</p>
              <p className="text-primary font-semibold text-2xl not-italic">we cheer to life!</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
