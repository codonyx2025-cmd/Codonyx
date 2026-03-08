import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import dnaHelixBg from "@/assets/dna-helix-bg.jpg";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organisation: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  const { ref: formRef, isVisible: formVisible } = useScrollAnimation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: formData,
      });

      if (error) {
        // Extract meaningful message from edge function error
        let errorMsg = "Something went wrong. Please try again or email us directly.";
        try {
          const bodyText = await (error as any)?.context?.json?.()
            ?? JSON.parse(await (error as any)?.context?.text?.());
          if (bodyText?.error) errorMsg = bodyText.error;
        } catch {}
        throw new Error(errorMsg);
      }

      setIsSubmitted(true);
      toast({
        title: "Message Sent",
        description: "Thank you for reaching out. We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", organisation: "", message: "" });
    } catch (err: any) {
      console.error("Contact form error:", err);
      toast({
        title: "Failed to send",
        description: "Something went wrong. Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className={`container mx-auto px-6 lg:px-8 relative z-10 py-20 lg:py-28 transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <div className="max-w-2xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm mb-6">
                <Mail className="w-8 h-8 text-emerald-glow" />
              </div>
              <h1 className="font-display text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Contact <span className="text-emerald-glow">Us</span>
              </h1>
              <p className="text-white/80 text-lg lg:text-xl font-body leading-relaxed">
                Have questions about Codonyx? We'd love to hear from you. Reach out and our team will get back to you promptly.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-16 lg:py-24">
          <div
            ref={formRef}
            className={`container mx-auto px-6 lg:px-8 transition-all duration-700 ${formVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <div className="max-w-2xl mx-auto">
              {/* Email info */}
              <div className="flex items-center gap-4 mb-10 p-5 bg-card border border-divider rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-base font-medium text-foreground">Email us directly</h3>
                  <p className="text-muted-foreground font-body text-sm">info@codonyx.org</p>
                </div>
              </div>

              {/* Form */}
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-16 bg-card border border-divider rounded-2xl">
                  <CheckCircle className="w-16 h-16 text-primary" />
                  <h3 className="font-display text-2xl font-medium text-foreground">Message Sent!</h3>
                  <p className="text-muted-foreground font-body">We'll get back to you as soon as possible.</p>
                  <Button variant="outline" onClick={() => setIsSubmitted(false)} className="mt-4">
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <div className="bg-card border border-divider rounded-2xl p-8 lg:p-10">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">Send us a message</h2>
                  <p className="text-muted-foreground font-body text-sm mb-8">Fill out the form below and we'll respond within 24 hours.</p>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Your email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organisation">Organisation</Label>
                      <Input
                        id="organisation"
                        placeholder="Your organisation (optional)"
                        value={formData.organisation}
                        onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="How can we help you?"
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" variant="primary" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                      ) : (
                        <><Send className="w-4 h-4" />Send Message</>
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
