import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LinkedInAnnouncementModal({ open, onClose, event }) {
  const [postText, setPostText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);

  const generatePost = async () => {
    if (!event) return;
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a professional, engaging LinkedIn post announcing this fine dining experience at JTAP Kitchen. Keep it under 280 characters, use 1-2 emojis, include relevant hashtags like #FineDining #JTAPKitchen. Event details: Title: "${event.title}", Date: ${event.date}, Time: ${event.time}, Price: $${event.price_per_guest}/guest, Type: ${event.event_type}. Description: ${event.description || ''}`
      });
      setPostText(result);
    } catch {
      toast.error("Failed to generate post");
    } finally {
      setGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      await base44.functions.invoke('postLinkedInAnnouncement', {
        postText,
        eventId: event?.id
      });
      toast.success("Posted to LinkedIn successfully!");
      onClose();
      setPostText("");
    } catch (err) {
      toast.error("Failed to post to LinkedIn");
    } finally {
      setPosting(false);
    }
  };

  const charCount = postText.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0A66C2]" />
            Announce on LinkedIn
          </DialogTitle>
        </DialogHeader>

        {event && (
          <div className="bg-muted rounded-lg p-3 text-sm mb-2">
            <p className="font-semibold">{event.title}</p>
            <p className="text-muted-foreground">{event.date} • {event.time} • ${event.price_per_guest}/guest</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={generatePost}
              disabled={generating || !event}
              className="gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Draft
            </Button>
          </div>

          <Textarea
            placeholder="Write your LinkedIn announcement..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={5}
            className="resize-none"
          />

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Visibility: Public</span>
            <span className={charCount > 3000 ? "text-destructive" : ""}>{charCount} / 3000</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handlePost}
            disabled={!postText.trim() || posting || charCount > 3000}
            className="gap-2 bg-[#0A66C2] hover:bg-[#0A66C2]/90"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Linkedin className="w-4 h-4" />}
            Post to LinkedIn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}