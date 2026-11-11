import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { CATERING_ORDER_URL } from "@/lib/ordering";

// Landscape version of the ezCater catering poster, rebuilt in markup so the
// type stays crisp and the layout reflows instead of being cropped.

const IMAGES = {
  main: "https://base44.app/api/apps/69d2426201cd12d6d2a6db95/files/mp/public/69d2426201cd12d6d2a6db95/fce6d153b_3bc69e45d_generated_image-web.jpg",
  mac: "https://base44.app/api/apps/69d2426201cd12d6d2a6db95/files/mp/public/69d2426201cd12d6d2a6db95/889d9b19f_fae363bb6_generated_image-web.jpg",
  broccoli: "https://base44.app/api/apps/69d2426201cd12d6d2a6db95/files/mp/public/69d2426201cd12d6d2a6db95/31121b78d_8df0d3d7e_generated_image-web.jpg",
  logo: "https://base44.app/api/apps/69d2426201cd12d6d2a6db95/files/mp/public/69d2426201cd12d6d2a6db95/5a6a71255_941e8439b_jkap-logo-web.jpg",
};

export default function CateringHero() {
  return (
    <section className="bg-[#251e1c] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 md:py-14">
        {/* Brand bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={IMAGES.logo}
              alt=""
              className="w-11 h-11 rounded-full object-cover ring-1 ring-[#f4f0e9]/20"
            />
            <span className="font-body text-base md:text-lg font-extrabold tracking-[0.18em] text-[#f4f0e9]">
              JTAP KITCHEN
            </span>
          </div>
          <a
            href={CATERING_ORDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#e88d40] text-[#251e1c] rounded-full px-4 py-2 font-body text-[11px] md:text-xs font-extrabold tracking-[0.12em] uppercase hover:opacity-90 transition-opacity"
          >
            Now on ezCater
          </a>
        </div>

        {/* Headline + collage */}
        <div className="mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7">
            <h1 className="font-body font-extrabold uppercase tracking-tight leading-[0.92] text-4xl sm:text-5xl md:text-6xl text-[#f4f0e9]">
              Office Catering,
              <br />
              <span className="text-[#e88d40]">Done Right.</span>
            </h1>
            <p className="font-body text-sm md:text-base leading-relaxed text-[#f4f0e9]/75 max-w-lg mt-5">
              Planning a company lunch or client meeting? Impress your guests with Memphis-made
              comfort food, delivered to your office.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-7">
              <a
                href={CATERING_ORDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#e88d40] text-[#251e1c] rounded-full font-body text-sm font-bold tracking-wide hover:opacity-90 transition-opacity"
              >
                <ShoppingBag className="w-4 h-4" /> Order Catering Online
              </a>
              <Link
                to="/event-center"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[#f4f0e9]/30 text-[#f4f0e9] rounded-full font-body text-sm font-semibold tracking-wide hover:bg-[#f4f0e9]/10 transition-colors"
              >
                Plan a Large Event <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <Link
              to="/catering-flyer"
              className="inline-block mt-5 font-body text-xs text-[#f4f0e9]/50 hover:text-[#e88d40] underline underline-offset-4 transition-colors"
            >
              Download our office catering flyer
            </Link>
          </div>

          <div className="lg:col-span-5 grid grid-cols-3 gap-3 h-52 sm:h-64 lg:h-72">
            <img
              src={IMAGES.main}
              alt="Ragin' Chicken Pasta"
              className="col-span-2 w-full h-full object-cover rounded-2xl"
            />
            <div className="grid grid-rows-2 gap-3">
              <img
                src={IMAGES.mac}
                alt="Smoked Gouda Mac & Cheese"
                className="w-full h-full object-cover rounded-2xl"
              />
              <img
                src={IMAGES.broccoli}
                alt="Gourmet sides"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* Menu line */}
        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-sm font-semibold text-[#f4f0e9]/85">
          <span>Ragin' Chicken Pasta</span>
          <span className="text-[#e88d40]">·</span>
          <span>Southern Fried Catfish</span>
          <span className="text-[#e88d40]">·</span>
          <span>Gourmet Sides</span>
        </div>

        {/* Footer cluster */}
        <div className="mt-5 pt-5 border-t border-[#403633] flex items-center justify-between gap-6">
          <div className="font-body">
            <p className="text-sm font-bold text-[#f4f0e9]">Easy ordering. On-time delivery.</p>
            <a
              href="tel:+19012138085"
              className="block text-sm font-bold text-[#e88d40] mt-1.5 hover:underline"
            >
              Call (901) 213-8085
            </a>
            <a
              href={CATERING_ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-[#f4f0e9]/70 mt-1 hover:text-[#e88d40] transition-colors"
            >
              ezcater.com/catering/jtap-kitchen-3
            </a>
            <p className="text-xs text-[#f4f0e9]/45 mt-1">
              3397 Summer Ave, Memphis · jtapkitchen.com
            </p>
          </div>

          <div className="bg-[#e88d40] rounded-2xl p-2.5 shrink-0 text-center">
            <div className="bg-white rounded-lg p-1.5">
              <QRCodeCanvas value={CATERING_ORDER_URL} size={72} level="M" bgColor="#ffffff" fgColor="#251e1c" />
            </div>
            <p className="font-body text-[9px] font-extrabold tracking-[0.1em] text-[#251e1c] mt-1.5">
              SCAN TO ORDER
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}