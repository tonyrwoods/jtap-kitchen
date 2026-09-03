import { CalendarCheck } from "lucide-react";

// Reservation call-to-action section on the home page. Kept current (no
// "grand opening" countdown copy) and free of the old unused slot-availability
// fetching logic.
export default function AvailabilityChecker({ onBook }) {
  return (
    <section id="reserve" className="bg-card border-y border-border py-14 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-body font-medium mb-4">
          <CalendarCheck className="w-4 h-4" />
          Reservations Open
        </div>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
          Reserve Your Table at JTAP Kitchen
        </h2>
        <p className="font-body text-muted-foreground mt-3 max-w-xl mx-auto">
          Open Wednesday–Saturday evenings. Book direct for the best availability and
          a complimentary welcome bite for society members.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <a
            href="/book"
            className="px-8 py-3.5 bg-primary text-primary-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20"
          >
            Reserve a Table
          </a>
          <a
            href="/event-center"
            className="px-8 py-3.5 border-2 border-border text-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:bg-secondary transition-all duration-300"
          >
            Private Events
          </a>
        </div>
      </div>
    </section>
  );
}