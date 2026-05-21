/**
 * TSEWhatsAppModal
 * Opens from the Lead Queue "WhatsApp" button next to "Call Now".
 * Lets the TSE pick a message template, preview it, then opens
 * wa.me deep-link which works on both desktop (WhatsApp Web) and mobile.
 *
 * Templates:
 *  1. Intro / First Contact
 *  2. Plan Price Quote  (auto-fills vehicle + estimated price)
 *  3. Callback Reminder
 *  4. Special Offer
 *  5. Custom (free-text)
 */

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { MessageCircle, Send, Copy, ExternalLink, CheckCircle } from "lucide-react";
import type { TSELead } from "../../types/teleSalesExecutive.types";

// ── Types ─────────────────────────────────────────────────────────────────────

type TemplateKey =
  | "INTRO"
  | "PRICE_QUOTE"
  | "CALLBACK_REMINDER"
  | "SPECIAL_OFFER"
  | "CUSTOM";

interface Template {
  key: TemplateKey;
  label: string;
  description: string;
  build: (lead: TSELead) => string;
}

// ── Template definitions ──────────────────────────────────────────────────────

function vehicleLabel(lead: TSELead): string {
  const cat = lead.vehicleCategory ?? (lead.vehicleType === "2W" ? "Bike" : "Car");
  return cat.charAt(0) + cat.slice(1).toLowerCase();
}

function basePrice(lead: TSELead): string {
  return `₹${lead.estimatedValue.toLocaleString("en-IN")}`;
}

