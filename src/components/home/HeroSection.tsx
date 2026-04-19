import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/useCountUp";
import { useBannerImages } from "@/hooks/useBannerImages";
import { ArrowRight } from "lucide-react";

function StatCounter({ end, suffix, label, enabled }: { end: number; suffix: string; label: string; enabled: boolean }) {
  const count = useCountUp(end, 2200, 0, enabled);
  return (
    <div className="text-center px-3 sm:px-6">
      <div className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-emerald-glow mb-1">
        {count}{suffix}
      </div>
      <div className="text-white/60 font-body text-[10px] sm:text-xs uppercase tracking-wider leading-tight">
        {label}
      </div>
    </div>
  );
}

// Floating molecular SVG decorations (cells, chromosomes, DNA)
function FloatingDecor() {
  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Cell — top right */}
      <svg className="absolute top-[12%] right-[6%] w-16 h-16 sm:w-24 sm:h-24 text-emerald-glow/30 animate-float-slow" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="14" fill="currentColor" opacity="0.4" />
        <circle cx="35" cy="38" r="3" fill="currentColor" opacity="0.6" />
        <circle cx="62" cy="60" r="2" fill="currentColor" opacity="0.6" />
      </svg>
      {/* Chromosome — middle left */}
      <svg className="absolute top-[40%] left-[4%] w-10 h-16 sm:w-14 sm:h-24 text-emerald-glow/25 animate-float" viewBox="0 0 40 80" fill="none">
        <path d="M10 5 Q20 20 10 35 Q0 50 10 65 Q20 75 10 78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 5 Q20 20 30 35 Q40 50 30 65 Q20 75 30 78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="40" x2="30" y2="40" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {/* DNA helix — bottom right */}
      <svg className="absolute bottom-[28%] right-[10%] w-12 h-20 sm:w-16 sm:h-28 text-emerald-glow/20 animate-float-delayed" viewBox="0 0 50 100" fill="none">
        <path d="M5 5 Q25 20 45 5 Q25 35 5 50 Q25 65 45 50 Q25 80 5 95" stroke="currentColor" strokeWidth="1.5" />
        <path d="M45 5 Q25 20 5 5 Q25 35 45 50 Q25 65 5 50 Q25 80 45 95" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {/* Small cell — top left */}
      <svg className="absolute top-[22%] left-[14%] w-10 h-10 sm:w-14 sm:h-14 text-emerald-glow/25 animate-float-delayed" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.5" />
      </svg>
      {/* DNA — middle right */}
      <svg className="absolute top-[55%] right-[20%] w-10 h-16 sm:w-12 sm:h-20 text-emerald-glow/20 animate-float-slow" viewBox="0 0 50 100" fill="none">
        <path d="M5 5 Q25 20 45 5 Q25 35 5 50 Q25 65 45 50 Q25 80 5 95" stroke="currentColor" strokeWidth="1.5" />
        <path d="M45 5 Q25 20 5 5 Q25 35 45 50 Q25 65 5 50 Q25 80 45 95" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {/* Tiny dots */}
      <div className="absolute top-[18%] right-[30%] w-2 h-2 rounded-full bg-emerald-glow/40 animate-float" />
      <div className="absolute bottom-[35%] left-[28%] w-1.5 h-1.5 rounded-full bg-emerald-glow/50 animate-float-delayed" />
      <div className="absolute top-[60%] left-[45%] w-1 h-1 rounded-full bg-emerald-glow/60 animate-float-slow" />
      <svg className="absolute bottom-[18%] left-[8%] w-8 h-14 sm:w-10 sm:h-16 text-emerald-glow/25 animate-float-medium" viewBox="0 0 40 80" fill="none">
        <path d="M10 5 Q20 20 10 35 Q0 50 10 65 Q20 75 10 78" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M30 5 Q20 20 30 35 Q40 50 30 65 Q20 75 30 78" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <svg className="absolute top-[30%] right-[32%] w-8 h-12 sm:w-10 sm:h-16 text-emerald-glow/20 animate-float-fast-reverse" viewBox="0 0 50 100" fill="none">
        <path d="M5 5 Q25 20 45 5 Q25 35 5 50 Q25 65 45 50 Q25 80 5 95" stroke="currentColor" strokeWidth="1.5" />
        <path d="M45 5 Q25 20 5 5 Q25 35 45 50 Q25 65 5 50 Q25 80 45 95" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg className="absolute bottom-[30%] right-[4%] w-10 h-10 sm:w-14 sm:h-14 text-emerald-glow/20 animate-float-reverse" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.4" />
      </svg>
    </div>
  );
}

