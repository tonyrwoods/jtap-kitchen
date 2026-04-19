import { Link, useLocation } from "react-router-dom";
import { Home, Utensils, Calendar } from "lucide-react";

const TABS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Utensils, label: "Menu", href: "/menu" },
  { icon: Calendar, label: "Book", href: "/#reserve" }
];

export default function MobileTabBar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border z-40 flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {TABS.map(({ icon: Icon, label, href }) => {
        const isActive = href === "/" ? location.pathname === "/" : location.pathname.startsWith(href.split("#")[0]);
        
        return (
          <Link
            key={href}
            to={href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-body text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}