import { Link, useLocation } from "react-router-dom";
import { Linkedin, Mail } from "lucide-react";
import codonyxLogo from "@/assets/codonyx_logo.png";

const footerLinks = {
  solutions: [
    { name: "Services", href: "/services" },
    { name: "Technology", href: "/technology" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ],
  compliance: [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms & Conditions", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-navy border-t border-white/10">
      <div className="container mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <img src={codonyxLogo} alt="Codonyx" className="h-10 w-10 object-contain" />
              <span className="font-heading text-2xl font-semibold text-white tracking-tight">
                Codonyx
              </span>
            </Link>
            <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-sm font-body">
              A global molecular science and AI healthcare company connecting elite advisors and pioneering laboratories to shape the future.
            </p>
            <div className="flex gap-3 mt-6">
              <span
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 cursor-default"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </span>
              <a
                href="mailto:info@codonyx.org"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Email us"
              >
                <Mail size={18} />
              </a>
            </div>
            <p className="mt-3 text-xs text-white/40 font-body">
              <a href="mailto:info@codonyx.org" className="hover:text-emerald-glow transition-colors">info@codonyx.org</a>
            </p>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-white/40 mb-4">
              Solutions
            </h4>
            <ul className="space-y-3">
              {footerLinks.solutions.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-white/60 hover:text-emerald-glow transition-colors font-body">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-white/40 mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-white/60 hover:text-emerald-glow transition-colors font-body">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-white/40 mb-4">
              Compliance
            </h4>
            <ul className="space-y-3">
              {footerLinks.compliance.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-sm text-white/60 hover:text-emerald-glow transition-colors font-body">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40 font-body">
            © {new Date().getFullYear()} Codonyx. All rights reserved.
          </p>
          <p className="text-xs text-white/30 font-body">
            Molecular Science · AI Healthcare · Global Impact
          </p>
        </div>
      </div>
    </footer>
  );
}
