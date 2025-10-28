export function ActivitySkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Navigation Cards Skeleton */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Visits KPI Card Skeleton */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3 h-5 w-24 animate-pulse rounded bg-gray-200"></div>
              <div className="flex items-baseline gap-4">
                <div className="h-10 w-16 animate-pulse rounded bg-gray-200"></div>
                <div className="space-y-1">
                  <div className="h-3 w-32 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-3 w-28 animate-pulse rounded bg-gray-200"></div>
                </div>
              </div>
            </div>
            <div className="h-10 w-10 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>

        {/* Contacts KPI Card Skeleton */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3 h-5 w-24 animate-pulse rounded bg-gray-200"></div>
              <div className="flex items-baseline gap-4">
                <div className="h-10 w-16 animate-pulse rounded bg-gray-200"></div>
                <div className="space-y-1">
                  <div className="h-3 w-32 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-3 w-28 animate-pulse rounded bg-gray-200"></div>
                </div>
              </div>
            </div>
            <div className="h-10 w-10 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="space-y-4">
        {/* Filter Button Skeleton */}
        <div className="flex justify-end">
          <div className="h-9 w-24 animate-pulse rounded-md bg-gray-200"></div>
        </div>

        {/* List Items Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-2.5"
            >
              <div className="pr-28">
                {/* Name and timestamp */}
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
                </div>

                {/* Contact info */}
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-3 w-32 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-2 w-1 animate-pulse rounded-full bg-gray-200"></div>
                  <div className="h-3 w-3 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
                </div>
              </div>

              {/* Badge - Top right */}
              <div className="absolute right-2 top-2">
                <div className="h-5 w-[120px] animate-pulse rounded-full bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ActivityKPICardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-3 h-5 w-24 animate-pulse rounded bg-gray-200"></div>
          <div className="flex items-baseline gap-4">
            <div className="h-10 w-16 animate-pulse rounded bg-gray-200"></div>
            <div className="space-y-1">
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200"></div>
              <div className="h-3 w-28 animate-pulse rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
        <div className="h-10 w-10 animate-pulse rounded bg-gray-200"></div>
      </div>
    </div>
  );
}

export function CompactContactCardSkeleton() {
  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-2.5">
      <div className="pr-28">
        {/* Name and timestamp */}
        <div className="mb-1 flex items-center gap-2">
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200"></div>
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
        </div>

        {/* Contact info */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 animate-pulse rounded bg-gray-200"></div>
          <div className="h-3 w-32 animate-pulse rounded bg-gray-200"></div>
          <div className="h-2 w-1 animate-pulse rounded-full bg-gray-200"></div>
          <div className="h-3 w-3 animate-pulse rounded bg-gray-200"></div>
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
        </div>
      </div>

      {/* Badge - Top right */}
      <div className="absolute right-2 top-2">
        <div className="h-5 w-[120px] animate-pulse rounded-full bg-gray-200"></div>
      </div>
    </div>
  );
}

export function AppointmentCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2.5">
      <div className="flex items-start gap-3">
        {/* Time section */}
        <div className="flex-shrink-0">
          <div className="mb-1 h-4 w-16 animate-pulse rounded bg-gray-200"></div>
          <div className="h-3 w-12 animate-pulse rounded bg-gray-200"></div>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch bg-gray-200"></div>

        {/* Content section */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
            <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200"></div>
          </div>
          <div className="mb-1 h-3 w-40 animate-pulse rounded bg-gray-200"></div>
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}
