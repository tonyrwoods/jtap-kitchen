import { useState, useEffect } from "react";
import { HelpCircle, ChevronDown, Mail, Phone, MessageSquare, Database } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    category: "Reservations & Bookings",
    items: [
      {
        q: "How do I make a reservation?",
        a: "You can book a table through our website reservation system or call us at (901) 233-4060 during business hours. We accept reservations up to 30 days in advance."
      },
      {
        q: "Can I modify or cancel my reservation?",
        a: "Yes, you can modify or cancel up to 48 hours before your reservation. Please contact us directly at (901) 233-4060 or info@jtapkitchen.com."
      },
      {
        q: "Do you accommodate large parties?",
        a: "We can accommodate groups up to 20 people. For larger events, please contact us to discuss a private dining experience."
      },
      {
        q: "What is your cancellation policy?",
        a: "Cancellations made 48 hours or more before your reservation incur no penalty. Cancellations within 48 hours may be subject to a fee."
      }
    ]
  },
  {
    category: "Events & Special Experiences",
    items: [
      {
        q: "How do I book an event?",
        a: "Visit our Events page to browse upcoming experiences. Select your desired event and follow the booking process. Full payment is required at booking."
      },
      {
        q: "What if an event is sold out?",
        a: "You can join the waitlist for sold-out events. We'll notify you immediately if a spot becomes available."
      },
      {
        q: "Can I request a private chef's table?",
        a: "Absolutely! Contact us at (901) 233-4060 or info@jtapkitchen.com to inquire about private chef's table experiences."
      }
    ]
  },
  {
    category: "Gift Cards",
    items: [
      {
        q: "How long are gift cards valid?",
        a: "Gift cards are valid for 12 months from the date of purchase."
      },
      {
        q: "Can gift cards be transferred?",
        a: "Yes, gift cards can be transferred to another person. Simply provide them with your unique voucher code."
      },
      {
        q: "Is there a fee to purchase a gift card?",
        a: "No, there are no additional fees. The amount you pay is the full value of the gift card."
      },
      {
        q: "Can I check my gift card balance?",
        a: "Contact us with your voucher code and we'll provide your balance. Balances can also be checked at the restaurant."
      }
    ]
  },
  {
    category: "Loyalty Program",
    items: [
      {
        q: "How do I join the loyalty program?",
        a: "Sign up on our website or ask your server during your visit. Membership is free and instant."
      },
      {
        q: "How do I earn loyalty points?",
        a: "You earn 1 point for every dollar spent. Points can be redeemed for discounts and exclusive experiences."
      },
      {
        q: "What are the loyalty tiers?",
        a: "We have Bronze, Silver, Gold, and Platinum tiers. Higher tiers unlock exclusive benefits including priority reservations and special menu items."
      }
    ]
  },
  {
    category: "Dining Policies",
    items: [
      {
        q: "Do you have a dress code?",
        a: "We recommend smart casual attire. Jackets are suggested but not required."
      },
      {
        q: "Can I bring my own wine?",
        a: "Outside beverages are not permitted. We offer a curated wine selection to complement our menu."
      },
      {
        q: "Do you accommodate dietary restrictions?",
        a: "Yes! We accommodate vegetarian, vegan, gluten-free, and other dietary needs. Please inform us when booking."
      },
      {
        q: "What is your average dining time?",
        a: "Most dining experiences last 2-3 hours. Special events may have different durations listed in the event details."
      }
    ]
  }
];

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <motion.div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full py-4 px-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <span className="text-left font-body font-medium text-foreground">{item.q}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-4 font-body text-sm text-muted-foreground leading-relaxed">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Support() {
  useEffect(() => {
    document.title = "Support Center — JTAP Kitchen";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Find answers to common questions about reservations, events, gift cards, loyalty, and dining policies at JTAP Kitchen.");
  }, []);
  const [openFAQs, setOpenFAQs] = useState({});

  const toggleFAQ = (id) => {
    setOpenFAQs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-foreground text-background py-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-6">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Support Center</h1>
          <p className="font-body text-background/70 text-lg max-w-2xl mx-auto">
            Find answers to common questions or reach out to our team.
          </p>
        </motion.div>
      </div>

      {/* Quick Contact */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <a
            href="tel:+19012334060"
            className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <Phone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Call Us</h3>
                <p className="font-body text-sm text-muted-foreground">+1 (901) 233-4060</p>
                <p className="font-body text-xs text-muted-foreground mt-2">
                  Wed–Sat 5:30 PM – 11:00 PM CST
                </p>
              </div>
            </div>
          </a>

          <a
            href="mailto:info@jtapkitchen.com"
            className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Email</h3>
                <p className="font-body text-sm text-muted-foreground">info@jtapkitchen.com</p>
                <p className="font-body text-xs text-muted-foreground mt-2">
                  Response within 24 hours
                </p>
              </div>
            </div>
          </a>

          <a
            href="/contact"
            className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <MessageSquare className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Contact Form</h3>
                <p className="font-body text-sm text-muted-foreground">Send us a message</p>
                <p className="font-body text-xs text-muted-foreground mt-2">
                  Available anytime
                </p>
              </div>
            </div>
          </a>

          <a
            href="/data-retention-policy"
            className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <Database className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-1">Data Policy</h3>
                <p className="font-body text-sm text-muted-foreground">Deletion & retention</p>
                <p className="font-body text-xs text-muted-foreground mt-2">
                  Legal compliance
                </p>
              </div>
            </div>
          </a>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="font-heading text-3xl font-bold text-foreground mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {FAQS.map((category, catIndex) => (
              <motion.div
                key={catIndex}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIndex * 0.1 }}
              >
                <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                  {category.category}
                </h3>
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  {category.items.map((item, itemIndex) => (
                    <FAQItem
                      key={itemIndex}
                      item={item}
                      isOpen={openFAQs[`${catIndex}-${itemIndex}`] || false}
                      onToggle={() => toggleFAQ(`${catIndex}-${itemIndex}`)}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}