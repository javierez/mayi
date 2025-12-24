import { Skeleton } from "~/components/ui/skeleton";
import { Card } from "~/components/ui/card";

export default function InboxLoading() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="hidden h-10 w-40 sm:block" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Content skeleton */}
      <Card className="flex h-[calc(100vh-16rem)] overflow-hidden">
        {/* Message list skeleton */}
        <div className="w-full border-r border-border/40 lg:w-[380px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 border-b border-border/40 p-4">
              <Skeleton className="h-10 w-1 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail skeleton */}
        <div className="hidden flex-1 bg-muted/20 lg:block">
          <div className="border-b border-border/40 p-4">
            <div className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="mt-4 h-7 w-64" />
          </div>
          <div className="p-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Card>
    </div>
  );
}
