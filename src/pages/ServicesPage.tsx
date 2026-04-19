import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import capGenomics from "@/assets/cap-genomics.jpg";
import capAiDiagnostics from "@/assets/cap-ai-diagnostics.jpg";
import capGmp from "@/assets/cap-gmp.jpg";
import capRegulatory from "@/assets/cap-regulatory.jpg";
import capTechTransfer from "@/assets/cap-tech-transfer.jpg";
import capPartnerships from "@/assets/cap-partnerships.jpg";

const capabilities = [
  {
    image: capGenomics,
    title: "Molecular Biology & Genomics",
    description: "Advanced genomic analysis and molecular engineering for precision therapeutics.",
  },
  {
    image: capAiDiagnostics,
    title: "AI-Driven Diagnostics",
    description: "Machine learning models that accelerate disease detection and patient outcomes.",
  },
  {
    image: capGmp,
    title: "GMP Manufacturing",
    description: "Scalable, compliant production of biologics and advanced therapy products.",
  },
  {
    image: capRegulatory,
    title: "Regulatory & Compliance Strategy",
    description: "Global regulatory navigation ensuring market readiness across jurisdictions.",
  },
  {
    image: capTechTransfer,
    title: "Technology Transfer",
    description: "Seamless transition from lab-scale innovation to commercial-scale production.",
  },
  {
    image: capPartnerships,
    title: "Global Scientific Partnerships",
    description: "Cross-border collaborations connecting research institutions and industry leaders.",
  },
];

const ServicesPage = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section
          ref={ref}
          className={`py-24 lg:py-32 bg-background transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="container mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-primary font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4">
                What We Do
              </p>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Services
              </h2>
              <p className="text-muted-foreground text-lg font-body max-w-2xl mx-auto">
                Six integrated pillars driving molecular innovation from discovery to global deployment.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {capabilities.map((cap) => (
                <Link
                  key={cap.title}
                  to="/contact"
                  className="group rounded-xl border border-divider bg-card hover:border-primary/30 hover:shadow-card transition-all duration-300 overflow-hidden"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={cap.image}
                      alt={cap.title}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-lg font-semibold text-card-foreground mb-3">
                      {cap.title}
                    </h3>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed">
                      {cap.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ServicesPage;
