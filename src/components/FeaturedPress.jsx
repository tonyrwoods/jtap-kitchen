import { Newspaper, ArrowRight } from "lucide-react";

const ARTICLE_URL =
  "https://whatnow.com/memphis/restaurants/new-restaurateur-came-out-of-retirement-for-next-chapter/";

export default function FeaturedPress() {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <div className="bg-secondary/50 border border-border rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr]">
            {/* Image */}
            <div className="relative min-h-[260px] md:min-h-[340px] bg-foreground">
              <img
                src="https://whatnow.com/wp-content/uploads/2026/08/New-Restauranteur-Came-Out-of-Retirement-for-Next-Chapter-.jpg"
                alt="JTAP Kitchen featured in WhatNow Memphis"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
              <div className="absolute bottom-5 left-5 flex items-center gap-2 text-background">
                <Newspaper className="w-5 h-5" />
                <span className="font-body text-sm font-semibold tracking-wide">WhatNow Memphis</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
                As Featured In
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mt-4 mb-4 leading-tight">
                New Restaurateur Came Out of Retirement for Next Chapter
              </h2>
              <p className="font-body text-muted-foreground text-base leading-relaxed mb-8">
                After more than four decades in technology, Anthony Woods opened JTAP Kitchen on
                Summer Ave. — a high-end casual dining destination born from a passion project and
                a commitment to the Memphis community.
              </p>
              <a
                href={ARTICLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 transition-opacity w-fit"
              >
                Read the Full Story
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}