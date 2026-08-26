import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Where is JTAP Kitchen located?",
    a: "We're located at 3397 Summer Ave., Memphis, TN 38122 — serving the Memphis, Germantown, Bartlett, and Cordova areas."
  },
  {
    q: "What are your hours?",
    a: "Wednesday–Thursday 5:30 PM–10:00 PM · Friday–Saturday 5:30 PM–11:00 PM · Sunday Dinner 5:00 PM–10:00 PM · Closed Monday–Tuesday."
  },
  {
    q: "How do I make a reservation?",
    a: "You can book a table directly on this website — click 'Reserve Your Table' or visit the Book a Table page. You can also call us at (901) 213-8085."
  },
  {
    q: "Do you host private events?",
    a: "Yes! Our Event Center offers Social Gathering, Elevated Experience, and Full Buyout packages — ideal for birthdays, corporate events, weddings, and celebrations. Visit our Event Center page to submit an inquiry."
  },
  {
    q: "Why book directly instead of a third-party app?",
    a: "Booking directly with us means no third-party fees, faster confirmation, personalized service, and loyalty points credited to your account. Call us or book online for the best experience."
  },
  {
    q: "Do you offer gift cards?",
    a: "Yes — digital JTAP Kitchen gift cards are available on our website and make a perfect gift for any occasion."
  },
  {
    q: "What kind of food do you serve?",
    a: "JTAP Kitchen serves bold American comfort food elevated with fine dining technique — think farm-fresh ingredients, seasonal menus, chef's tasting experiences, and curated wine pairings."
  },
  {
    q: "Do you have a loyalty program?",
    a: "Yes! Join the JTAP Room Society to earn points, unlock exclusive member perks, and get early access to events. Sign up on our website."
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="py-20 md:py-28 px-6 lg:px-10 bg-muted/40">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            Got Questions?
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-4 mb-4 leading-tight">
            Frequently Asked Questions
          </h2>
          <p className="font-body text-muted-foreground text-base max-w-lg mx-auto">
            Everything you need to know about dining at JTAP Kitchen in Memphis, TN.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="font-body text-sm font-semibold text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}