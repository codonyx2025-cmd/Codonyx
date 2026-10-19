import chromosomesImage from "@/assets/chromosomes.jpg";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function PhilosophySection() {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className={`relative py-24 lg:py-32 bg-background overflow-hidden transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <p className="text-primary font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4">
              Our Philosophy
            </p>
            <h2 className="font-display text-3xl lg:text-5xl font-normal text-foreground leading-tight mb-8">
              The Name Behind{" "}
              <span className="text-primary">CODONYX</span>
            </h2>
            <div className="space-y-5 text-muted-foreground font-body text-lg leading-relaxed">
              <p>
                <strong className="text-foreground">Codon</strong> — the elemental code of life, 
                the three-nucleotide sequence that instructs the building of every protein 
                in every living organism.
              </p>
              <p>
                <strong className="text-foreground">Onyx</strong> — symbolizing Earth's strength, 
                mystery and the resilient foundation upon which all biological systems depend.
              </p>
              <p>
                The embedded <strong className="text-primary">"YX"</strong> reflects sex chromosomes — 
                honoring biological diversity, balance and the fundamental blueprint 
                that differentiates and unites all life.
              </p>
            </div>
          </div>

          {/* Chromosome Visual */}
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={chromosomesImage}
                alt="Scientific visualization of chromosomes"
                className="w-80 h-80 lg:w-96 lg:h-96 object-cover rounded-lg"
              />
              <div className="absolute inset-0 rounded-2xl border border-divider" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
