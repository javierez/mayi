"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Star, Clock, Paperclip } from "lucide-react";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { InboxThread } from "./inbox-types";

// Subtle sunset color palette
const CHANNEL_COLORS = {
  whatsapp: "rgba(245, 158, 11, 0.6)", // Amber
  email: "rgba(244, 63, 94, 0.5)", // Rose
} as const;

interface InboxThreadItemProps {
  thread: InboxThread;
  isSelected: boolean;
  onSelect: () => void;
  onToggleStar: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function InboxThreadItem({
  thread,
  isSelected,
  onSelect,
  onToggleStar,
}: InboxThreadItemProps) {
  const timeAgo = formatDistanceToNow(thread.lastMessageAt, {
    addSuffix: true,
    locale: es,
  }).replace("alrededor de ", "");

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleStar();
  };

  // Get the main participant (not the agent)
  const mainParticipant = thread.participants.find((p) => p.id !== "agent") ?? thread.participants[0];

  // Check if thread has attachments
  const hasAttachments = thread.messages.some((m) => m.attachments && m.attachments.length > 0);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex cursor-pointer items-start gap-2 border-b border-border/40 p-3 transition-all duration-200 sm:gap-3 sm:p-4",
        isSelected && "bg-accent",
        !thread.read && "border-l-[3px] border-l-gray-400 bg-gray-50/50 dark:border-l-gray-500 dark:bg-gray-800/30",
        thread.read && "border-l-[3px] border-l-transparent",
        !isSelected && "hover:bg-accent/50"
      )}
    >
      {/* Color indicator - subtle sunset colors */}
      <div
        className="mt-1 h-8 w-1 flex-shrink-0 rounded-full sm:h-10"
        style={{ background: CHANNEL_COLORS[thread.channel] }}
      />

      {/* Avatar */}
      <Avatar className="h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10">
        {mainParticipant?.avatar ? (
          <AvatarImage src={mainParticipant.avatar} alt={mainParticipant.name} />
        ) : null}
        <AvatarFallback className="bg-muted text-xs text-muted-foreground sm:text-sm">
          {getInitials(mainParticipant?.name ?? "?")}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-0.5">
        {/* Name and time */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              !thread.read
                ? "font-semibold text-gray-900 dark:text-gray-100"
                : "font-medium text-gray-600 dark:text-gray-400"
            )}
            title={mainParticipant?.name}
          >
            {(mainParticipant?.name ?? "").length > 18
              ? `${(mainParticipant?.name ?? "").slice(0, 18)}...`
              : mainParticipant?.name}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Subject (for emails) */}
        {thread.subject ? (
          <p
            className={cn(
              "line-clamp-1 text-sm",
              !thread.read
                ? "font-medium text-gray-800 dark:text-gray-200"
                : "text-gray-500 dark:text-gray-500"
            )}
            title={thread.subject}
          >
            {thread.subject}
          </p>
        ) : null}

        {/* Snippet/Preview - only for WhatsApp (emails have subject) */}
        {thread.channel === "whatsapp" ? (
          <p className="line-clamp-1 text-xs text-muted-foreground" title={thread.snippet}>
            {thread.snippet}
          </p>
        ) : null}

        {/* Bottom row: attachments and star */}
        <div className="flex items-center gap-2 pt-1">
          {/* Attachments indicator */}
          {hasAttachments ? (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Paperclip className="h-2.5 w-2.5" />
            </div>
          ) : null}

          {/* Star button */}
          <button
            onClick={handleStarClick}
            className={cn(
              "ml-auto transition-all duration-200",
              thread.starred
                ? "text-amber-500"
                : "text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-amber-500"
            )}
          >
            <Star
              className={cn("h-4 w-4", thread.starred && "fill-current")}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
