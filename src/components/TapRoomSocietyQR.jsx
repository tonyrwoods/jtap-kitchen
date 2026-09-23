import { QRCodeSVG } from "qrcode.react";

const TAP_ROOM_URL = "https://www.jtapkitchen.com/tap-room-society";

export default function TapRoomSocietyQR() {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
        <QRCodeSVG value={TAP_ROOM_URL} size={180} level="M" fgColor="#1a1a1a" bgColor="#ffffff" />
      </div>
      <p className="font-heading text-lg font-semibold text-foreground mt-6">Join the Tap Room Society</p>
      <p className="font-body text-sm text-muted-foreground mt-1 max-w-xs">
        Scan to become a member and unlock exclusive perks, loyalty points, and private-room access.
      </p>
      <a
        href="/tap-room-society"
        className="mt-4 inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-body text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Learn More
      </a>
    </div>
  );
}