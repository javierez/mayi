import { cn } from "~/lib/utils";
import type { ProcessStage } from "~/lib/constants/process-stages";

interface ProgressBarDisplayProps {
  processStages: ProcessStage[];
  progressPercent: number;
  substagePercentages: Record<string, number>;
  compact?: boolean;
}

export function ProgressBarDisplay({
  processStages,
  progressPercent,
  substagePercentages,
  compact = false,
}: ProgressBarDisplayProps) {
  // Calculate total substages for the bar (excluding the last one)
  const totalSubstages = processStages.reduce(
    (acc, stage) => acc + stage.subStages.length,
    0,
  );
  const totalSubstagesForBar = totalSubstages - 1;

  const barHeight = compact ? "h-6" : "h-10";
  const labelSize = compact ? "text-[8px]" : "text-[9px] sm:text-[11px]";
  const labelSpacing = compact
    ? "bottom-[calc(100%+0.25rem)]"
    : "bottom-[calc(100%+0.5rem)] sm:bottom-[calc(100%+0.625rem)]";
  const labelSpacingBelow = compact
    ? "top-[calc(100%+0.25rem)]"
    : "top-[calc(100%+0.5rem)] sm:top-[calc(100%+0.625rem)]";
  const lastLabelSpacing = compact
    ? "bottom-[calc(100%+0.375rem)]"
    : "bottom-[calc(100%+0.75rem)] sm:bottom-[calc(100%+1rem)]";
  const lastLabelSpacingBelow = compact
    ? "top-[calc(100%+0.375rem)]"
    : "top-[calc(100%+0.75rem)] sm:top-[calc(100%+1rem)]";

  return (
    <div className={cn("relative", compact ? "my-8" : "my-10")}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full border border-gray-200/50 bg-gradient-to-br from-gray-100 to-gray-50 shadow-inner",
          barHeight,
        )}
      >
        {/* Completed section */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-400 via-amber-500 to-rose-400 transition-all duration-700 ease-out"
          style={{
            width: `${progressPercent}%`,
          }}
        >
          {/* Shimmer overlay */}
          {progressPercent > 0 && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>
          )}
        </div>

        {/* Vertical dividers (excluding last cell) */}
        <div className="absolute inset-0 flex">
          {processStages.map((stage, stageIndex) => {
            return stage.subStages.map((substage, subIndex) => {
              const globalIndex =
                processStages
                  .slice(0, stageIndex)
                  .reduce((acc, s) => acc + s.subStages.length, 0) + subIndex;
              const isLastCell = globalIndex === totalSubstages - 1;
              const isSecondToLast = globalIndex === totalSubstages - 2;

              // Don't render the last cell
              if (isLastCell) return null;

              // Each cell has equal width
              const cellWidth = 100 / totalSubstagesForBar;

              return (
                <div
                  key={substage.id}
                  className="relative"
                  style={{ width: `${cellWidth}%` }}
                >
                  {/* Don't render divider for the last rendered cell */}
                  {!isSecondToLast && (
                    <div className="absolute right-0 top-1/2 h-[60%] w-[2px] -translate-y-1/2 bg-white" />
                  )}
                </div>
              );
            });
          })}
        </div>
      </div>

      {/* Milestone labels at dividers */}
      <div className="pointer-events-none absolute inset-0">
        {/* Labels for all substages except the last */}
        <div className="absolute inset-0 flex">
          {processStages.map((stage, stageIndex) => {
            return stage.subStages.map((substage, subIndex) => {
              const globalIndex =
                processStages
                  .slice(0, stageIndex)
                  .reduce((acc, s) => acc + s.subStages.length, 0) + subIndex;
              const isFirst = globalIndex === 0;
              const isLast = globalIndex === totalSubstages - 1;
              const labelPosition = globalIndex % 2 === 0 ? "above" : "below";

              // Check if this milestone would be reached at this stage percentage
              const substagePercentage = substagePercentages[substage.id] ?? 0;
              const isReached = substagePercentage <= progressPercent;

              // Don't render the last label here
              if (isLast) return null;

              // Each cell has equal width
              const cellWidth = 100 / totalSubstagesForBar;

              return (
                <div
                  key={substage.id}
                  className="relative"
                  style={{ width: `${cellWidth}%` }}
                >
                  {/* First label */}
                  {isFirst && (
                    <div
                      className={cn(
                        "absolute left-0 flex items-center gap-1.5 whitespace-nowrap font-semibold uppercase tracking-wider",
                        labelSize,
                        labelPosition === "above" ? labelSpacing : labelSpacingBelow,
                        isReached ? "text-gray-800" : "text-gray-400",
                      )}
                    >
                      {substage.label}
                    </div>
                  )}

                  {/* All other labels (except first and last) */}
                  {!isFirst && (
                    <div
                      className={cn(
                        "absolute left-0 flex items-center gap-1.5 whitespace-nowrap font-semibold uppercase tracking-wider",
                        labelSize,
                        labelPosition === "above" ? labelSpacing : labelSpacingBelow,
                        isReached ? "text-gray-800" : "text-gray-400",
                      )}
                      style={{
                        transform: "translateX(-50%)",
                      }}
                    >
                      {substage.label}
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>

        {/* Last label (Cierre) at the right edge */}
        {(() => {
          const lastStage = processStages[processStages.length - 1];
          const lastSubstage =
            lastStage?.subStages[lastStage.subStages.length - 1];
          if (!lastSubstage) return null;

          const lastGlobalIndex = totalSubstages - 1;
          const labelPosition = lastGlobalIndex % 2 === 0 ? "above" : "below";
          const substagePercentage = substagePercentages[lastSubstage.id] ?? 0;
          const isReached = substagePercentage <= progressPercent;

          return (
            <div
              className={cn(
                "absolute right-0 whitespace-nowrap font-semibold uppercase tracking-wider",
                labelSize,
                labelPosition === "above"
                  ? lastLabelSpacing
                  : lastLabelSpacingBelow,
                isReached ? "text-gray-800" : "text-gray-400",
              )}
            >
              {lastSubstage.label}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
