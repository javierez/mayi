"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  MessageCircle,
  Mail,
  Star,
  Trash2,
  ArrowLeft,
  Send,
  Paperclip,
  MailOpen,
  FileText,
  User,
  Check,
  CheckCheck,
  Download,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
  X,
  Loader2,
  Maximize2,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Card, CardContent } from "~/components/ui/card";
import { DeleteConfirmationModal } from "~/components/ui/delete-confirmation-modal";
import { AttachmentActionModal } from "./attachment-action-modal";
import { ConversationFullscreenModal } from "./conversation-fullscreen-modal";
import type { InboxThread, ThreadMessage, InboxAttachment } from "./inbox-types";
import type { EmailAttachment } from "~/server/services/gmail-service";

interface PendingAttachment {
  file: File;
  name: string;
  type: string;
  size: string;
}

interface InboxConversationViewProps {
  thread: InboxThread | null;
  onToggleStar: (threadId: string) => void;
  onToggleRead: (threadId: string) => void;
  onDelete: (threadId: string) => void | Promise<void>;
  onSendReply: (threadId: string, content: string, attachments?: EmailAttachment[]) => void;
  onBack?: () => void;
  showBackButton?: boolean;
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

  // Images
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
    return FileImage;
  }
  // Spreadsheets
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return FileSpreadsheet;
  }
  // Archives
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return FileArchive;
  }
  // Documents (PDF, Word, etc.)
  if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext)) {
    return FileText;
  }
  // Default
  return File;
}

function buildDownloadUrl(attachment: { attachmentId?: string; messageId?: string; name: string }): string | null {
  if (!attachment.attachmentId || !attachment.messageId) {
    return null;
  }
  const params = new URLSearchParams({
    messageId: attachment.messageId,
    attachmentId: attachment.attachmentId,
    filename: attachment.name,
  });
  return `/api/google/gmail/attachment?${params.toString()}`;
}

