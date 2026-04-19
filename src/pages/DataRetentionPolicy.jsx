import { motion } from "framer-motion";
import { Database, Trash2, Shield, Calendar, FileText, Lock } from "lucide-react";

const POLICY_SECTIONS = [
  {
    icon: Database,
    title: "1. Data We Collect",
    content: "We collect and process the following categories of customer data:",
    subsections: [
      {
        heading: "Personal Information",
        text: "Name, email address, phone number, mailing address, and payment information collected during reservations, event bookings, gift card purchases, and loyalty program enrollment."
      },
      {
        heading: "Transaction Data",
        text: "Order history, payment records, invoice details, gift card transactions, and loyalty points activity."
      },
      {
        heading: "Communication Records",
        text: "Customer service inquiries, feedback submissions, review content, and marketing communication preferences."
      },
      {
        heading: "Technical Data",
        text: "IP addresses, browser information, device identifiers, and usage analytics collected through our website and mobile applications."
      }
    ]
  },
  {
    icon: Calendar,
    title: "2. Data Retention Periods",
    content: "We retain customer data only for as long as necessary to fulfill the purposes outlined below:",
    subsections: [
      {
        heading: "Active Customer Accounts",
        text: "Data is retained indefinitely while your account remains active. You may request deletion at any time."
      },
      {
        heading: "Transaction Records",
        text: "7 years from the date of transaction to comply with IRS tax regulations and financial reporting requirements."
      },
      {
        heading: "Reservation History",
        text: "3 years from the reservation date for customer service and quality assurance purposes."
      },
      {
        heading: "Marketing Communications",
        text: "2 years from last engagement or until you unsubscribe, whichever comes first."
      },
      {
        heading: "Website Analytics",
        text: "14 months for aggregated analytics. Individual session data is deleted after 30 days."
      },
      {
        heading: "Gift Card Records",
        text: "7 years from purchase date or until redemption, in compliance with unclaimed property laws."
      },
      {
        heading: "Loyalty Program Data",
        text: "Retained while membership is active plus 2 years after last points activity."
      },
      {
        heading: "Video Surveillance",
        text: "30 days for security footage, unless required for legal proceedings."
      }
    ]
  },
  {
    icon: Trash2,
    title: "3. Data Deletion Procedures",
    content: "We employ secure deletion methods to ensure customer data is permanently removed:",
    subsections: [
      {
        heading: "Automatic Deletion",
        text: "Data reaching the end of its retention period is automatically purged from our systems using secure deletion protocols that render data unrecoverable."
      },
      {
        heading: "Customer-Initiated Deletion",
        text: "Upon request, we will delete your personal data within 30 days, except where legal obligations require retention (e.g., transaction records for tax compliance)."
      },
      {
        heading: "Account Closure",
        text: "When you close your account, personal data is deleted within 60 days. Anonymized transaction records may be retained for analytics."
      },
      {
        heading: "Backup Systems",
        text: "Deleted data may persist in encrypted backup systems for up to 90 days before being overwritten through normal backup rotation."
      },
      {
        heading: "Third-Party Data",
        text: "We instruct service providers and data processors to delete your data from their systems within 45 days of our deletion request."
      }
    ]
  },
  {
    icon: Shield,
    title: "4. Legal Compliance Framework",
    content: "Our data practices comply with applicable federal and state regulations:",
    subsections: [
      {
        heading: "General Data Protection Regulation (GDPR)",
        text: "For EU residents: Right to access, rectify, erase, and port your data. Data processed under lawful bases including contract performance, legal obligation, and legitimate interests."
      },
      {
        heading: "California Consumer Privacy Act (CCPA/CPRA)",
        text: "For California residents: Right to know, delete, and opt-out of sale/sharing. We do not sell personal information."
      },
      {
        heading: "Payment Card Industry Data Security Standard (PCI DSS)",
        text: "Cardholder data is stored, processed, and transmitted in compliance with PCI DSS requirements. Full credit card numbers are never stored after transaction completion."
      },
      {
        heading: "Children's Online Privacy Protection Act (COPPA)",
        text: "We do not knowingly collect data from children under 13. Parental consent required for minors under 18."
      },
      {
        heading: "Health Insurance Portability and Accountability Act (HIPAA)",
        text: "Dietary and allergy information provided for accessibility purposes is protected but does not constitute protected health information under HIPAA."
      }
    ]
  },
  {
    icon: FileText,
    title: "5. Your Rights",
    content: "You have the following rights regarding your personal data:",
    subsections: [
      {
        heading: "Right to Access",
        text: "Request a copy of all personal data we hold about you, provided in a structured, commonly used format."
      },
      {
        heading: "Right to Rectification",
        text: "Correct inaccurate or incomplete personal data at any time through your account settings or by contacting us."
      },
      {
        heading: "Right to Erasure",
        text: "Request deletion of your personal data, subject to legal retention requirements for financial and tax records."
      },
      {
        heading: "Right to Restriction",
        text: "Limit processing of your data while accuracy disputes are resolved or legal obligations are assessed."
      },
      {
        heading: "Right to Data Portability",
        text: "Receive your data in a machine-readable format for transfer to another service provider."
      },
      {
        heading: "Right to Object",
        text: "Opt-out of marketing communications and certain types of automated processing."
      }
    ]
  },
  {
    icon: Lock,
    title: "6. Data Security Measures",
    content: "We implement technical and organizational safeguards to protect your data:",
    subsections: [
      {
        heading: "Encryption",
        text: "All data transmitted to our servers is encrypted using TLS 1.3. Sensitive data at rest is encrypted using AES-256."
      },
      {
        heading: "Access Controls",
        text: "Role-based access ensures only authorized personnel can access customer data. All access is logged and audited."
      },
      {
        heading: "Data Minimization",
        text: "We collect only data necessary for specified purposes. Anonymous or pseudonymous data is used where possible."
      },
      {
        heading: "Vendor Management",
        text: "Third-party processors are contractually obligated to maintain equivalent security standards and comply with this policy."
      },
      {
        heading: "Incident Response",
        text: "In the event of a data breach, affected individuals will be notified within 72 hours as required by applicable law."
      }
    ]
  },
  {
    icon: Database,
    title: "7. International Data Transfers",
    content: "For customers outside the United States:",
    subsections: [
      {
        heading: "Data Location",
        text: "All customer data is stored and processed on servers located within the United States."
      },
      {
        heading: "Transfer Safeguards",
        text: "International transfers use Standard Contractual Clauses (SCCs) and other approved mechanisms to ensure adequate protection."
      },
      {
        heading: "Jurisdiction",
        text: "By using our services, you consent to the transfer of your data to the United States and processing under U.S. law."
      }
    ]
  },
  {
    icon: FileText,
    title: "8. Policy Updates",
    content: "This policy may be updated to reflect changes in our practices or legal requirements:",
    subsections: [
      {
        heading: "Notification",
        text: "Material changes will be communicated via email or prominent website notice at least 30 days before implementation."
      },
      {
        heading: "Effective Date",
        text: "This policy is effective as of January 1, 2025. Previous versions are archived and available upon request."
      },
      {
        heading: "Continued Use",
        text: "Continued use of our services after policy changes constitutes acceptance of the updated terms."
      }
    ]
  }
];

