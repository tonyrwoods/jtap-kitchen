// Scrolling announcement strip pinned above the home page hero.
// The track holds two identical halves so the -50% translate loops seamlessly.

const MESSAGE = ["Open for Veteran's Day Nov. 11, 2026", "Special Opening 10am – 10pm"];

export default function AnnouncementMarquee() {
  return (
    <div className="bg-primary text-primary-foreground overflow-hidden">
      <div className="flex w-max animate-marquee" aria-label={`${MESSAGE[0]} — ${MESSAGE[1]}`}>
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center" aria-hidden={half === 1}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="flex items-center gap-3 px-6 py-2.5 font-body text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] whitespace-nowrap"
              >
                <span>{MESSAGE[0]}</span>
                <span className="opacity-50">•</span>
                <span>{MESSAGE[1]}</span>
                <span className="opacity-50">•</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}