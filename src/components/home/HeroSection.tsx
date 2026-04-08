import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/useCountUp";
import heroLabImage from "@/assets/hero-lab.jpg";
import heroHealthcare1 from "@/assets/hero-healthcare-1.jpg";
import heroHealthcare2 from "@/assets/hero-healthcare-2.jpg";
import heroHealthcare3 from "@/assets/hero-healthcare-3.jpg";

const heroImages = [heroLabImage, heroHealthcare1, heroHealthcare2, heroHealthcare3];

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

export function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`AI healthcare technology ${index + 1}`}
            loading={index === 0 ? "eager" : "lazy"}
            decoding={index === 0 ? "sync" : "async"}
            fetchPriority={index === 0 ? "high" : undefined}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentImage ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/60" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-24 relative z-10">
        <div className="flex flex-col justify-center min-h-[80vh] lg:min-h-[70vh] max-w-3xl">
          <p className="text-emerald-glow font-body text-xs sm:text-sm font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-4 sm:mb-6 animate-fade-in drop-shadow-lg">
            Molecular Science · AI Healthcare · Global Impact
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.15] mb-4 sm:mb-6 animate-fade-in drop-shadow-2xl">
            Where Life's Code Meets Planetary{" "}
            <span className="italic text-emerald-glow drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              Responsibility.
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 animate-fade-in-delayed font-body max-w-lg leading-relaxed drop-shadow-lg">
            CODONYX blends molecular biology, artificial intelligence and 
            Earth-conscious innovation to shape the life.
          </p>

          {/* Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 animate-fade-in-delayed mb-12 sm:mb-16">
            <Link to="/services" className="col-span-2 sm:col-span-1">
              <Button variant="hero" size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xl text-sm sm:text-base px-5 sm:px-8 py-3 sm:py-4">
                Explore Our Solutions
              </Button>
            </Link>
            <Link to="/become-advisor">
              <Button variant="outline" size="lg" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm shadow-xl text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-4">
                Become an Advisor
              </Button>
            </Link>
            <Link to="/laboratory-info">
              <Button variant="outline" size="lg" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm shadow-xl text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-4">
                Register as Laboratory
              </Button>
            </Link>
            <Link to="/distributor-info" className="col-span-2 sm:col-span-1">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm shadow-xl text-xs sm:text-sm px-4 sm:px-6 py-3 sm:py-4">
                Our Distribution Partner
              </Button>
            </Link>
          </div>

          {/* Stats with counting effect */}
          <div ref={statsRef} className="flex justify-start divide-x divide-white/20">
            <StatCounter end={80} suffix="%" label="Clinical Decisions via Diagnostics" enabled={statsVisible} />
            <StatCounter end={150} suffix="B+" label="AI Healthcare Market by 2030" enabled={statsVisible} />
            <StatCounter end={8} suffix="B+" label="Lives Impacted Globally" enabled={statsVisible} />
          </div>
        </div>
      </div>

      {/* Biological floating elements */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
        <svg className="absolute top-[8%] right-[12%] w-20 h-40 opacity-20 animate-float-slow" viewBox="0 0 40 100">
          <path d="M10,0 Q30,12 10,25 Q-10,38 10,50 Q30,62 10,75 Q-10,88 10,100" fill="none" stroke="hsl(var(--emerald-glow))" strokeWidth="1.5"/>
          <path d="M30,0 Q10,12 30,25 Q50,38 30,50 Q10,62 30,75 Q50,88 30,100" fill="none" stroke="hsl(var(--emerald-glow))" strokeWidth="1.5"/>
          {[0,12,25,38,50,62,75,88].map(y => <line key={y} x1="10" y1={y} x2="30" y2={y} stroke="hsl(var(--emerald-glow))" strokeWidth="0.8" opacity="0.5"/>)}
        </svg>

        <svg className="absolute top-[55%] left-[8%] w-16 h-20 opacity-25 animate-float-medium" viewBox="0 0 50 60">
          <line x1="10" y1="5" x2="25" y2="30" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"/>
          <line x1="40" y1="5" x2="25" y2="30" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"/>
          <line x1="25" y1="30" x2="25" y2="55" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"/>
          <text x="3" y="5" fill="hsl(var(--emerald-glow))" fontSize="6" fontFamily="sans-serif" opacity="0.6">X</text>
        </svg>

        <svg className="absolute bottom-[20%] right-[22%] w-12 h-16 opacity-20 animate-float-diagonal" viewBox="0 0 40 55">
          <line x1="8" y1="5" x2="20" y2="25" stroke="hsl(var(--emerald-glow))" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="32" y1="5" x2="20" y2="25" stroke="hsl(var(--emerald-glow))" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="20" y1="25" x2="20" y2="50" stroke="hsl(var(--emerald-glow))" strokeWidth="2.5" strokeLinecap="round"/>
          <text x="30" y="8" fill="hsl(var(--emerald-glow))" fontSize="6" fontFamily="sans-serif" opacity="0.5">Y</text>
        </svg>

        <svg className="absolute top-[30%] right-[5%] w-24 h-24 opacity-15 animate-float-reverse" viewBox="0 0 60 60">
          <ellipse cx="30" cy="30" rx="28" ry="25" fill="none" stroke="white" strokeWidth="1" />
          <ellipse cx="30" cy="30" rx="10" ry="9" fill="hsl(var(--emerald-glow))" opacity="0.3" />
          <ellipse cx="30" cy="30" rx="10" ry="9" fill="none" stroke="hsl(var(--emerald-glow))" strokeWidth="0.8" />
          <circle cx="32" cy="28" r="3" fill="hsl(var(--primary))" opacity="0.4" />
        </svg>

        <svg className="absolute top-[75%] left-[30%] w-14 h-14 opacity-15 animate-float-fast" viewBox="0 0 40 40">
          <ellipse cx="20" cy="20" rx="18" ry="12" fill="none" stroke="hsl(var(--emerald-glow))" strokeWidth="1.2"/>
          <ellipse cx="20" cy="20" rx="8" ry="5" fill="none" stroke="hsl(var(--emerald-glow))" strokeWidth="0.8" opacity="0.5"/>
        </svg>

        <svg className="absolute bottom-[35%] left-[45%] w-10 h-28 opacity-15 animate-float-slow-reverse" viewBox="0 0 30 80">
          <path d="M8,0 Q22,10 8,20 Q-6,30 8,40 Q22,50 8,60 Q-6,70 8,80" fill="none" stroke="white" strokeWidth="1"/>
          <path d="M22,0 Q8,10 22,20 Q36,30 22,40 Q8,50 22,60 Q36,70 22,80" fill="none" stroke="white" strokeWidth="1"/>
          {[0,10,20,30,40,50,60,70].map(y => <line key={y} x1="8" y1={y} x2="22" y2={y} stroke="white" strokeWidth="0.5" opacity="0.4"/>)}
        </svg>

        <svg className="absolute top-[18%] left-[25%] w-20 h-14 opacity-15 animate-float-medium-reverse" viewBox="0 0 70 40">
          <ellipse cx="22" cy="20" rx="18" ry="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="1"/>
          <ellipse cx="48" cy="20" rx="18" ry="16" fill="none" stroke="hsl(var(--primary))" strokeWidth="1"/>
          <ellipse cx="22" cy="20" rx="5" ry="5" fill="hsl(var(--emerald-glow))" opacity="0.25"/>
          <ellipse cx="48" cy="20" rx="5" ry="5" fill="hsl(var(--emerald-glow))" opacity="0.25"/>
        </svg>

        <svg className="absolute bottom-[10%] right-[40%] w-16 h-16 opacity-15 animate-float-fast-reverse" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="8" fill="hsl(var(--emerald-glow))" opacity="0.2" stroke="hsl(var(--emerald-glow))" strokeWidth="0.8"/>
          <line x1="25" y1="17" x2="25" y2="3" stroke="white" strokeWidth="0.8" opacity="0.4"/>
          <line x1="33" y1="25" x2="47" y2="25" stroke="white" strokeWidth="0.8" opacity="0.4"/>
          <line x1="17" y1="25" x2="3" y2="25" stroke="white" strokeWidth="0.8" opacity="0.4"/>
          <line x1="31" y1="19" x2="42" y2="8" stroke="white" strokeWidth="0.8" opacity="0.4"/>
          <line x1="19" y1="31" x2="8" y2="42" stroke="white" strokeWidth="0.8" opacity="0.4"/>
          <line x1="31" y1="31" x2="42" y2="42" stroke="white" strokeWidth="0.6" opacity="0.3"/>
          <line x1="19" y1="19" x2="8" y2="8" stroke="white" strokeWidth="0.6" opacity="0.3"/>
        </svg>

        <svg className="absolute top-[45%] left-[18%] w-10 h-10 opacity-20 animate-float-fast" viewBox="0 0 30 30">
          <circle cx="15" cy="8" r="4" fill="none" stroke="hsl(var(--emerald-glow))" strokeWidth="1"/>
          <circle cx="8" cy="22" r="4" fill="none" stroke="hsl(var(--emerald-glow))" strokeWidth="1"/>
          <circle cx="22" cy="22" r="4" fill="none" stroke="hsl(var(--emerald-glow))" strokeWidth="1"/>
          <line x1="15" y1="12" x2="8" y2="18" stroke="hsl(var(--emerald-glow))" strokeWidth="0.8"/>
          <line x1="15" y1="12" x2="22" y2="18" stroke="hsl(var(--emerald-glow))" strokeWidth="0.8"/>
        </svg>

        <svg className="absolute top-[65%] right-[8%] w-14 h-18 opacity-20 animate-float-slow" viewBox="0 0 40 50">
          <line x1="8" y1="5" x2="32" y2="45" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="32" y1="5" x2="8" y2="45" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="20" cy="25" r="3" fill="hsl(var(--emerald-glow))" opacity="0.3"/>
        </svg>
      </div>

      {/* Glow overlay */}
      <div className="absolute inset-0 opacity-5 z-[4] pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-glow blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary blur-[80px]" />
      </div>
    </section>
  );
}
