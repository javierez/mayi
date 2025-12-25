"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  MessageCircle,
  Mail,
  Send,
  Search,
  Paperclip,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
  X,
} from "lucide-react";
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
import type { EmailAttachment } from "~/server/services/gmail-service";

interface PendingAttachment {
  file: File;
  name: string;
  type: string;
  size: string;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return FileImage;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext)) return FileText;
  return File;
}

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
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: PendingAttachment[] = [];
    for (const file of Array.from(files)) {
      // Limit file size to 25MB (Gmail limit)
      if (file.size > 25 * 1024 * 1024) continue;
      newAttachments.push({
        file,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: formatFileSize(file.size),
      });
    }

    setPendingAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Remove pending attachment
  const removePendingAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] ?? "";
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

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

  const handleSend = async () => {
    if (!selectedRecipient || !content.trim()) return;

    setIsSending(true);
    try {
      // Convert attachments to base64 if email
      let attachments: { filename: string; mimeType: string; data: string }[] | undefined;
      if (channel === "email" && pendingAttachments.length > 0) {
        attachments = await Promise.all(
          pendingAttachments.map(async (attachment) => ({
            filename: attachment.name,
            mimeType: attachment.type,
            data: await fileToBase64(attachment.file),
          }))
        );
      }

      onSend({
        channel,
        recipientId: selectedRecipient.id,
        recipientName: selectedRecipient.name,
        subject: channel === "email" ? subject : undefined,
        content,
        attachments,
      });

      // Reset form
      setChannel("whatsapp");
      setRecipientSearch("");
      setSelectedRecipient(null);
      setSubject("");
      setContent("");
      setPendingAttachments([]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    // Reset form on close
    setChannel("whatsapp");
    setRecipientSearch("");
    setSelectedRecipient(null);
    setSubject("");
    setContent("");
    setPendingAttachments([]);
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

          {/* Attachments (email only) */}
          {channel === "email" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold tracking-wide text-muted-foreground">
                  ADJUNTOS
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 text-xs"
                >
                  <Paperclip className="mr-1.5 h-3 w-3" />
                  Adjuntar archivo
                </Button>
              </div>

              {pendingAttachments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pendingAttachments.map((attachment, index) => {
                    const IconComponent = getFileIcon(attachment.name);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 py-1 pl-2.5 pr-1"
                      >
                        <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="max-w-[100px] truncate text-xs">{attachment.name}</span>
                        <span className="text-[10px] text-muted-foreground">({attachment.size})</span>
                        <button
                          type="button"
                          onClick={() => removePendingAttachment(index)}
                          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Maximo 25 MB por archivo
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => void handleSend()}
            disabled={!canSend || isSending}
            className={cn(
              "shadow-md",
              channel === "whatsapp"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-rose-600 hover:bg-rose-700"
            )}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSending ? "Enviando..." : `Enviar ${channel === "whatsapp" ? "WhatsApp" : "email"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
