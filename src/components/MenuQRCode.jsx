import { QRCodeSVG } from "qrcode.react";

export default function MenuQRCode() {
  const url = "https://jtapkitchen.com";
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
        <QRCodeSVG
          value={url}
          size={180}
          level="M"
          fgColor="#1a1a1a"
          bgColor="#ffffff"
        />
      </div>
      <p className="font-heading text-lg font-semibold text-foreground mt-6">JTAP Kitchen</p>
      <p className="font-body text-sm text-muted-foreground mt-1 max-w-xs">
        Scan to explore our menu, reserve a table, and stay up to date with JTAP Kitchen.
      </p>
    </div>
  );
}