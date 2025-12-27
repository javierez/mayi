"use client";

import { useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  MessageCircle,
  Mail,
  Star,
  X,
  Send,
  Paperclip,
  FileText,
  Check,
  CheckCheck,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
  Loader2,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "~/components/ui/dialog";
import type { InboxThread, ThreadMessage, InboxAttachment } from "./inbox-types";
import type { EmailAttachment } from "~/server/services/gmail-service";

interface PendingAttachment {
  file: File;
  name: string;
  type: string;
  size: string;
}

interface ConversationFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  thread: InboxThread;
  onToggleStar: (threadId: string) => void;
  onSendReply: (threadId: string, content: string, attachments?: EmailAttachment[]) => void;
  onAttachmentClick?: (attachment: InboxAttachment, messageId: string) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
    return FileImage;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return FileSpreadsheet;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return FileArchive;
  }
  if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext)) {
    return FileText;
  }
  return File;
}

// Chat-style message bubble for WhatsApp
function ChatBubble({
  message,
  isFromAgent,
  onAttachmentClick,
}: {
  message: ThreadMessage;
  isFromAgent: boolean;
  onAttachmentClick?: (attachment: InboxAttachment, messageId: string) => void;
}) {
  const formattedTime = format(message.timestamp, "HH:mm", { locale: es });
  const formattedDate = format(message.timestamp, "d MMM", { locale: es });

  return (
    <div className={cn("flex gap-3", isFromAgent ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-10 w-10 flex-shrink-0">
        {message.from.avatar ? (
          <AvatarImage src={message.from.avatar} alt={message.from.name} />
        ) : null}
        <AvatarFallback className={cn(
          "text-sm",
          isFromAgent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {getInitials(message.from.name)}
        </AvatarFallback>
      </Avatar>

      <div className={cn("max-w-[70%] space-y-1", isFromAgent ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isFromAgent
              ? "rounded-br-md bg-primary/10 text-foreground"
              : "rounded-bl-md bg-muted/50 text-foreground"
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 ? (
          <div className="space-y-1">
            {message.attachments.map((attachment, index) => {
              const IconComponent = getFileIcon(attachment.name);

              return (
                <Card
                  key={index}
                  className="cursor-pointer shadow-sm transition-all hover:shadow-md"
                  onClick={() => onAttachmentClick?.(attachment, message.id)}
                >
                  <CardContent className="flex items-center gap-2 p-2">
                    <div className="rounded-lg bg-muted/50 p-1.5">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium">{attachment.name}</p>
                      {attachment.size ? (
                        <p className="text-[10px] text-muted-foreground">{attachment.size}</p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}

        <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", isFromAgent && "justify-end")}>
          <span>{formattedDate} {formattedTime}</span>
          {isFromAgent ? (
            message.status === "sent" ? (
              <CheckCheck className="h-3.5 w-3.5 text-primary/60" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Email-style message card
function EmailCard({
  message,
  isFromAgent,
  onAttachmentClick,
}: {
  message: ThreadMessage;
  isFromAgent: boolean;
  onAttachmentClick?: (attachment: InboxAttachment, messageId: string) => void;
}) {
  const formattedTime = format(message.timestamp, "HH:mm", { locale: es });
  const formattedDate = format(message.timestamp, "d MMM yyyy", { locale: es });

  return (
    <div className={cn(
      "rounded-lg border",
      isFromAgent
        ? "border-rose-200/60 bg-rose-50/30 dark:border-rose-800/40 dark:bg-rose-950/20"
        : "border-border/60 bg-background"
    )}>
      <div className="flex items-start gap-4 border-b border-border/40 px-5 py-4">
        {isFromAgent ? (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
            <Send className="h-4 w-4" />
          </div>
        ) : (
          <Avatar className="h-10 w-10 flex-shrink-0">
            {message.from.avatar ? (
              <AvatarImage src={message.from.avatar} alt={message.from.name} />
            ) : null}
            <AvatarFallback className="bg-muted text-sm text-muted-foreground">
              {getInitials(message.from.name)}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className={cn(
                "truncate text-sm font-medium",
                isFromAgent ? "text-rose-700 dark:text-rose-300" : "text-foreground"
              )}>
                {message.from.name}
                {isFromAgent && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">(Yo)</span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {message.from.email}
              </p>
            </div>
            <span className="flex-shrink-0 text-xs text-muted-foreground">
              {formattedDate} {formattedTime}
            </span>
          </div>
          {isFromAgent && message.to && message.to.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Para: {message.to.map((r) => r.email).join(", ")}
            </p>
          ) : null}
          {message.cc && message.cc.length > 0 ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cc: {message.cc.map((r) => r.email).join(", ")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {message.content}
          </p>
        </div>
      </div>

      {message.attachments && message.attachments.length > 0 ? (
        <div className="border-t border-border/40 px-5 py-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Adjuntos ({message.attachments.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((attachment, index) => {
              const IconComponent = getFileIcon(attachment.name);

              return (
                <button
                  type="button"
                  key={index}
                  className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 transition-all hover:border-primary/40 hover:bg-muted/50"
                  onClick={() => onAttachmentClick?.(attachment, message.id)}
                >
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{attachment.name}</span>
                  {attachment.size ? (
                    <span className="text-xs text-muted-foreground">({attachment.size})</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MessageBubble({
  message,
  isFromAgent,
  channel,
  onAttachmentClick,
}: {
  message: ThreadMessage;
  isFromAgent: boolean;
  channel: "whatsapp" | "email";
  onAttachmentClick?: (attachment: InboxAttachment, messageId: string) => void;
}) {
  if (channel === "email") {
    return <EmailCard message={message} isFromAgent={isFromAgent} onAttachmentClick={onAttachmentClick} />;
  }
  return <ChatBubble message={message} isFromAgent={isFromAgent} onAttachmentClick={onAttachmentClick} />;
}

export function ConversationFullscreenModal({
  isOpen,
  onClose,
  thread,
  onToggleStar,
  onSendReply,
  onAttachmentClick,
}: ConversationFullscreenModalProps) {
  const [replyContent, setReplyContent] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: PendingAttachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 25 * 1024 * 1024) continue;
      newAttachments.push({
        file,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: formatFileSize(file.size),
      });
    }

    setPendingAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const removePendingAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

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

  const handleSendReply = async () => {
    if (!replyContent.trim() && pendingAttachments.length === 0) return;

    setIsSending(true);
    try {
      let emailAttachments: EmailAttachment[] | undefined;
      if (pendingAttachments.length > 0) {
        emailAttachments = await Promise.all(
          pendingAttachments.map(async (attachment) => ({
            filename: attachment.name,
            mimeType: attachment.type,
            data: await fileToBase64(attachment.file),
          }))
        );
      }

      onSendReply(thread.id, replyContent, emailAttachments);
      setReplyContent("");
      setPendingAttachments([]);
    } finally {
      setIsSending(false);
    }
  };

  const mainParticipant = thread.participants.find((p) => p.id !== "agent") ?? thread.participants[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[95vh] max-h-[95vh] w-[95vw] max-w-[1200px] flex-col overflow-hidden p-0 [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              {mainParticipant?.avatar ? (
                <AvatarImage src={mainParticipant.avatar} alt={mainParticipant.name} />
              ) : null}
              <AvatarFallback className="bg-muted text-muted-foreground">
                {getInitials(mainParticipant?.name ?? "?")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{mainParticipant?.name}</h2>
                <div
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                    thread.channel === "whatsapp"
                      ? "border-amber-200/60 bg-amber-50/50 text-amber-700/80"
                      : "border-rose-200/60 bg-rose-50/50 text-rose-700/80"
                  )}
                >
                  {thread.channel === "whatsapp" ? (
                    <MessageCircle className="h-3 w-3" />
                  ) : (
                    <Mail className="h-3 w-3" />
                  )}
                  {thread.channel === "whatsapp" ? "WhatsApp" : "Email"}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {thread.channel === "whatsapp"
                  ? mainParticipant?.phone
                  : mainParticipant?.email}
              </p>
              {thread.subject ? (
                <p className="mt-1 text-sm font-medium">{thread.subject}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleStar(thread.id)}
              className={cn(thread.starred ? "text-amber-500" : "text-muted-foreground")}
            >
              <Star className={cn("h-5 w-5", thread.starred && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Thread Context - Linked Listing */}
        {thread.threadContext?.listing ? (
          <div className="border-b border-border/40 px-6 py-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {thread.threadContext.listing.imageUrl ? (
                    <Image
                      src={thread.threadContext.listing.imageUrl}
                      alt={thread.threadContext.listing.title ?? "Property"}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {thread.threadContext.listing.title ?? "Propiedad"}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {thread.threadContext.contactType === "owner"
                        ? "Propietario"
                        : "Demandante"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {thread.threadContext.listing.referenceNumber ? (
                      <span>Ref: {thread.threadContext.listing.referenceNumber}</span>
                    ) : null}
                    {thread.threadContext.listing.city ? (
                      <span>• {thread.threadContext.listing.city}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Messages */}
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-6">
            {thread.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isFromAgent={message.from.id === "agent"}
                channel={thread.channel}
                onAttachmentClick={onAttachmentClick}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Reply Section */}
        <div className="border-t border-border/40 px-6 py-4">
          <div className="space-y-3">
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
                      <span className="max-w-[120px] truncate text-xs">{attachment.name}</span>
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
            ) : null}

            <div className="flex gap-3">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="min-h-[60px] resize-none flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendReply();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={thread.channel !== "email"}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => void handleSendReply()}
                  disabled={isSending || (!replyContent.trim() && pendingAttachments.length === 0)}
                  className={cn(
                    thread.channel === "whatsapp"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  )}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