export function HeroSection() {
  const { banners } = useBannerImages();
  const heroImages = useMemo(
    () => banners.map((b) => ({ src: b.image_url, alt: b.alt_text || "CODONYX banner" })),
    [banners]
  );

  const [currentImage, setCurrentImage] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    if (currentImage >= heroImages.length) setCurrentImage(0);
  }, [heroImages.length, currentImage]);

  useEffect(() => {
    heroImages.forEach(({ src }) => {
      const img = new Image();
      img.src = src;
    });
  }, [heroImages]);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStatsVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-navy">
      {/* Background images (admin-managed only — no fallback) */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((img, index) => (
          <img
            key={`${img.src}-${index}`}
            src={img.src}
            alt={img.alt}
            loading="eager"
            decoding="sync"
            fetchPriority={index === 0 ? "high" : "auto"}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentImage ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/75 to-navy/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
      </div>

      {/* Floating molecular decorations */}
      <FloatingDecor />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 min-h-screen flex flex-col">
        {/* Top spacer for navbar */}
        <div className="h-20 sm:h-24 lg:h-28" />

        {/* Main hero text */}
        <div className="flex-1 flex flex-col justify-center max-w-4xl py-6">
          <p className="text-emerald-glow font-mono-display text-sm sm:text-base font-medium tracking-[0.2em] uppercase mb-4 sm:mb-6 animate-fade-in">
            Molecular Science · AI Healthcare · Global Impact
          </p>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-5 sm:mb-7 animate-fade-in tracking-tight">
            Where Life's Code{" "}
            <br className="hidden sm:block" />
            Meets Planetary{" "}
            <span className="text-emerald-glow">Responsibility.</span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-7 sm:mb-9 animate-fade-in-delayed font-body max-w-2xl leading-relaxed">
            CODONYX blends molecular biology, artificial intelligence and Earth-conscious
            innovation to shape the future of life sciences.
          </p>

          <div className="animate-fade-in-delayed">
            <Link to="/services">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-full px-7 py-6 text-base font-semibold shadow-2xl group"
              >
                Explore Our Solutions
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* NASA-style 3-column link grid — shifted up */}
        <div className="border-t border-white/15 pb-10 sm:pb-14 pt-5 sm:pt-6 animate-fade-in-delayed">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 lg:gap-12 mb-6">
            {[
              { label: "Become an Advisor", sub: "Join our expert network", to: "/become-advisor" },
              { label: "Register as Laboratory", sub: "Showcase your research", to: "/laboratory-info" },
              { label: "Distribution Partner", sub: "Expand your reach globally", to: "/distributor-info" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group block border-t-2 border-white/30 pt-4 hover:border-emerald-glow transition-colors"
              >
                <p className="text-emerald-glow font-mono-display text-xs sm:text-sm tracking-[0.2em] uppercase mb-2 font-medium">
                  {item.sub}
                </p>
                <div className="flex items-center justify-between text-white">
                  <span className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight">
                    {item.label}
                  </span>
                  <span className="ml-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/90 group-hover:bg-emerald-glow group-hover:text-navy transition-all flex-shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Stats row */}
          <div ref={statsRef} className="flex justify-start divide-x divide-white/15 -mx-3 sm:-mx-6">
            <StatCounter end={80} suffix="%" label="Clinical Decisions via Diagnostics" enabled={statsVisible} />
            <StatCounter end={150} suffix="B+" label="AI Healthcare Market by 2030" enabled={statsVisible} />
            <StatCounter end={8} suffix="B+" label="Lives Impacted Globally" enabled={statsVisible} />
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      {heroImages.length > 1 && (
        <div className="absolute bottom-16 sm:bottom-20 lg:bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {heroImages.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCurrentImage(i)}
              className={`h-1 rounded-full transition-all ${
                i === currentImage ? "w-8 bg-emerald-glow" : "w-4 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
