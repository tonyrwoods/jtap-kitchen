import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import useSeoMeta from "../hooks/useSeoMeta";
import { motion } from "framer-motion";
import { Shield, Lock, Database, Users, FileText, AlertTriangle, CheckCircle, Server } from "lucide-react";

const POLICY_SECTIONS = [
  {
    icon: Shield,
    title: "1. Introduction & Scope",
    content: `This Information Security Policy establishes the framework for protecting JTAP Kitchen's information assets, customer data, and operational systems. This policy applies to all employees, contractors, vendors, and third parties who access JTAP Kitchen's information systems or data.

Our commitment extends to protecting personally identifiable information (PII), payment card data, reservation details, and all confidential business information.`
  },
  {
    icon: Lock,
    title: "2. Data Classification & Protection",
    content: `Data Categories:
• Public: Marketing materials, menu information, public announcements
• Internal: Staff schedules, operational procedures, vendor contracts
• Confidential: Customer PII, payment data, employee records, financial information
• Restricted: Authentication credentials, encryption keys, security configurations

Protection Requirements:
• All confidential and restricted data must be encrypted in transit (TLS 1.2+) and at rest
• Access controls must be implemented based on least-privilege principles
• Regular backups must be performed with tested recovery procedures`
  },
  {
    icon: Database,
    title: "3. Payment Card Security (PCI DSS)",
    content: `JTAP Kitchen maintains PCI DSS compliance for all payment processing activities:

• Cardholder data is never stored on our servers
• All payment transactions use tokenization via PCI-compliant processors (Stripe, Wix Payments)
• Payment pages are served over encrypted HTTPS connections
• Regular vulnerability scans and security assessments are conducted
• Staff handling payment data complete annual PCI awareness training`
  },
  {
    icon: Users,
    title: "4. Access Control & Authentication",
    content: `Access Management:
• Unique user accounts required for all system access
• Multi-factor authentication (MFA) enforced for admin and financial systems
• Password requirements: minimum 12 characters, complexity rules, 90-day rotation
• Immediate access revocation upon employee termination
• Quarterly access reviews conducted by department managers

Role-Based Access:
• Admin users: Full system access with audit logging
• Staff users: Limited to operational functions (shifts, orders, reservations)
• Third-party vendors: Time-limited, scope-restricted access only`
  },
  {
    icon: Server,
    title: "5. Infrastructure & Network Security",
    content: `Technical Safeguards:
• Firewalls and intrusion detection systems protect all network perimeters
• Regular security patches applied within 30 days of release
• Wi-Fi networks segmented (guest, POS, administrative)
• All devices must have endpoint protection installed
• Automatic screen locking after 5 minutes of inactivity

Cloud Services:
• Only approved cloud providers with SOC 2 certification
• Data residency requirements enforced for customer PII
• Regular security assessments of third-party providers`
  },
  {
    icon: FileText,
    title: "6. Data Privacy & Customer Rights",
    content: `Privacy Commitments:
• Customer data collected only for legitimate business purposes
• Transparent privacy notices provided at point of collection
• Customers may request access, correction, or deletion of their data
• Data retention schedules enforced (reservations: 2 years, payments: 7 years)
• No sale of customer personal information to third parties

Marketing Communications:
• Explicit opt-in consent required for email/SMS marketing
• Easy unsubscribe mechanisms in all communications
• Preference centers available for communication management`
  },
  {
    icon: AlertTriangle,
    title: "7. Incident Response & Breach Notification",
    content: `Response Procedures:
1. Detection: Monitor systems for security anomalies
2. Containment: Isolate affected systems within 1 hour
3. Assessment: Determine scope and impact within 4 hours
4. Notification: Inform affected customers within 72 hours if required
5. Recovery: Restore systems from clean backups
6. Review: Conduct post-incident analysis within 5 business days

Reporting:
• All security incidents reported to security@jtapkitchen.com
• Annual incident response testing and tabletop exercises
• Law enforcement notified for criminal activity`
  },
  {
    icon: CheckCircle,
    title: "8. Employee Responsibilities & Training",
    content: `All employees must:
• Complete security awareness training upon hire and annually
• Report suspicious emails, phone calls, or system behavior immediately
• Lock workstations when away from desks
• Use only approved devices and software for work purposes
• Sign confidentiality agreements acknowledging security obligations

Prohibited Activities:
• Sharing passwords or access credentials
• Installing unauthorized software
• Accessing customer data without business need
• Using personal email for customer communications
• Bypassing security controls or policies`
  },
  {
    icon: Shield,
    title: "9. Vendor & Third-Party Management",
    content: `Vendor Security Requirements:
• Security assessments before onboarding high-risk vendors
• Contracts must include data protection and breach notification clauses
• Annual review of critical service providers' security posture
• Immediate notification required for vendor data breaches

Approved Technology Partners:
• Payment Processors: Stripe, Wix Payments (PCI DSS Level 1)
• Cloud Infrastructure: Base44, Wix (SOC 2 Type II certified)
• Email Services: Gmail/Google Workspace (enterprise security)
• POS System: [Vendor Name] - security documentation on file`
  },
  {
    icon: FileText,
    title: "10. Compliance & Policy Enforcement",
    content: `Regulatory Compliance:
• PCI DSS for payment card processing
• CCPA/CPRA for California consumer privacy
• State data breach notification laws
• FTC safeguards for customer information

Policy Enforcement:
• Violations may result in disciplinary action up to termination
• Annual policy review and updates by security team
• Exceptions require written approval from management
• This policy reviewed annually or after significant incidents

Contact: security@jtapkitchen.com for questions or concerns`
  }
];

function SectionCard({ section, index }) {
  const Icon = section.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="bg-card border border-border rounded-2xl p-6 md:p-8"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
          {section.title}
        </h2>
      </div>
      <div className="space-y-4">
        {section.content.split('\n\n').map((paragraph, idx) => (
          <p key={idx} className="font-body text-sm md:text-base text-muted-foreground leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </motion.div>
  );
}

export default function InformationSecurityPolicy() {
  useSeoMeta("security-policy");
  const [lastUpdated, setLastUpdated] = useState("January 2026");

  useEffect(() => {
    // Could fetch from SeoSettings entity if needed
  }, []);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Hero */}
      <div className="bg-foreground text-background py-16 md:py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Trust & Transparency
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mt-4 mb-5">
            Information Security Policy
          </h1>
          <p className="font-body text-background/60 text-lg max-w-2xl mx-auto">
            Our comprehensive commitment to protecting your data, privacy, and trust
          </p>
          <p className="font-body text-sm text-background/40 mt-4">
            Last Updated: {lastUpdated}
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-14 space-y-8">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8"
        >
          <p className="font-body text-base md:text-lg text-foreground leading-relaxed">
            At JTAP Kitchen, we recognize that protecting your information is fundamental to maintaining your trust. 
            This policy outlines our comprehensive approach to information security, covering data protection, 
            access controls, incident response, and regulatory compliance. We are committed to maintaining the 
            highest standards of security across all our operations.
          </p>
        </motion.div>

        {/* Sections */}
        {POLICY_SECTIONS.map((section, index) => (
          <SectionCard key={index} section={section} index={index} />
        ))}

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-6 md:p-8"
        >
          <h3 className="font-heading text-lg font-semibold mb-4">Related Policies</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Privacy Policy", href: "/support" },
              { label: "Terms of Service", href: "/support" },
              { label: "Cookie Policy", href: "/support" },
              { label: "Contact Security Team", href: "mailto:security@jtapkitchen.com" },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-2 font-body text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                {link.label}
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}