const TEMPLATES: Template[] = [
  {
    key: "INTRO",
    label: "Introduction",
    description: "First-time contact — introduce CleanCar 360°",
    build: (lead) =>
      `Hi ${lead.customerName.split(" ")[0]} 👋,

I'm calling from *CleanCar 360°* — Surat's premium doorstep car wash service.

We noticed your interest in keeping your ${vehicleLabel(lead)} in top condition! 🚗✨

We offer:
✅ Doorstep washing every day
✅ Professional-grade products
✅ Trained, verified washers
✅ Flexible subscription plans starting at just *₹299/month*

Can I take 2 minutes to share the best plan for your ${vehicleLabel(lead)}?

— CleanCar 360° Team`,
  },
  {
    key: "PRICE_QUOTE",
    label: "Plan Price Quote",
    description: "Send plan pricing for their vehicle",
    build: (lead) =>
      `Hi ${lead.customerName.split(" ")[0]},

As discussed, here are our best plans for your *${vehicleLabel(lead)}* 🚗

━━━━━━━━━━━━━━━━━━
💧 *Water Wash* — ₹${lead.vehicleType === "2W" ? "299" : "699"}/month
   Daily rinse, removes dust & light dirt

🧴 *Water + Shampoo* — ₹${lead.vehicleType === "2W" ? "399" : "899"}/month
   Deep clean, removes stubborn grime

✨ *Water + Shampoo + Wax* — ₹${lead.vehicleType === "2W" ? "499" : "1,099"}/month
   Premium finish, UV protection
━━━━━━━━━━━━━━━━━━

⭐ *Recommended for you:* ${basePrice(lead)}/month

All plans include:
• Daily doorstep service
• Trained & verified washer
• No lock-in — cancel anytime

Ready to book? I'll set it up in 2 minutes! 🙌

— CleanCar 360° | ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
  },
  {
    key: "CALLBACK_REMINDER",
    label: "Callback Reminder",
    description: "Remind them of a scheduled callback",
    build: (lead) =>
      `Hi ${lead.customerName.split(" ")[0]},

This is a quick reminder from *CleanCar 360°* 🔔

We had scheduled a callback for you today regarding your *${vehicleLabel(lead)} wash subscription*.

I'll be calling you shortly. If it's not a good time, just reply here and we can reschedule — no problem at all! 😊

Looking forward to speaking with you.

— CleanCar 360° Team`,
  },
  {
    key: "SPECIAL_OFFER",
    label: "Special Offer",
    description: "Limited-time discount offer",
    build: (lead) =>
      `Hi ${lead.customerName.split(" ")[0]},

🎉 *Exclusive Offer — Today Only!*

For your *${vehicleLabel(lead)}*, we have a special deal:

🔥 Get *3 months* of our Water + Shampoo plan for the price of *2 months!*

Normal price: ${basePrice(lead)}/month
*Your offer: Save 33% on your first quarter*

This is available only for a limited time and only through our referral program.

Interested? Reply YES and I'll lock it in for you right away! 👇

— CleanCar 360° | Offer valid today`,
  },
  {
    key: "CUSTOM",
    label: "Custom Message",
    description: "Write your own message",
    build: (lead) =>
      `Hi ${lead.customerName.split(" ")[0]},\n\n`,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanPhone(phone: string): string {
  // Strip spaces and leading +
  return phone.replace(/\s+/g, "").replace(/^\+/, "");
}

function buildWAUrl(phone: string, message: string): string {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface TSEWhatsAppModalProps {
  lead: TSELead | null;
  open: boolean;
  onClose: () => void;
}

export function TSEWhatsAppModal({ lead, open, onClose }: TSEWhatsAppModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("PRICE_QUOTE");
  const [messageText, setMessageText] = useState<string>("");
  const [sent, setSent] = useState(false);

  // Rebuild message when template or lead changes
  const templateMessage = useMemo(() => {
    if (!lead) return "";
    const tpl = TEMPLATES.find((t) => t.key === selectedTemplate)!;
    return tpl.build(lead);
  }, [selectedTemplate, lead]);

  // Editable message (custom or edited template)
  const displayMessage =
    selectedTemplate === "CUSTOM"
      ? messageText || (lead ? `Hi ${lead.customerName.split(" ")[0]},\n\n` : "")
      : templateMessage;

  const handleTemplateChange = (key: TemplateKey) => {
    setSelectedTemplate(key);
    setSent(false);
    if (key === "CUSTOM") setMessageText(lead ? `Hi ${lead.customerName.split(" ")[0]},\n\n` : "");
  };

  const handleSend = () => {
    if (!lead) return;
    const url = buildWAUrl(lead.phone, displayMessage);
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
    toast.success(`WhatsApp opened for ${lead.customerName}`, {
      description: "Message pre-filled. Review and hit Send in WhatsApp.",
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(displayMessage).then(() => {
      toast.success("Message copied to clipboard");
    });
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setSent(false); } }}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <MessageCircle className="w-5 h-5" />
            Send WhatsApp Message
          </DialogTitle>
          <DialogDescription>
            {lead.customerName} · {lead.phone} ·{" "}
            <Badge variant="outline">{lead.vehicleCategory ?? lead.vehicleType}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Template selector */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Message Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={(v) => handleTemplateChange(v as TemplateKey)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    <div>
                      <span className="font-medium">{t.label}</span>
                      <span className="text-xs text-gray-400 ml-2">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message preview / editor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {selectedTemplate === "CUSTOM" ? "Your Message" : "Preview"}
              </Label>
              <span className="text-xs text-gray-400">
                {displayMessage.length} chars
              </span>
            </div>

            {selectedTemplate === "CUSTOM" ? (
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here…"
                rows={12}
                className="font-mono text-sm resize-none"
              />
            ) : (
              <div className="relative">
                {/* WhatsApp-styled preview bubble */}
                <div className="bg-[#dcf8c6] rounded-xl rounded-tl-none p-4 text-sm font-sans whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto border border-green-200 shadow-sm">
                  {displayMessage}
                </div>
                <div className="absolute -top-2 left-0 w-3 h-3 bg-[#dcf8c6] border-l border-t border-green-200"
                  style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} />
              </div>
            )}
          </div>

          {/* Tip */}
          <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded">
            💡 Clicking <strong>Open WhatsApp</strong> launches WhatsApp Web (or the app on mobile)
            with this message pre-filled. Review it once, then press <em>Send</em> in WhatsApp.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              onClick={handleSend}
              className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
            >
              {sent ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Opened — Send Again
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Open WhatsApp
                </>
              )}
            </Button>

            <Button variant="outline" onClick={handleCopy} className="gap-2">
              <Copy className="w-4 h-4" />
              Copy
            </Button>

            <Button variant="ghost" onClick={() => { onClose(); setSent(false); }}>
              Close
            </Button>
          </div>

          {sent && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              WhatsApp opened in a new tab. Message is pre-filled — just press Send.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
