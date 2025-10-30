"use client";

import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import type { ListingActivityRecord } from "~/server/queries/listing-history";
import {
  getActivityActionLabel,
  getActivityActionColor,
  getActivityActionIcon,
  formatActivitySummary,
  formatRelativeTime,
} from "~/lib/formatters/activity-formatter";

interface ActivityCardProps {
  activity: ListingActivityRecord;
  onClick: () => void;
}

export function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const Icon = getActivityActionIcon(activity.action);
  const actionLabel = getActivityActionLabel(activity.action);
  const colorVariant = getActivityActionColor(activity.action);
  const summary = formatActivitySummary(activity.action, activity.details);
  const relativeTime = formatRelativeTime(activity.createdAt);

  // Get user initials for avatar
  const userInitials = activity.user?.name
    ? activity.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <Badge variant={colorVariant} className="shrink-0">
                {actionLabel}
              </Badge>
              <span className="text-xs text-muted-foreground shrink-0">
                {relativeTime}
              </span>
            </div>

            <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
              {summary}
            </p>

            {/* User info */}
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {activity.user?.name ?? "Usuario desconocido"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
