import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useSeoMeta from "../hooks/useSeoMeta";
import { motion } from "framer-motion";
import { Sparkles, Wrench, Bug, Palette } from "lucide-react";

const CAT_META = {
  Feature: { icon: Sparkles, dot: "bg-purple-500", chip: "bg-purple-100 text-purple-700" },
  Improvement: { icon: Wrench, dot: "bg-blue-500", chip: "bg-blue-100 text-blue-700" },
  Fix: { icon: Bug, dot: "bg-red-500", chip: "bg-red-100 text-red-700" },
  Design: { icon: Palette, dot: "bg-amber-500", chip: "bg-amber-100 text-amber-700" },
};

function formatDate(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function WhatsNew() {
  useSeoMeta("events");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "What's New — JTAP Kitchen";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Recent updates and improvements to the JTAP Kitchen experience.");
  }, []);

  useEffect(() => {
    base44.entities.ChangelogEntry.list("-entry_date", 100)
      .then((data) => setEntries(data.filter((e) => e.is_published !== false)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="bg-foreground text-background py-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">Behind the Scenes</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mt-4 mb-4">What's New</h1>
          <p className="font-body text-background/60 text-base md:text-lg max-w-xl mx-auto">
            Ongoing improvements and new features we've added to make your JTAP Kitchen experience better.
          </p>
        </motion.div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-body text-muted-foreground">No updates posted yet. Check back soon!</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-8">
              {entries.map((entry, i) => {
                const meta = CAT_META[entry.category] || CAT_META.Improvement;
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="relative pl-8"
                  >
                    <span className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full ${meta.dot} ring-4 ring-background`} />
                    <div className="bg-card border border-border rounded-2xl p-5">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.chip}`}><Icon className="w-3 h-3" />{entry.category}</span>
                        <span className="font-body text-xs text-muted-foreground">{formatDate(entry.entry_date)}</span>
                        {entry.version && <span className="font-body text-xs font-medium text-primary">{entry.version}</span>}
                      </div>
                      <h3 className="font-heading text-lg font-semibold mb-1">{entry.title}</h3>
                      {entry.summary && <p className="font-body text-sm font-medium text-muted-foreground mb-2">{entry.summary}</p>}
                      {entry.details && <p className="font-body text-sm text-muted-foreground/80 whitespace-pre-wrap">{entry.details}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}