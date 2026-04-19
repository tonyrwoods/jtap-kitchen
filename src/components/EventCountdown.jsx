export default function EventCountdown({ date }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const eventDate = new Date(date + "T00:00:00");
  const diffTime = eventDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return <span className="text-xs font-semibold text-primary">Today</span>;
  if (diffDays === 1) return <span className="text-xs font-semibold text-primary">Tomorrow</span>;
  if (diffDays <= 7) return <span className="text-xs font-semibold text-primary">In {diffDays} days</span>;
  if (diffDays <= 30) return <span className="text-xs font-semibold text-muted-foreground">In {Math.floor(diffDays / 7)} weeks</span>;
  return null;
}