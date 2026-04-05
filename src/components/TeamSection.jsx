import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Award } from "lucide-react";

const TEAM = [
  {
    name: "Chef Laurent Moreau",
    role: "Head Chef & Founder",
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/b7b51063a_generated_image.png",
    bio: "Laurent's love affair with food began in his grandmother's kitchen in Lyon. With over 20 years of experience across Michelin-starred restaurants in Paris, Tokyo, and New York, he founded JTAP Kitchen to bring his unique Franco-Japanese culinary philosophy to a new generation of diners.",
    specialty: "French-Japanese Fusion",
    timeline: [
      { year: "2001", place: "Lyon, France", event: "Graduated top of class at Institut Paul Bocuse" },
      { year: "2004", place: "Paris, France", event: "Sous Chef at Le Cinq — earned first Michelin star" },
      { year: "2009", place: "Tokyo, Japan", event: "Stage at Narisawa, mastering Japanese technique" },
      { year: "2014", place: "New York, USA", event: "Executive Chef at Maison — two Michelin stars" },
      { year: "2020", place: "New York, USA", event: "Founded JTAP Kitchen" },
    ],
  },
  {
    name: "Sophie Callahan",
    role: "Pastry Chef",
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/c6b318a5d_generated_image.png",
    bio: "Sophie transforms desserts into emotional experiences. Trained at Le Cordon Bleu London and refined under legendary pâtissier Pierre Hermé in Paris, she brings a delicate artistry to every sweet course at JTAP Kitchen.",
    specialty: "Artisan Pâtisserie",
    timeline: [
      { year: "2010", place: "London, UK", event: "Trained at Le Cordon Bleu London" },
      { year: "2012", place: "Paris, France", event: "Apprentice under Pierre Hermé" },
      { year: "2015", place: "Copenhagen, Denmark", event: "Pastry chef at Noma popup series" },
      { year: "2021", place: "New York, USA", event: "Joined JTAP Kitchen as Head Pastry Chef" },
    ],
  },
  {
    name: "Marco Delacroix",
    role: "Head Sommelier",
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/6527b4693_generated_image.png",
    bio: "With a palate honed across the vineyards of Burgundy and Tuscany, Marco's curated wine list is a journey of its own. A Court of Master Sommeliers alumnus, he believes the right wine transforms a meal into a memory.",
    specialty: "Old World Wines & Natural Pairings",
    timeline: [
      { year: "2008", place: "Burgundy, France", event: "First harvest season at Domaine de la Romanée-Conti" },
      { year: "2011", place: "Tuscany, Italy", event: "Wine education at the Tuscan Wine School" },
      { year: "2014", place: "London, UK", event: "Achieved Court of Master Sommeliers certification" },
      { year: "2019", place: "New York, USA", event: "Head Sommelier at acclaimed Eleven Madison Park" },
      { year: "2022", place: "New York, USA", event: "Joined JTAP Kitchen" },
    ],
  },
  {
    name: "Aiko Tanaka",
    role: "Sous Chef",
    image: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/b0dee6413_generated_image.png",
    bio: "Aiko is the heartbeat of our kitchen line. Raised in Osaka and trained in New York, she bridges the gap between precision and creativity, ensuring every dish that leaves the pass reflects Laurent's vision — and her own fierce passion.",
    specialty: "Japanese Technique & Seasonal Produce",
    timeline: [
      { year: "2013", place: "Osaka, Japan", event: "Culinary degree from Tsuji Culinary Institute" },
      { year: "2016", place: "New York, USA", event: "Line cook at Masa — three Michelin stars" },
      { year: "2019", place: "New York, USA", event: "Promoted to Sous Chef at The Modern" },
      { year: "2023", place: "New York, USA", event: "Joined JTAP Kitchen as Sous Chef" },
    ],
  },
];

function TimelineItem({ item, index, isLast }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="flex gap-4 relative"
    >
      {/* Line */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary mt-0.5 shrink-0 ring-4 ring-primary/20" />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className="pb-5">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-heading text-sm font-semibold text-primary">{item.year}</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="font-body text-xs">{item.place}</span>
          </div>
        </div>
        <p className="font-body text-sm text-foreground leading-relaxed">{item.event}</p>
      </div>
    </motion.div>
  );
}

function TeamCard({ member, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      className="bg-card border border-border rounded-3xl overflow-hidden"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={member.image}
          alt={member.name}
          className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Award className="w-3.5 h-3.5 text-primary" />
            <span className="font-body text-xs text-primary font-semibold uppercase tracking-wider">
              {member.specialty}
            </span>
          </div>
          <h3 className="font-heading text-xl font-bold text-white">{member.name}</h3>
          <p className="font-body text-sm text-white/70">{member.role}</p>
        </div>
      </div>

      {/* Bio */}
      <div className="p-6">
        <p className="font-body text-sm text-muted-foreground leading-relaxed">{member.bio}</p>

        {/* Expand Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 mt-5 font-body text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
        >
          {expanded ? "Hide journey" : "View culinary journey"}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        {/* Timeline */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-5 overflow-hidden"
            >
              <div className="border-t border-border pt-5">
                <p className="font-body text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-4">
                  Culinary Journey
                </p>
                {member.timeline.map((item, i) => (
                  <TimelineItem
                    key={item.year}
                    item={item}
                    index={i}
                    isLast={i === member.timeline.length - 1}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function TeamSection() {
  return (
    <section id="team" className="py-24 md:py-32 px-6 lg:px-10 bg-secondary/40">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            The People Behind the Plate
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 mb-5">
            Meet Our Team
          </h2>
          <p className="font-body text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            World-class talent united by a shared obsession: crafting moments that
            stay with you long after the last bite.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-7">
          {TEAM.map((member, i) => (
            <TeamCard key={member.name} member={member} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}