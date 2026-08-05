// Builds a .ics calendar file string for an EventPromotion and a helper to
// trigger a browser download. Used so RSVP'd attendees can add the event to
// their own calendar (Google/Apple/Outlook).

function pad(n) { return String(n).padStart(2, '0'); }

function toIcsDate(dateStr) {
  // dateStr = "YYYY-MM-DD" -> "YYYYMMDD"
  return (dateStr || '').replace(/-/g, '');
}

function toIcsDateTime(dateStr, time) {
  // time = "HH:MM" (24h) -> "YYYYMMDDTHHMMSS"
  const d = toIcsDate(dateStr);
  if (!d) return '';
  if (!time) return `${d}T000000`;
  const [h, m] = time.split(':');
  return `${d}T${pad(parseInt(h, 10))}${pad(parseInt(m || '0', 10))}00`;
}

function nowStamp() {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcs(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function buildEventIcs(promo) {
  const start = toIcsDateTime(promo.date, promo.time);
  const end = promo.end_time ? toIcsDateTime(promo.date, promo.end_time) : '';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//JTAP Kitchen//Event//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID ? crypto.randomUUID() : `${promo.id || start}-${Date.now()}`}@jtapkitchen.com`,
    `DTSTAMP:${nowStamp()}`,
  ];

  if (start && end) {
    lines.push(`DTSTART:${start}`, `DTEND:${end}`);
  } else if (start) {
    // No time = all-day event
    lines.push(`DTSTART;VALUE=DATE:${toIcsDate(promo.date)}`);
  }

  lines.push(
    `SUMMARY:${escapeIcs(promo.title)}`,
    `LOCATION:${escapeIcs(promo.location_label || 'JTAP Kitchen — Memphis, TN')}`,
    `DESCRIPTION:${escapeIcs(promo.subtitle || promo.description || '')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return lines.join('\r\n');
}

export function downloadIcs(filename, icsString) {
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/[^\w.-]+/g, '_');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}