import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DoorOpen, Crown, ArrowRight } from "lucide-react";

// Promotes the complimentary private room rental perk for Tap Room Society
// members. Distinct from EventCenterTeaser (public events) — this cross-sells
// membership and links to the member private room booking page.
export default function PrivateRoomTeaser() {
  return (
    <section className="py-16 md:py-20 px-6 lg:px-10 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid md:grid-cols-2 gap-8 items-center"
        >
          {/* Image */}
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3] order-2 md:order-1">
            <img
              src="https://images.unsplash.com/photo-1559339352-11d035aa48de?w=800&auto=format&fit=crop"
              alt="Private dining room at JTAP Kitchen"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="order-1 md:order-2">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-4 h-4 text-primary" />
              <span className="font-body text-xs uppercase tracking-[0.25em] text-primary font-semibold">Member Perk</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              Your Own Private Room,<br />On Us.
            </h2>
            <p className="font-body text-muted-foreground text-base leading-relaxed mb-6">
              Tap Room Society members enjoy complimentary private room rentals for birthdays, anniversaries, business dinners, and celebrations. Intimate seating, dedicated service, and zero rental fees — just a food & beverage minimum.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/book-private-room"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-body text-sm font-semibold rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <DoorOpen className="w-4 h-4" />
                Book a Private Room
              </Link>
              <Link
                to="/tap-room-society"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-border text-foreground font-body text-sm font-semibold rounded-full hover:bg-secondary transition-colors"
              >
                Explore Membership <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}