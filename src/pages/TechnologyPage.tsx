import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Database, Cloud, Shield, Cpu } from "lucide-react";
import techEncryption from "@/assets/tech-encryption.jpg";
import techCloud from "@/assets/tech-cloud.jpg";
import techStorage from "@/assets/tech-storage.jpg";
import techAi from "@/assets/tech-ai.jpg";

const techStack = [
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description: "All communications and data are protected with military-grade encryption, ensuring complete confidentiality across every interaction.",
    image: techEncryption,
  },
  {
    icon: Cloud,
    title: "Cloud Infrastructure",
    description: "Built on enterprise-grade cloud infrastructure with 99.99% uptime SLA and auto-scaling for seamless global performance.",
    image: techCloud,
  },
  {
    icon: Database,
    title: "Secure Data Storage",
    description: "Your data is stored in geographically distributed, redundant data centers with real-time backup and disaster recovery.",
    image: techStorage,
  },
  {
    icon: Cpu,
    title: "AI-Powered Matching",
    description: "Intelligent algorithms analyze expertise, research areas, and goals to connect you with the most relevant network members.",
    image: techAi,
  },
];

export default function TechnologyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
              <p className="text-primary font-body text-sm font-semibold tracking-[0.2em] uppercase mb-4 animate-fade-in">
                Infrastructure
              </p>
              <h1 className="font-display text-4xl lg:text-5xl font-medium text-foreground mb-6 animate-fade-in">
                Technology
              </h1>
              <p className="text-lg text-muted-foreground font-body animate-fade-in-delayed">
                Built with security, privacy, and performance at its core. Codonyx 
                uses cutting-edge technology to protect your professional connections.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {techStack.map((tech, index) => (
                <div
                  key={tech.title}
                  className="rounded-2xl border border-divider bg-surface-elevated animate-fade-in-up overflow-hidden group hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={tech.image}
                      alt={tech.title}
                      loading="lazy"
                      width={640}
                      height={512}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 rounded-lg bg-primary/90 flex items-center justify-center shadow-lg">
                      <tech.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-medium text-foreground mb-2">
                      {tech.title}
                    </h3>
                    <p className="text-muted-foreground font-body text-sm leading-relaxed">
                      {tech.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto mt-16 lg:mt-24 text-center">
              <h2 className="font-display text-2xl lg:text-3xl font-medium text-foreground mb-6">
                Compliance & Certifications
              </h2>
              <p className="text-muted-foreground font-body">
                Codonyx is compliant with GDPR, SOC 2 Type II, and ISO 27001 standards. 
                We take your privacy seriously and maintain the highest security standards.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
