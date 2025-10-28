import React from "react";

interface MiniEnergyCertificateProps {
  energyRating: string;
  className?: string;
}

export const MiniEnergyCertificate: React.FC<MiniEnergyCertificateProps> = ({
  energyRating,
  className = "",
}) => {
  const getEnergyRatingColor = (rating: string): string => {
    const baseColors = {
      A: "#22c55e", // green-500
      B: "#4ade80", // green-400
      C: "#facc15", // yellow-400
      D: "#eab308", // yellow-500
      E: "#fb923c", // orange-400
      F: "#f97316", // orange-500
      G: "#ef4444", // red-500
    };
    return (
      baseColors[rating.toUpperCase() as keyof typeof baseColors] || "#6b7280"
    );
  };

  const getArrowWidth = (rating: string): string => {
    const widths = {
      A: "40px", // Double the width for wider display
      B: "44px",
      C: "48px",
      D: "52px",
      E: "56px",
      F: "60px",
      G: "64px",
    };
    return widths[rating.toUpperCase() as keyof typeof widths] || "48px";
  };

  const ratings = ["A", "B", "C", "D", "E", "F", "G"];

  return (
    <div className={`flex flex-col items-start -space-y-1.5 ${className}`}>
      {/* All Energy Rating Arrows */}
      {ratings.map((rating) => {
        const isSelected = rating === energyRating.toUpperCase();
        const backgroundColor = isSelected
          ? getEnergyRatingColor(rating)
          : "#e5e7eb"; // gray-200 for unselected
        const arrowWidth = getArrowWidth(rating);

        return (
          <div key={rating} className="flex items-center">
            {/* Letter - Outside to the left, bigger */}
            <div
              className="mr-1 flex h-4 w-4 items-center justify-center text-sm font-bold"
              style={{
                color: isSelected ? getEnergyRatingColor(rating) : "#9ca3af", // Colored when selected, gray when not
              }}
            >
              {isSelected ? rating : ""}
            </div>

            {/* Arrow - Fixed width, left aligned */}
            <div
              className="h-2 rounded-sm"
              style={{
                backgroundColor,
                width: arrowWidth,
                clipPath:
                  "polygon(0 0, calc(100% - 4px) 0, 100% 50%, calc(100% - 4px) 100%, 0 100%)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
