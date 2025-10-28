"use client";

import React from "react";
import { cn } from "~/lib/utils";

interface GradientTitleProps {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function GradientTitle({
  children,
  subtitle,
  className,
  size = "lg",
}: GradientTitleProps) {
  const sizeClasses = {
    sm: "text-2xl md:text-3xl",
    md: "text-3xl md:text-4xl",
    lg: "text-4xl md:text-6xl",
    xl: "text-5xl md:text-7xl",
  };

  return (
    <div className={cn("text-center", className)}>
      <h1
        className={cn(
          "bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text font-bold leading-tight text-transparent",
          "animate-in slide-in-from-bottom-4 duration-700",
          sizeClasses[size],
        )}
      >
        {children}
      </h1>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-lg font-medium text-gray-600 md:text-xl",
            "animate-in slide-in-from-bottom-6 delay-150 duration-700",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
