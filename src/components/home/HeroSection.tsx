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
      <div className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-primary mb-1">
        {count}{suffix}
      </div>
      <div className="text-muted-foreground font-body text-[10px] sm:text-xs uppercase tracking-wider leading-tight">
        {label}
      </div>
    </div>
  );
}

// Presentation-only flag: set to false to pause the banner slideshow again.
const BANNER_SLIDESHOW_ENABLED = true;

export function HeroSection() {
  const { banners } = useBannerImages();
  const heroImages = useMemo(
    () => banners.map((b) => ({ src: b.image_url, alt: b.alt_text || "CODONYX banner" })),
    [banners]
  );

  const [currentImage, setCurrentImage] = useState(0);
  const [brokenSrcs, setBrokenSrcs] = useState<Set<string>>(new Set());
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Skip banner images that fail to load so a broken upload never blanks the hero.
  const rotationImages = useMemo(
    () => heroImages.filter(({ src }) => !brokenSrcs.has(src)),
    [heroImages, brokenSrcs]
  );

  useEffect(() => {
    if (!BANNER_SLIDESHOW_ENABLED || rotationImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % rotationImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [rotationImages.length]);

  useEffect(() => {
    if (currentImage >= rotationImages.length) setCurrentImage(0);
  }, [rotationImages.length, currentImage]);

  useEffect(() => {
    heroImages.forEach(({ src }) => {
      const img = new Image();
      img.onerror = () => setBrokenSrcs((prev) => new Set(prev).add(src));
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
    <section className="home-hero">
      <div className="container mx-auto px-6 lg:px-8">
        <p className="home-eyebrow">Molecular Science <span aria-hidden="true">/</span> AI Healthcare <span aria-hidden="true">/</span> Global Impact</p>
        <h1 className="home-title">CODONYX</h1>
        <h2 className="home-headline">Where Life's Code Meets Planetary Responsibility.</h2>
        <div className="home-intro">
          <p>CODONYX blends molecular biology, artificial intelligence and Earth-conscious innovation to shape the future of life sciences.</p>
          <Button asChild size="lg" className="rounded-full gap-4 shrink-0">
            <Link to="/services">Explore Our Solutions <ArrowRight className="h-5 w-5" /></Link>
          </Button>
        </div>
        <div className="home-pathways">
          {[
            { label: "Become an Advisor", sub: "Join our expert network", to: "/become-advisor" },
            { label: "Register as Laboratory", sub: "Showcase your research", to: "/laboratory-info" },
            { label: "Distribution Partner", sub: "Expand your reach globally", to: "/distributor-info" },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="home-pathway group">
              <p className="text-muted-foreground text-sm mb-3">{item.sub}</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-lg sm:text-xl font-medium">{item.label}</span>
                <ArrowRight className="w-5 h-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
        <figure className="home-banner" aria-roledescription="carousel">
          {rotationImages.map((image, index) => (
            <img
              key={image.src}
              src={image.src}
              alt={index === currentImage ? image.alt : ""}
              aria-hidden={index !== currentImage}
              loading="eager"
              decoding="async"
              fetchPriority={index === 0 ? "high" : undefined}
              className={index === currentImage ? "home-banner-img is-active" : "home-banner-img"}
            />
          ))}
        </figure>
        <div ref={statsRef} className="home-stats">
          <StatCounter end={80} suffix="%" label="Clinical Decisions via Diagnostics" enabled={statsVisible} />
          <StatCounter end={150} suffix="B+" label="AI Healthcare Market by 2030" enabled={statsVisible} />
          <StatCounter end={8} suffix="B+" label="Lives Impacted Globally" enabled={statsVisible} />
        </div>
      </div>
    </section>
  );
}
