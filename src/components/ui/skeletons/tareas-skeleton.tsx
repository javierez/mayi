import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";

export function TareasSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with title and button - matching the real component */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold sm:text-xl">Tareas</h3>
        <div className="flex items-center gap-3">
          <Button className="flex h-8 items-center gap-2 text-sm" disabled>
            <Plus className="h-4 w-4" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Task list skeleton */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative rounded-xl bg-white p-3 shadow-md sm:p-4"
          >
            {/* User avatar - top right */}
            <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
              <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200 ring-2 ring-gray-100 sm:h-7 sm:w-7"></div>
            </div>

            {/* Task content */}
            <div className="pr-8 sm:pr-10">
              {/* Checkbox and title */}
              <div className="mb-2 flex items-center gap-2 sm:gap-3">
                <div className="h-5 w-5 animate-pulse rounded-md bg-gray-200"></div>
                <div className="h-4 w-40 animate-pulse rounded bg-gray-200"></div>
              </div>

              {/* Description */}
              <div className="mb-3 ml-6 sm:ml-8">
                <div className="mb-2 h-3 w-full animate-pulse rounded bg-gray-200"></div>
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200"></div>
              </div>

              {/* Related items badges */}
              <div className="mb-1 ml-6 flex flex-wrap items-center gap-2 sm:ml-8">
                <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200"></div>
                <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200"></div>
              </div>
            </div>

            {/* Action buttons - bottom right */}
            <div className="absolute bottom-1 right-1 flex items-center gap-1 sm:bottom-2 sm:right-2">
              <div className="h-6 w-6 animate-pulse rounded-lg bg-gray-200 sm:h-7 sm:w-7"></div>
              <div className="h-6 w-6 animate-pulse rounded-lg bg-gray-200 sm:h-7 sm:w-7"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
