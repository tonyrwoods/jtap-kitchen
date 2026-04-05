import { createContext, useContext, useState } from "react";

const TRANSLATIONS = {
  en: {
    nav: { menu: "Menu", story: "Our Story", gallery: "Gallery", team: "Our Team", reviews: "Reviews", reserve: "Reserve", book: "Book a Table", events: "Events" },
    hero: { subtitle: "A Culinary Journey", cta: "Reserve Your Table", menu: "Explore Menu" },
    menu: { title: "Our Menu", subtitle: "Thoughtfully crafted dishes using the finest seasonal ingredients.", all: "All", chefspick: "Chef's Pick", noItems: "No items in this category yet." },
    reservation: { title: "Reserve a Table", subtitle: "Join us for an unforgettable dining experience." },
    footer: { rights: "All rights reserved." },
  },
  fr: {
    nav: { menu: "Menu", story: "Notre Histoire", gallery: "Galerie", team: "Notre Équipe", reviews: "Avis", reserve: "Réserver", book: "Réserver une Table", events: "Événements" },
    hero: { subtitle: "Un Voyage Culinaire", cta: "Réserver Votre Table", menu: "Explorer le Menu" },
    menu: { title: "Notre Menu", subtitle: "Des plats soigneusement élaborés avec les meilleurs ingrédients de saison.", all: "Tout", chefsick: "Choix du Chef", noItems: "Aucun élément dans cette catégorie." },
    reservation: { title: "Réserver une Table", subtitle: "Rejoignez-nous pour une expérience gastronomique inoubliable." },
    footer: { rights: "Tous droits réservés." },
  },
  es: {
    nav: { menu: "Menú", story: "Nuestra Historia", gallery: "Galería", team: "Nuestro Equipo", reviews: "Reseñas", reserve: "Reservar", book: "Reservar Mesa", events: "Eventos" },
    hero: { subtitle: "Un Viaje Culinario", cta: "Reserva Tu Mesa", menu: "Explorar Menú" },
    menu: { title: "Nuestro Menú", subtitle: "Platos elaborados con los mejores ingredientes de temporada.", all: "Todo", chefsick: "Elección del Chef", noItems: "No hay elementos en esta categoría." },
    reservation: { title: "Reservar Mesa", subtitle: "Únase a nosotros para una experiencia gastronómica inolvidable." },
    footer: { rights: "Todos los derechos reservados." },
  },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");

  const setLanguage = (l) => {
    setLang(l);
    localStorage.setItem("lang", l);
  };

  const t = (path) => {
    const keys = path.split(".");
    let val = TRANSLATIONS[lang];
    for (const k of keys) val = val?.[k];
    return val ?? path;
  };

  return (
    <I18nContext.Provider value={{ lang, setLanguage, t, languages: ["en", "fr", "es"] }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);