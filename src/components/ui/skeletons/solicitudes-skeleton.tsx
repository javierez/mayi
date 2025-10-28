export function SolicitudesCardSkeleton() {
  return (
    <div className="border-gray-200 bg-white rounded-lg border p-4">
      {/* Header with title and date */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Characteristics row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Budget */}
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="h-4 w-px bg-gray-200"></div>

            {/* Square meters */}
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="h-4 w-px bg-gray-200"></div>

            {/* Beds and Baths */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div className="h-5 w-28 bg-gray-200 rounded-full animate-pulse"></div>
        </div>

        {/* Locations */}
        <div className="flex items-start gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mt-0.5"></div>
          <div className="flex flex-wrap gap-1">
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Notes section */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <div className="h-3 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
        <div className="h-3 w-4/5 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

export function SolicitudesSkeleton() {
  return (
    <div className="relative border-gray-200 bg-white rounded-lg border p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-9 w-36 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Grid of cards */}
      <div className="mb-6 space-y-3">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <SolicitudesCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
