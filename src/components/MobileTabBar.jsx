import { useLocation, useNavigate } from "react-router-dom";
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

  // Save scroll position and pathname when navigating away
  useEffect(() => {
    const currentTab = TABS.find(tab => {
      const baseHref = tab.href.split("#")[0];
      return baseHref === "/" ? location.pathname === "/" : location.pathname.startsWith(baseHref);
    });

    if (currentTab) {
      saveTabState(currentTab.id, window.scrollY, location.pathname);
    }
  }, [location.pathname, location.search]);

  const handleTabClick = (href, tabId) => {
    const baseHref = href.split("#")[0];
    const isActive = baseHref === "/" ? location.pathname === "/" : location.pathname.startsWith(baseHref);
    
    if (isActive && location.pathname === href) {
      // Same tab clicked twice - scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      saveTabState(tabId, 0, location.pathname);
    } else if (isActive) {
      // Same tab but different path/hash - navigate and restore
      navigate(href);
      setTimeout(() => {
        const state = loadTabState(tabId);
        window.scrollTo({ top: state.scrollPosition || 0, behavior: "smooth" });
      }, 100);
    } else {
      // Different tab - navigate and restore saved position
      navigate(href);
      setTimeout(() => {
        const state = loadTabState(tabId);
        window.scrollTo({ top: state.scrollPosition || 0, behavior: "auto" });
      }, 100);
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