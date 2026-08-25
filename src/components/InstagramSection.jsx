import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Instagram, ExternalLink, ImageIcon } from "lucide-react";

export default function InstagramSection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.InstagramPost.filter({ is_active: true }, "sort_order", 6)
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="instagram" className="py-24 md:py-32 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="font-body text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              Follow Along
            </span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-4 mb-3 leading-tight">
              @jtap.kitchen
            </h2>
            <p className="font-body text-muted-foreground text-base max-w-lg leading-relaxed">
              Follow us on Instagram for behind-the-scenes moments, seasonal
              specials, and daily culinary inspiration.
            </p>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 border-2 border-foreground text-foreground font-body text-sm font-semibold uppercase tracking-widest rounded-full hover:bg-foreground hover:text-background transition-all duration-300 shrink-0"
          >
            <Instagram className="w-4 h-4" />
            Follow Us
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-body text-muted-foreground">No posts yet — check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-card border border-border rounded-2xl overflow-hidden group">
                {/* Post Header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 via-primary to-orange-500 flex items-center justify-center shrink-0">
                    <span className="font-heading text-xs font-bold text-white">JK</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-foreground leading-none">jtap.kitchen</p>
                  </div>
                  <Instagram className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Image */}
                <div className="relative overflow-hidden aspect-square">
                  {post.permalink ? (
                    <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                      <img
                        src={post.image_url}
                        alt={post.caption || "JTAP Kitchen post"}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </a>
                  ) : (
                    <img
                      src={post.image_url}
                      alt={post.caption || "JTAP Kitchen post"}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                </div>

                {/* Caption */}
                {post.caption && (
                  <div className="px-4 py-4">
                    <p className="font-body text-sm text-foreground leading-relaxed">
                      <span className="font-semibold mr-1">jtap.kitchen</span>
                      {post.caption}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <p className="text-center font-body text-sm text-muted-foreground mt-10">
          Tag us in your photos with <span className="text-primary font-semibold">#JTAPKitchen</span> for a chance to be featured.
        </p>
      </div>
    </section>
  );
}