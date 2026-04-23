import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Linkedin, Calendar, Clock, DollarSign, Users, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LinkedInAnnouncementModal from "./LinkedInAnnouncementModal";

export default function LinkedInEventsTab() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['eventsForLinkedIn'],
    queryFn: () => base44.entities.Event.list('-created_date', 50)
  });

  const upcomingEvents = events.filter(e => e.is_published !== false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-[#0A66C2]/5 border border-[#0A66C2]/20 rounded-2xl">
        <div className="p-3 bg-[#0A66C2] rounded-xl">
          <Linkedin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-foreground">LinkedIn Announcements</h3>
          <p className="font-body text-sm text-muted-foreground">
            Select an event below to post an announcement to your LinkedIn followers
          </p>
        </div>
        <div className="ml-auto">
          <Badge className="bg-green-100 text-green-700">Connected ✓</Badge>
        </div>
      </div>

      {/* Events list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-muted border-t-[#0A66C2] rounded-full animate-spin" />
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No published events found.</p>
          <p className="font-body text-sm text-muted-foreground mt-1">Create events from the Events page first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingEvents.map(event => (
            <div
              key={event.id}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-[#0A66C2]/40 transition-colors"
            >
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover rounded-xl" />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading font-semibold text-foreground">{event.title}</h3>
                  <Badge className="bg-blue-100 text-blue-700 shrink-0 ml-2">{event.event_type}</Badge>
                </div>
                {event.description && (
                  <p className="font-body text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>${event.price_per_guest}/guest</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{event.spots_available ?? event.max_capacity} spots</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setSelectedEvent(event)}
                className="w-full gap-2 bg-[#0A66C2] hover:bg-[#0A66C2]/90"
                size="sm"
              >
                <Linkedin className="w-4 h-4" />
                Announce on LinkedIn
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <LinkedInAnnouncementModal
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </div>
  );
}