// Download button with loading state
function DownloadButton({
  url,
  filename,
  variant = "icon",
}: {
  url: string;
  filename: string;
  variant?: "icon" | "badge";
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (variant === "badge") {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        title={isDownloading ? "Descargando..." : "Descargar"}
      >
        {isDownloading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      title={isDownloading ? "Descargando..." : "Descargar"}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </button>
  );
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
    <div className={cn("flex gap-2 sm:gap-3", isFromAgent ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar - hidden on mobile for cleaner look */}
      <Avatar className="hidden h-8 w-8 flex-shrink-0 sm:flex">
        {message.from.avatar ? (
          <AvatarImage src={message.from.avatar} alt={message.from.name} />
        ) : null}
        <AvatarFallback className={cn(
          "text-xs",
          isFromAgent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {getInitials(message.from.name)}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div className={cn("max-w-[85%] space-y-1 sm:max-w-[75%]", isFromAgent ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
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

        {/* Time and status */}
        <div className={cn("flex items-center gap-1 text-[10px] text-muted-foreground", isFromAgent && "justify-end")}>
          <span>{formattedDate} {formattedTime}</span>
          {isFromAgent ? (
            message.status === "sent" ? (
              <CheckCheck className="h-3 w-3 text-primary/60" />
            ) : (
              <Check className="h-3 w-3" />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Email-style message card with clear sender header
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
      {/* Email header with sender info */}
      <div className="flex items-start gap-3 border-b border-border/40 px-4 py-3">
        {isFromAgent ? (
          /* Distinct avatar for sent emails (from me) */
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
            <Send className="h-4 w-4" />
          </div>
        ) : (
          <Avatar className="h-9 w-9 flex-shrink-0">
            {message.from.avatar ? (
              <AvatarImage src={message.from.avatar} alt={message.from.name} />
            ) : null}
            <AvatarFallback className="bg-muted text-xs text-muted-foreground">
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
          {/* Show recipients if sent */}
          {isFromAgent && message.to && message.to.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Para: {message.to.map((r) => r.email).join(", ")}
            </p>
          ) : null}
          {/* Show CC if present */}
          {message.cc && message.cc.length > 0 ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cc: {message.cc.map((r) => r.email).join(", ")}
            </p>
          ) : null}
        </div>
      </div>

      {/* Email body */}
      <div className="px-4 py-3">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {message.content}
          </p>
        </div>
      </div>

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 ? (
        <div className="border-t border-border/40 px-4 py-3">
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
                  className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 transition-all hover:border-primary/40 hover:bg-muted/50"
                  onClick={() => onAttachmentClick?.(attachment, message.id)}
                >
                  <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">{attachment.name}</span>
                  {attachment.size ? (
                    <span className="text-[10px] text-muted-foreground">({attachment.size})</span>
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

// Wrapper that chooses the right layout based on channel
function MessageBubble({
  message,
  isFromAgent,
  channel,
  onAttachmentClick,
}: {
  message: ThreadMessage;
  isFromAgent: boolean;
  channel: "whatsapp" | "email";
  onAttachmentClick?: (attachment: InboxAttachment, messageId: string, senderContactId?: number) => void;
}) {
  // Wrap the callback to include the sender's contactId
  const handleAttachmentClick = onAttachmentClick
    ? (attachment: InboxAttachment, messageId: string) => {
        onAttachmentClick(attachment, messageId, message.from.contactId);
      }
    : undefined;

  if (channel === "email") {
    return <EmailCard message={message} isFromAgent={isFromAgent} onAttachmentClick={handleAttachmentClick} />;
  }
  return <ChatBubble message={message} isFromAgent={isFromAgent} onAttachmentClick={handleAttachmentClick} />;
}

export function InboxConversationView({
  thread,
  onToggleStar,
  onToggleRead,
  onDelete,
  onSendReply,
  onBack,
  showBackButton = false,
}: InboxConversationViewProps) {
  const [replyContent, setReplyContent] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [attachmentModalState, setAttachmentModalState] = useState<{
    attachment: InboxAttachment;
    messageId: string;
    senderContactId?: number;
  } | null>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
      if (file.size > 25 * 1024 * 1024) {
        continue;
      }
      newAttachments.push({
        file,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: formatFileSize(file.size),
      });
    }

    setPendingAttachments((prev) => [...prev, ...newAttachments]);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Remove pending attachment
  const removePendingAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Handle attachment click - open the action modal
  const handleAttachmentClick = useCallback((attachment: InboxAttachment, messageId: string, senderContactId?: number) => {
    console.log("[Message Detail] handleAttachmentClick - senderContactId:", senderContactId);
    setAttachmentModalState({ attachment, messageId, senderContactId });
  }, []);

  // Handle download from attachment modal
  const handleAttachmentDownload = useCallback(async (attachment: InboxAttachment) => {
    const downloadUrl = buildDownloadUrl(attachment);
    if (!downloadUrl) return;

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, []);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(",")[1] ?? "";
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  if (!thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-4 rounded-full bg-muted/50 p-4">
          <User className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Selecciona una conversacion</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige una conversacion de la lista para ver los mensajes.
        </p>
      </div>
    );
  }

  const handleSendReply = async () => {
    if (!replyContent.trim() && pendingAttachments.length === 0) return;

    setIsSending(true);
    try {
      // Convert pending attachments to EmailAttachment format
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

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(thread.id);
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get the main participant (not the agent)
  const mainParticipant = thread.participants.find((p) => p.id !== "agent") ?? thread.participants[0];

  // Get the linked contact ID (from threadContext or participant)
  const linkedContactId = thread.threadContext?.contactId ?? mainParticipant?.contactId;

  // Handler to navigate to contact page
  const handleContactClick = () => {
    if (linkedContactId) {
      router.push(`/contactos/${linkedContactId}`);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border/40 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="mr-1 md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : null}
            {linkedContactId ? (
              <button
                type="button"
                onClick={handleContactClick}
                className="rounded-full transition-opacity hover:opacity-80"
              >
                <Avatar className="h-10 w-10 cursor-pointer sm:h-12 sm:w-12">
                  {mainParticipant?.avatar ? (
                    <AvatarImage src={mainParticipant.avatar} alt={mainParticipant.name} />
                  ) : null}
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {getInitials(mainParticipant?.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                {mainParticipant?.avatar ? (
                  <AvatarImage src={mainParticipant.avatar} alt={mainParticipant.name} />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {getInitials(mainParticipant?.name ?? "?")}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                {linkedContactId ? (
                  <button
                    type="button"
                    onClick={handleContactClick}
                    className="truncate text-base font-semibold tracking-tight hover:underline sm:text-lg"
                  >
                    {mainParticipant?.name}
                  </button>
                ) : (
                  <h2 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                    {mainParticipant?.name}
                  </h2>
                )}
                {/* Channel badge - subtle sunset colors */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    thread.channel === "whatsapp"
                      ? "border-amber-200/60 bg-amber-50/50 text-amber-700/80"
                      : "border-rose-200/60 bg-rose-50/50 text-rose-700/80"
                  )}
                >
                  {thread.channel === "whatsapp" ? (
                    <MessageCircle className="h-2.5 w-2.5" />
                  ) : (
                    <Mail className="h-2.5 w-2.5" />
                  )}
                  {thread.channel === "whatsapp" ? "WhatsApp" : "Email"}
                </div>
              </div>
              <p className="hidden text-sm text-muted-foreground sm:block">
                {thread.channel === "whatsapp"
                  ? mainParticipant?.phone
                  : mainParticipant?.email}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {thread.messageCount} mensaje{thread.messageCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreenOpen(true)}
              className="text-muted-foreground"
              title="Expandir conversación"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleStar(thread.id)}
              className={cn(
                thread.starred ? "text-amber-500" : "text-muted-foreground"
              )}
            >
              <Star
                className={cn("h-4 w-4", thread.starred && "fill-current")}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleRead(thread.id)}
              className="text-muted-foreground"
            >
              <MailOpen className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Subject for emails */}
        {thread.subject ? (
          <h3 className="mt-4 text-xl font-semibold tracking-tight">
            {thread.subject}
          </h3>
        ) : null}
      </div>

      {/* Conversation - Messages */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {thread.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isFromAgent={message.from.id === "agent"}
              channel={thread.channel}
              onAttachmentClick={handleAttachmentClick}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Reply Section */}
      <div className="border-t border-border/40 p-3 sm:p-4">
        <div className="space-y-2 sm:space-y-3">
          {/* Pending Attachments */}
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

          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`Escribe un mensaje...`}
            className="min-h-[60px] resize-none sm:min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSendReply();
              }
            }}
          />
          <div className="flex items-center justify-between">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />

            {/* Attach button - only enabled for email */}
            <Button
              variant="ghost"
              size="sm"
              disabled={thread.channel !== "email"}
              onClick={() => fileInputRef.current?.click()}
              className="hidden sm:flex"
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Adjuntar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={thread.channel !== "email"}
              onClick={() => fileInputRef.current?.click()}
              className="sm:hidden"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              onClick={() => void handleSendReply()}
              disabled={isSending || (!replyContent.trim() && pendingAttachments.length === 0)}
              className={cn(
                thread.channel === "whatsapp"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-rose-600 hover:bg-rose-700"
              )}
            >
              <Send className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{isSending ? "Enviando..." : "Enviar"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar conversación?"
        description="El email se moverá a la papelera. Esta acción no se puede deshacer."
        isDeleting={isDeleting}
        confirmText="Eliminar"
        loadingText="Eliminando..."
      />

      {/* Attachment Action Modal */}
      <AttachmentActionModal
        isOpen={attachmentModalState !== null}
        onClose={() => setAttachmentModalState(null)}
        attachment={attachmentModalState?.attachment ?? null}
        messageId={attachmentModalState?.messageId ?? ""}
        threadContext={thread.threadContext}
        senderContactId={attachmentModalState?.senderContactId}
        onDownload={handleAttachmentDownload}
      />

      {/* Fullscreen Conversation Modal */}
      <ConversationFullscreenModal
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        thread={thread}
        onToggleStar={onToggleStar}
        onSendReply={onSendReply}
        onAttachmentClick={handleAttachmentClick}
      />
    </div>
  );
}