function PolicySection({ section, index }) {
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-2xl p-8"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
            {section.title}
          </h2>
          <p className="font-body text-muted-foreground">{section.content}</p>
        </div>
      </div>

      <div className="space-y-6">
        {section.subsections.map((sub, subIndex) => (
          <div key={subIndex} className="pl-16">
            <h3 className="font-heading font-semibold text-foreground mb-2">
              {sub.heading}
            </h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              {sub.text}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function DataRetentionPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-foreground text-background py-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Data Deletion & Retention Policy
          </h1>
          <p className="font-body text-background/70 text-lg max-w-2xl mx-auto">
            Our commitment to responsible data management and your privacy rights.
          </p>
        </motion.div>
      </div>

      {/* Policy Content */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Quick Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-8"
        >
          <h2 className="font-heading text-xl font-bold text-foreground mb-4">
            Quick Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-body text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">Transaction Records:</strong> 7 years
            </div>
            <div>
              <strong className="text-foreground">Reservation History:</strong> 3 years
            </div>
            <div>
              <strong className="text-foreground">Marketing Data:</strong> 2 years
            </div>
            <div>
              <strong className="text-foreground">Analytics:</strong> 14 months
            </div>
            <div>
              <strong className="text-foreground">Deletion Requests:</strong> 30 days
            </div>
            <div>
              <strong className="text-foreground">Account Closure:</strong> 60 days
            </div>
          </div>
        </motion.div>

        {/* Full Policy */}
        {POLICY_SECTIONS.map((section, index) => (
          <PolicySection key={index} section={section} index={index} />
        ))}

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-8 text-center"
        >
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
            Questions or Requests?
          </h2>
          <p className="font-body text-muted-foreground mb-6">
            To exercise your data rights or ask questions about our practices, contact our Data Protection Officer:
          </p>
          <div className="space-y-2 font-body">
            <a
              href="mailto:privacy@jtapkitchen.com"
              className="text-primary hover:underline block"
            >
              privacy@jtapkitchen.com
            </a>
            <p className="text-muted-foreground">
              (901) 233-4060
            </p>
            <p className="text-muted-foreground">
              JTAP Kitchen<br />
              505 S Main St<br />
              Memphis, TN 38103
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}