export default function AboutSection() {
  return (
    <section id="about" className="py-24 md:py-32 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl">
              <img
                src="https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/69593e5e6_generated_103ea6e4.png"
                alt="Luxurious restaurant interior with warm lighting"
                loading="lazy"
                decoding="async"
                className="w-full h-[400px] md:h-[550px] object-cover"
              />
            </div>
            {/* Floating Stats Card */}
            <div className="absolute -bottom-6 -right-4 md:right-8 bg-card shadow-2xl rounded-2xl px-8 py-6 border border-border">
              <div className="text-center">
                <span className="font-heading text-4xl font-bold text-primary">15+</span>
                <p className="font-body text-sm text-muted-foreground mt-1">Years of Excellence</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              Our Story
            </span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6 leading-tight">
              Great Food.
              <br />
              <span className="italic font-normal">Real Welcome.</span>
            </h2>
            <p className="font-body text-muted-foreground text-base leading-relaxed mb-6">
              JTAP Kitchen was born from a simple belief: that exceptional food and genuine
              hospitality belong together — no dress code required. Our chef brings a unique
              fusion of classical technique and bold, modern creativity to every plate, in an
              atmosphere where you can actually relax and enjoy it.
            </p>
            <p className="font-body text-muted-foreground text-base leading-relaxed mb-10">
              We source from local farms and artisanal producers, ensuring every ingredient
              tells a story. Every visit to JTAP Kitchen is a celebration of flavor, craft,
              and the joy of sharing an unforgettable meal — without the pretense.
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 border-t border-border pt-8">
              {[
                { number: "50K+", label: "Guests Served" },
                { number: "4.9", label: "Average Rating" },
                { number: "120+", label: "Wine Selections" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <span className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                    {stat.number}
                  </span>
                  <p className="font-body text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}