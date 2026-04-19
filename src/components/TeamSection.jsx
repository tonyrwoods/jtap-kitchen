import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown } from "lucide-react";

function TeamCard({ member }) {
  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden">
      {member.photo_url && (
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={member.photo_url}
            alt={member.name}
            className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <h3 className="font-heading text-xl font-bold text-white">{member.name}</h3>
            <p className="font-body text-sm text-white/70">{member.role}</p>
          </div>
        </div>
      )}
      <div className="p-6">
        {!member.photo_url && (
          <>
            <h3 className="font-heading text-lg font-bold text-foreground">{member.name}</h3>
            <p className="font-body text-sm text-primary font-medium mb-3">{member.role}</p>
          </>
        )}
        {member.bio && (
          <p className="font-body text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
        )}
      </div>
    </div>
  );
}

export default function TeamSection() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.TeamMember.filter({ is_active: true }, "sort_order", 100)
      .then(data => { setMembers(data); setLoading(false); });
  }, []);

  return (
    <section id="team" className="py-24 md:py-32 px-6 lg:px-10 bg-secondary/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
            The People Behind the Plate
          </span>
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-4 mb-5">
            Meet Our Team
          </h2>
          <p className="font-body text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            World-class talent united by a shared obsession: crafting moments that stay with you long after the last bite.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
            {members.map((member) => (
              <TeamCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}