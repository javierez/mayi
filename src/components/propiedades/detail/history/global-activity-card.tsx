"use client";

import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import type { ListingActivityRecord } from "~/server/queries/listing-history";
import type { ContactActivityWithUser } from "~/server/queries/contact-activity";
import type { ListingContactActivityWithUser } from "~/server/queries/listing-contact-activity";
import {
  getActivityActionLabel,
  getActivityActionColor,
  getActivityActionIcon,
  formatActivitySummary,
  formatRelativeTime,
  type AllActivityAction,
} from "~/lib/formatters/activity-formatter";

// Union type for all activity types
type AllActivityRecord =
  | (ListingActivityRecord & { listingTitle: string; referenceNumber: string | null; activityType: 'listing' })
  | (ContactActivityWithUser & { activityType: 'contact'; contactName: string; contactId: bigint })
  | (ListingContactActivityWithUser & { activityType: 'listing_contact'; contactName: string; contactId: bigint; listingId: bigint | null });

interface GlobalActivityCardProps {
  activity: AllActivityRecord;
  onClick: () => void;
}

export function GlobalActivityCard({ activity, onClick }: GlobalActivityCardProps) {
  const Icon = getActivityActionIcon(activity.action as AllActivityAction);
  const actionLabel = getActivityActionLabel(activity.action as AllActivityAction);
  const colorVariant = getActivityActionColor(activity.action as AllActivityAction);
  const summary = formatActivitySummary(activity.action as AllActivityAction, activity.details);
  const relativeTime = formatRelativeTime(activity.createdAt);

  // Get user initials for avatar
  const userInitials = activity.user?.name
    ? activity.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (activity.user && "firstName" in activity.user && "lastName" in activity.user && activity.user.firstName && activity.user.lastName)
      ? `${activity.user.firstName[0]}${activity.user.lastName[0]}`.toUpperCase()
      : "??";

  // Render reference line based on activity type
  const renderReference = () => {
    if (activity.activityType === 'listing') {
      return (
        <Link
          href={`/propiedades/${activity.listingId}`}
          className="text-[10px] text-muted-foreground hover:text-foreground hover:underline mb-0.5 block"
          onClick={(e) => e.stopPropagation()}
        >
          {activity.referenceNumber ?? `#${activity.listingId}`} · {activity.listingTitle}
        </Link>
      );
    }

    if (activity.activityType === 'contact') {
      return (
        <Link
          href={`/contactos/${activity.contactId}`}
          className="text-[10px] text-muted-foreground hover:text-foreground hover:underline mb-0.5 block"
          onClick={(e) => e.stopPropagation()}
        >
          {activity.contactName}
        </Link>
      );
    }

    // listing_contact
    return (
      <div className="text-[10px] text-muted-foreground mb-0.5">
        <Link
          href={`/contactos/${activity.contactId}`}
          className="hover:text-foreground hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {activity.contactName}
        </Link>
        {activity.listingId && activity.property && (
          <>
            {" · "}
            <Link
              href={`/propiedades/${activity.listingId}`}
              className="hover:text-foreground hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {activity.property.referenceNumber ?? `#${activity.listingId}`} · {activity.property.title ?? 'Propiedad'}
            </Link>
          </>
        )}
      </div>
    );
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Reference line - contact or property */}
            {renderReference()}

            {/* Summary */}
            <p className="text-sm font-medium text-foreground line-clamp-2 pr-8">
              {summary}
            </p>
          </div>

          {/* Date, Badge and Avatar in top right */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {relativeTime}
            </span>
            <Badge variant={colorVariant} className="text-[10px] px-2 py-0.5">
              {actionLabel}
            </Badge>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
