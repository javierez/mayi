"use client";

import { useState, useMemo } from "react";
import { MessageCircle, Mail, Send, Search } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { mockContacts } from "./mock-inbox-data";
import type { MessageChannel, ComposeMessageData, InboxContact } from "./inbox-types";

interface InboxComposeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: ComposeMessageData) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function InboxComposeDialog({
  isOpen,
  onClose,
  onSend,
}: InboxComposeDialogProps) {
  const [channel, setChannel] = useState<MessageChannel>("whatsapp");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<InboxContact | null>(null);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!recipientSearch) return mockContacts;
    const search = recipientSearch.toLowerCase();
    return mockContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        (c.email?.toLowerCase().includes(search) ?? false) ||
        (c.phone?.includes(search) ?? false)
    );
  }, [recipientSearch]);

  const handleSelectRecipient = (contact: InboxContact) => {
    setSelectedRecipient(contact);
    setRecipientSearch(contact.name);
    setShowRecipientDropdown(false);
  };

  const handleSend = () => {
    if (!selectedRecipient || !content.trim()) return;

    onSend({
      channel,
      recipientId: selectedRecipient.id,
      recipientName: selectedRecipient.name,
      subject: channel === "email" ? subject : undefined,
      content,
    });

    // Reset form
    setChannel("whatsapp");
    setRecipientSearch("");
    setSelectedRecipient(null);
    setSubject("");
    setContent("");
  };

  const handleClose = () => {
    // Reset form on close
    setChannel("whatsapp");
    setRecipientSearch("");
    setSelectedRecipient(null);
    setSubject("");
    setContent("");
    onClose();
  };

  const canSend = selectedRecipient && content.trim() && (channel === "whatsapp" || subject.trim());

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Nuevo mensaje
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Envia un mensaje por WhatsApp o email a un contacto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Channel selector - subtle sunset colors */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold tracking-wide text-muted-foreground">
              CANAL
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 p-3 transition-all duration-200",
                  channel === "whatsapp"
                    ? "border-amber-400/60 bg-amber-50/50 text-amber-700 shadow-sm"
                    : "border-border text-muted-foreground hover:border-amber-200/60 hover:bg-amber-50/30"
                )}
              >
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel("email")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 p-3 transition-all duration-200",
                  channel === "email"
                    ? "border-rose-400/60 bg-rose-50/50 text-rose-700 shadow-sm"
                    : "border-border text-muted-foreground hover:border-rose-200/60 hover:bg-rose-50/30"
                )}
              >
                <Mail className="h-5 w-5" />
                <span className="font-medium">Email</span>
              </button>
            </div>
          </div>

          {/* Recipient selector */}
          <div className="relative space-y-2">
            <Label className="text-sm font-semibold tracking-wide text-muted-foreground">
              DESTINATARIO
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={recipientSearch}
                onChange={(e) => {
                  setRecipientSearch(e.target.value);
                  setSelectedRecipient(null);
                  setShowRecipientDropdown(true);
                }}
                onFocus={() => setShowRecipientDropdown(true)}
                placeholder="Buscar contacto..."
                className="pl-10"
              />
            </div>

            {/* Dropdown */}
            {showRecipientDropdown && filteredContacts.length > 0 ? (
              <div className="absolute z-10 mt-1 w-full rounded-2xl border border-border bg-card shadow-md">
                <ScrollArea className="max-h-48">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleSelectRecipient(contact)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {contact.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {channel === "whatsapp" ? contact.phone : contact.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </ScrollArea>
              </div>
            ) : null}
          </div>

          {/* Subject (email only) */}
          {channel === "email" ? (
            <div className="space-y-2">
              <Label className="text-sm font-semibold tracking-wide text-muted-foreground">
                ASUNTO
              </Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Escribe el asunto del email..."
              />
            </div>
          ) : null}

          {/* Message content */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold tracking-wide text-muted-foreground">
              MENSAJE
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                channel === "whatsapp"
                  ? "Escribe tu mensaje de WhatsApp..."
                  : "Escribe el contenido del email..."
              }
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "shadow-md",
              channel === "whatsapp"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-rose-600 hover:bg-rose-700"
            )}
          >
            <Send className="mr-2 h-4 w-4" />
            Enviar {channel === "whatsapp" ? "WhatsApp" : "email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
