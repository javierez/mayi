export function CommentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* New comment form skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex space-x-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200"></div>
          <div className="flex-1">
            <div className="mb-3 h-20 w-full animate-pulse rounded-md bg-gray-200"></div>
            <div className="flex justify-end">
              <div className="h-8 w-24 animate-pulse rounded-md bg-gray-200"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments list skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex space-x-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200"></div>
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-gray-50 px-4 py-3">
                  <div className="mb-2 flex items-center space-x-2">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-3 w-16 animate-pulse rounded bg-gray-200"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-gray-200"></div>
                    <div className="h-3 w-4/5 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200"></div>
                  </div>
                </div>

                {/* Some comments have replies */}
                {i % 2 === 0 && (
                  <div className="ml-8 mt-3 space-y-3">
                    <div className="flex space-x-3">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200"></div>
                      <div className="min-w-0 flex-1">
                        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                          <div className="mb-2 flex items-center space-x-2">
                            <div className="h-3 w-16 animate-pulse rounded bg-gray-200"></div>
                            <div className="h-3 w-12 animate-pulse rounded bg-gray-200"></div>
                          </div>
                          <div className="space-y-1">
                            <div className="h-3 w-full animate-pulse rounded bg-gray-200"></div>
                            <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommentItemSkeleton({
  isReply = false,
}: {
  isReply?: boolean;
}) {
  return (
    <div className={`${isReply ? "ml-12 pl-4" : ""}`}>
      <div className="flex space-x-3">
        <div
          className={`${isReply ? "h-8 w-8" : "h-10 w-10"} animate-pulse rounded-full bg-gray-200`}
        ></div>
        <div className="min-w-0 flex-1">
          <div
            className={`rounded-2xl px-4 py-3 ${
              isReply ? "bg-white shadow-sm" : "bg-gray-50 shadow-md"
            }`}
          >
            <div className="mb-2 flex items-center space-x-2 pr-16">
              <div
                className={`${isReply ? "h-3 w-16" : "h-4 w-20"} animate-pulse rounded bg-gray-200`}
              ></div>
              <div
                className={`${isReply ? "h-2 w-12" : "h-3 w-16"} animate-pulse rounded bg-gray-200`}
              ></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-gray-200"></div>
              <div className="h-3 w-4/5 animate-pulse rounded bg-gray-200"></div>
              {!isReply && (
                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200"></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
