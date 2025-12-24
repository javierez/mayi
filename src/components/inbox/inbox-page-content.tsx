"use client";

import { useState } from "react";
import { Search, Plus, CheckCheck, MessageCircle, Mail, Home, ExternalLink } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { useInbox } from "~/hooks/use-inbox";
import { InboxThreadList } from "./inbox-message-list";
import { InboxConversationView } from "./inbox-message-detail";
import { InboxComposeDialog } from "./inbox-compose-dialog";
import type { InboxFilter } from "./inbox-types";

export function InboxPageContent() {
  const {
    threads,
    selectedThread,
    selectedThreadId,
    filter,
    searchQuery,
    isComposeOpen,
    unreadCounts,
    selectThread,
    setFilter,
    setSearchQuery,
    toggleRead,
    toggleStarred,
    markAllAsRead,
    deleteThread,
    sendReply,
    sendMessage,
    openCompose,
    closeCompose,
  } = useInbox();

  // Mobile: show detail view when thread is selected
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const handleSelectThread = (threadId: string) => {
    selectThread(threadId);
    setShowMobileDetail(true);
  };

  const handleBackToList = () => {
    setShowMobileDetail(false);
  };

  const handleFilterChange = (newFilter: InboxFilter) => {
    setFilter(newFilter);
  };

  return (
    <div className="space-y-4">
      {/* Header - matching contactos/propiedades pattern */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Bandeja de entrada
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCounts.all} conversacion{unreadCounts.all !== 1 ? "es" : ""} sin leer
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversaciones..."
              className="pl-10"
            />
          </div>

          {/* Mark all as read */}
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="hidden shadow-md sm:flex"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Marcar todo como leido</span>
          </Button>

          {/* Compose button */}
          <Button onClick={openCompose} className="flex-1 shadow-md sm:flex-none">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo mensaje</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Filter toggles - colorless */}
      <div className="inline-flex items-center rounded-2xl border border-border/60 bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => handleFilterChange("all")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
            filter === "all"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Todos
          {unreadCounts.all > 0 ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {unreadCounts.all}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => handleFilterChange("whatsapp")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
            filter === "whatsapp"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
          {unreadCounts.whatsapp > 0 ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {unreadCounts.whatsapp}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => handleFilterChange("email")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
            filter === "email"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">Email</span>
          {unreadCounts.email > 0 ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {unreadCounts.email}
            </span>
          ) : null}
        </button>
      </div>

      {/* Main content - Card with split view */}
      <Card className="flex h-[calc(100vh-13rem)] overflow-hidden sm:h-[calc(100vh-14rem)] lg:h-[calc(100vh-16rem)]">
        {/* Thread List - Hidden on mobile when detail is shown */}
        <div
          className={cn(
            "w-full border-r border-border/40 md:w-[320px] lg:w-[380px] lg:flex-shrink-0",
            showMobileDetail && "hidden md:block"
          )}
        >
          <InboxThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            onSelectThread={handleSelectThread}
            onToggleStar={toggleStarred}
          />
        </div>

        {/* Conversation View - Hidden on mobile when list is shown */}
        <div
          className={cn(
            "flex-1 bg-muted/20",
            !showMobileDetail && "hidden md:block"
          )}
        >
          <InboxConversationView
            thread={selectedThread}
            onToggleStar={toggleStarred}
            onToggleRead={toggleRead}
            onDelete={deleteThread}
            onSendReply={sendReply}
            onBack={handleBackToList}
            showBackButton={showMobileDetail}
          />
        </div>
      </Card>

      {/* Compose Dialog */}
      <InboxComposeDialog
        isOpen={isComposeOpen}
        onClose={closeCompose}
        onSend={sendMessage}
      />
    </div>
  );
}
