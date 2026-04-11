import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-4xl lg:text-5xl font-medium text-foreground mb-8">
              Terms & Conditions
            </h1>
            
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="text-lg leading-relaxed mb-8">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="mb-4">
                  By accessing and using the Codonyx platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this Service.
                </p>
                <p>
                  These Terms & Conditions apply to all users of the platform, including advisors, laboratories, and any other visitors.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  2. Eligibility
                </h2>
                <p className="mb-4">
                  The Codonyx platform is an invite-only network. Access is granted solely through valid invitation tokens provided by Codonyx or authorized administrators.
                </p>
                <p>
                  You must be at least 18 years of age and have the legal capacity to enter into binding contracts to use this Service.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  3. User Accounts
                </h2>
                <p className="mb-4">
                  When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of these Terms.
                </p>
                <p className="mb-4">
                  You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                </p>
                <p>
                  All accounts are subject to approval by Codonyx administrators. We reserve the right to refuse or revoke access at our discretion.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  4. Acceptable Use
                </h2>
                <p className="mb-4">
                  You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Use the Service in any way that violates any applicable law or regulation</li>
                  <li>Impersonate or attempt to impersonate another user or person</li>
                  <li>Engage in any conduct that restricts or inhibits anyone's use of the Service</li>
                  <li>Attempt to gain unauthorized access to any portion of the Service</li>
                  <li>Use the Service to transmit spam, unsolicited communications, or malware</li>
                  <li>Share or distribute confidential information obtained through the platform without authorization</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  5. Intellectual Property
                </h2>
                <p className="mb-4">
                  The Service and its original content, features, and functionality are owned by Codonyx and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
                <p>
                  You retain ownership of any content you submit to the platform, but grant Codonyx a license to use, display, and distribute such content in connection with the Service.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  6. Confidentiality
                </h2>
                <p className="mb-4">
                  The Codonyx platform is designed to facilitate confidential professional connections. Users agree to maintain the confidentiality of any proprietary or sensitive information shared through the platform.
                </p>
                <p>
                  Any business discussions, research information, or partnership details shared between users remain confidential unless explicitly agreed otherwise by all parties involved.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  7. Disclaimers
                </h2>
                <p className="mb-4">
                  The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Codonyx makes no warranties, expressed or implied, regarding the reliability, accuracy, or availability of the Service.
                </p>
                <p>
                  Codonyx does not verify the credentials, qualifications, or representations made by users on the platform. Users are responsible for conducting their own due diligence before entering into any professional relationships.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  8. Limitation of Liability
                </h2>
                <p>
                  In no event shall Codonyx, its directors, employees, partners, agents, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses, resulting from your use of the Service.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  9. Termination
                </h2>
                <p className="mb-4">
                  We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                </p>
                <p>
                  Upon termination, your right to use the Service will cease immediately.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  10. Changes to Terms
                </h2>
                <p>
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="font-display text-2xl font-medium text-foreground mb-4">
                  11. Contact Us
                </h2>
                <p>
                  If you have any questions about these Terms, please contact us at{" "}
                  <a href="mailto:info@codonyx.org" className="text-primary hover:underline">
                    info@codonyx.org
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
