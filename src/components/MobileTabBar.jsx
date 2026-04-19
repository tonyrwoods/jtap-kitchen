import { useLocation, useNavigate } from "react-router-dom";
import { Home, Utensils, Calendar } from "lucide-react";

const TABS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Utensils, label: "Menu", href: "/menu" },
  { icon: Calendar, label: "Book", href: "/#reserve" }
];

export default function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleTabClick = (href) => {
    const isActive = href === "/" ? location.pathname === "/" : location.pathname.startsWith(href.split("#")[0]);
    
    if (isActive) {
      // Reset to root of tab
      navigate(href);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(href);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border z-40 flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {TABS.map(({ icon: Icon, label, href }) => {
        const isActive = href === "/" ? location.pathname === "/" : location.pathname.startsWith(href.split("#")[0]);
        
        return (
          <button
            key={href}
            onClick={() => handleTabClick(href)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-body text-xs font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}