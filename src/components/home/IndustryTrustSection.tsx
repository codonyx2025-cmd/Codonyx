import { ShieldCheck, Scale, Globe, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
const trustBadges = [
  { icon: ShieldCheck, label: "Ethical AI" },
  { icon: Scale, label: "Regulatory Compliance" },
  { icon: Globe, label: "Global Standards Alignment" },
  { icon: Leaf, label: "Sustainable Manufacturing" },
];

export function IndustryTrustSection() {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section ref={ref} className={`py-24 lg:py-32 bg-background transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
      <div className="container mx-auto px-6 lg:px-8">
        {/* Trust Badges */}
        <div className="text-center mb-20">
          <p className="text-primary font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4">
            Built on Trust
          </p>
          <h2 className="font-display text-3xl lg:text-4xl font-normal text-foreground mb-12">
            Industry Standards We Uphold
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-4 p-6 rounded-lg border border-divider bg-background"
              >
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <badge.icon className="w-7 h-7 text-primary" />
                </div>
                <span className="text-muted-foreground font-body text-sm font-medium text-center">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Collaboration CTA */}
        <div className="text-center border-t border-divider pt-16">
          <h3 className="font-display text-2xl lg:text-3xl font-normal text-foreground mb-4">
            Let's Shape the Future Together
          </h3>
          <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto mb-8">
            We invite laboratories, healthcare systems and research institutions 
            worldwide to explore partnership opportunities with CODONYX.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button variant="hero" size="xl" className="bg-primary text-primary-foreground hover:bg-primary-hover">
                Start a Conversation
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="outline" size="xl" className="border-divider text-foreground hover:bg-muted">
                Learn About Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
