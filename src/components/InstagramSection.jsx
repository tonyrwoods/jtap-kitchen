import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Instagram, ExternalLink } from "lucide-react";

const POSTS = [
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/b3d20a817_generated_image.png",
    caption: "An evening of warmth, candlelight and unforgettable flavours. ✨ Reserve your table through the link in bio.",
    likes: 1284,
    comments: 47,
    time: "2h ago",
    tag: "#jtapkitchen",
  },
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/92d549431_generated_image.png",
    caption: "Every plate is a canvas. Our chefs obsess over every detail — because you deserve perfection. 🍽️",
    likes: 2103,
    comments: 88,
    time: "1d ago",
    tag: "#finedining",
  },
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/89cfdcc60_generated_image.png",
    caption: "Herb-crusted lamb with rosemary jus — tonight's feature. Come taste it before it's gone. 🌿",
    likes: 3541,
    comments: 134,
    time: "2d ago",
    tag: "#chefspecial",
  },
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/0b4858b0e_generated_image.png",
    caption: "There's something meditative about making fresh pasta by hand. From our kitchen to your table. 🍝",
    likes: 1876,
    comments: 62,
    time: "3d ago",
    tag: "#handmade",
  },
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/574683d15_generated_image.png",
    caption: "120+ wines curated to pair perfectly with every dish on our menu. Ask your sommelier tonight. 🍷",
    likes: 987,
    comments: 33,
    time: "4d ago",
    tag: "#wine",
  },
  {
    url: "https://media.base44.com/images/public/69d2426201cd12d6d2a6db95/8dab81640_generated_image.png",
    caption: "Our private dining room — perfect for birthdays, anniversaries, and unforgettable corporate events. 🕯️",
    likes: 1453,
    comments: 51,
    time: "5d ago",
    tag: "#privatedining",
  },
];

function formatNumber(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : n;
}

function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden group">
      {/* Post Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 via-primary to-orange-500 flex items-center justify-center shrink-0">
          <span className="font-heading text-xs font-bold text-white">JK</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-foreground leading-none">jtap.kitchen</p>
          <p className="font-body text-xs text-muted-foreground mt-0.5">{post.time}</p>
        </div>
        <Instagram className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Image */}
      <div className="relative overflow-hidden aspect-square">
        <img
          src={post.url}
          alt={post.caption}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-3">
        <button onClick={() => setLiked(!liked)} className="flex items-center gap-1.5 group/like">
          <Heart className={`w-5 h-5 transition-all duration-200 ${liked ? "fill-red-500 text-red-500 scale-110" : "text-foreground group-hover/like:text-red-400"}`} />
        </button>
        <MessageCircle className="w-5 h-5 text-foreground hover:text-primary cursor-pointer transition-colors" />
        <div className="flex-1" />
        <button onClick={() => setSaved(!saved)}>
          <Bookmark className={`w-5 h-5 transition-colors duration-200 ${saved ? "fill-foreground text-foreground" : "text-foreground hover:text-primary"}`} />
        </button>
      </div>

      {/* Likes */}
      <div className="px-4 pb-2">
        <p className="font-body text-sm font-semibold text-foreground">
          {formatNumber(post.likes + (liked ? 1 : 0))} likes
        </p>
      </div>

      {/* Caption */}
      <div className="px-4 pb-4">
        <p className="font-body text-sm text-foreground leading-relaxed line-clamp-2">
          <span className="font-semibold mr-1">jtap.kitchen</span>
          {post.caption}
        </p>
        <p className="font-body text-xs text-primary mt-1">{post.tag} #jtapkitchen #restaurant</p>
        <p className="font-body text-xs text-muted-foreground mt-1">
          View all {post.comments} comments
        </p>
      </div>
    </div>
  );
}

export default function InstagramSection() {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {POSTS.map((post) => (
            <PostCard key={post.url} post={post} />
          ))}
        </div>

        {/* Bottom CTA */}
        <p className="text-center font-body text-sm text-muted-foreground mt-10">
          Tag us in your photos with <span className="text-primary font-semibold">#JTAPKitchen</span> for a chance to be featured.
        </p>
      </div>
    </section>
  );
}