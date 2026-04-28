export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="font-body text-sm text-muted-foreground mb-10">Last updated: April 28, 2026</p>

        <div className="space-y-8 font-body text-sm text-foreground leading-relaxed">

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the JTAP Kitchen website and services ("Services"), you agree to be bound by these
              Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Services.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">2. Use of Services</h2>
            <p className="mb-3">You agree to use our Services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Use the Services in any way that violates applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to any part of the Services</li>
              <li>Transmit any harmful, offensive, or disruptive content</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
              <li>Use automated tools to scrape or extract data from the Services</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">3. Reservations & Bookings</h2>
            <p className="mb-3">When making a reservation through our Services:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Reservations are subject to availability and confirmation by JTAP Kitchen</li>
              <li>Please notify us at least 24 hours in advance if you need to cancel or modify your reservation</li>
              <li>Repeated no-shows may result in restrictions on future bookings</li>
              <li>Large party bookings (6+) may require a credit card hold or deposit</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">4. Gift Cards</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Gift cards are non-refundable and cannot be exchanged for cash</li>
              <li>Lost or stolen gift cards cannot be replaced without proof of purchase</li>
              <li>Gift cards are valid for use at JTAP Kitchen only</li>
              <li>JTAP Kitchen is not responsible for unauthorized use of gift card codes</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">5. Loyalty Program</h2>
            <p className="mb-3">Participation in our loyalty program is subject to the following:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Points have no cash value and cannot be transferred</li>
              <li>We reserve the right to modify or terminate the loyalty program at any time with reasonable notice</li>
              <li>Abuse of the loyalty program may result in account suspension</li>
              <li>Points expire after 12 months of account inactivity</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">6. Intellectual Property</h2>
            <p>
              All content on the JTAP Kitchen website — including text, images, logos, graphics, and menus — is the
              property of JTAP Kitchen and is protected by applicable intellectual property laws. You may not reproduce,
              distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">7. User-Submitted Content</h2>
            <p>
              By submitting reviews, photos, or other content through our Services, you grant JTAP Kitchen a
              non-exclusive, royalty-free license to use, display, and promote that content. You represent that you
              have the rights to submit such content and that it does not infringe any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">8. Disclaimer of Warranties</h2>
            <p>
              Our Services are provided "as is" without warranties of any kind, express or implied. We do not warrant
              that the Services will be uninterrupted, error-free, or free of viruses or other harmful components.
              Menu items, pricing, and availability are subject to change without notice.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, JTAP Kitchen shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of or inability to use our Services,
              even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless JTAP Kitchen and its employees, officers, and agents from any
              claims, damages, or expenses (including reasonable attorney's fees) arising from your use of the Services
              or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Tennessee,
              without regard to its conflict of law provisions. Any disputes shall be resolved in the courts located
              in Shelby County, Tennessee.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">12. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. Changes will be posted on this page with an
              updated date. Your continued use of the Services after any changes constitutes acceptance of the
              revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">13. Contact Us</h2>
            <p className="mb-2">If you have any questions about these Terms, please contact us:</p>
            <div className="bg-card border border-border rounded-xl p-4 space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground">JTAP Kitchen</p>
              <p>Email: <a href="mailto:info@jtapkitchen.com" className="text-primary hover:underline">info@jtapkitchen.com</a></p>
              <p>Website: <a href="/contact" className="text-primary hover:underline">Contact Us</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}