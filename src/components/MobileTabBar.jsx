import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Home, Utensils, Calendar } from "lucide-react";
import { useEffect } from "react";
import { saveTabState, loadTabState } from "@/lib/TabStateManager";

const TABS = [
  { icon: Home, label: "Home", href: "/", id: "home" },
  { icon: Utensils, label: "Menu", href: "/menu", id: "menu" },
  { icon: Calendar, label: "Book", href: "/#reserve", id: "book" }
];

export default function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Save scroll position when navigating away
  useEffect(() => {
    const currentTab = TABS.find(tab => {
      const baseHref = tab.href.split("#")[0];
      return baseHref === "/" ? location.pathname === "/" : location.pathname.startsWith(baseHref);
    });

    if (currentTab) {
      saveTabState(currentTab.id, window.scrollY);
    }
  }, [location.pathname]);

  const handleTabClick = (href, tabId) => {
    const isActive = href === "/" ? location.pathname === "/" : location.pathname.startsWith(href.split("#")[0]);
    
    if (isActive) {
      // Reset to root of tab and restore scroll position
      navigate(href);
      setTimeout(() => {
        const state = loadTabState(tabId);
        window.scrollTo({ top: state.scrollPosition || 0, behavior: "smooth" });
      }, 0);
    } else {
      navigate(href);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border z-40 flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {TABS.map(({ icon: Icon, label, href, id }) => {
        const isActive = href === "/" ? location.pathname === "/" : location.pathname.startsWith(href.split("#")[0]);
        
        return (
          <button
            key={href}
            onClick={() => handleTabClick(href, id)}
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