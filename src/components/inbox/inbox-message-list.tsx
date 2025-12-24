"use client";

import { SearchX } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { InboxThreadItem } from "./inbox-message-item";
import type { InboxThread } from "./inbox-types";

interface InboxThreadListProps {
  threads: InboxThread[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onToggleStar: (threadId: string) => void;
}

export function InboxThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  onToggleStar,
}: InboxThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-4 rounded-full bg-muted/50 p-4">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Sin conversaciones</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          No se encontraron conversaciones con los filtros actuales.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div>
        {threads.map((thread) => (
          <InboxThreadItem
            key={thread.id}
            thread={thread}
            isSelected={selectedThreadId === thread.id}
            onSelect={() => onSelectThread(thread.id)}
            onToggleStar={() => onToggleStar(thread.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
