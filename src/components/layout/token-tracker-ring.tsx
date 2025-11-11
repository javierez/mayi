"use client";

import { useState, useEffect } from "react";
import { cn } from "~/lib/utils";

interface TokenTrackerRingProps {
  className?: string;
}

export function TokenTrackerRing({ className }: TokenTrackerRingProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tokensRemaining, setTokensRemaining] = useState(10000);
  const [tokensTotal] = useState(10000);
  const [isLoading, setIsLoading] = useState(true);
  const gradientId = `token-gradient-${Math.random().toString(36).slice(2, 11)}`;

  const percentage = (tokensRemaining / tokensTotal) * 100;

  // Calculate stroke-dashoffset for the progress ring (inverse for countdown)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Fetch token balance from API
  useEffect(() => {
    setMounted(true);

    const fetchTokenBalance = async () => {
      try {
        const response = await fetch("/api/account/tokens", {
          cache: "no-store", // Always get fresh data
        });

        if (!response.ok) {
          console.error("Failed to fetch token balance");
          setIsLoading(false);
          return;
        }

        const result = (await response.json()) as {
          success: boolean;
          data?: {
            currentBalance: number;
            tokensUsed: number;
            totalTokens: number;
          };
        };

        if (result.success && result.data) {
          setTokensRemaining(result.data.currentBalance);
          console.log("✅ Token balance loaded:", result.data.currentBalance);
        }
      } catch (error) {
        console.error("Error fetching token balance:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTokenBalance();

    // Poll for updates every 10 seconds to catch token changes
    const interval = setInterval(() => {
      void fetchTokenBalance();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center py-8",
          className,
        )}
      >
        <div className="h-32 w-32 animate-pulse rounded-full bg-gray-200" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-visible p-12 transition-all duration-500",
        className,
      )}
    >
      {/* Ring container - allows overflow and doesn't clip shadows */}
      <div className="relative">
        <div
          className="relative h-32 w-32 cursor-pointer overflow-visible transition-transform duration-300 hover:scale-105"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
        {/* Add Credits Button - Subtle plus icon on top right */}
        <button
          onClick={() => {
            console.log("🎯 Add credits clicked (mock)");
            // TODO: Implement add credits functionality
          }}
          className="group absolute -right-1 -top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 shadow-sm transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-400 hover:to-rose-400 hover:text-white hover:shadow-lg hover:scale-110"
          title="Añadir créditos"
        >
          <svg
            className="h-3.5 w-3.5 transition-transform group-hover:rotate-90"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {/* Percentage text and remaining tokens in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="font-mono text-lg font-bold leading-none tracking-wider text-gray-700">
              {Math.round(percentage)}<span className="text-sm">%</span>
            </span>
            <span className="mt-0.5 text-[9px] font-medium text-gray-400">
              {tokensRemaining.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
            </span>
          </div>
        </div>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          {/* Background ring (gray) */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Gradient definition - must be before the circle that uses it */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
          {/* Progress ring (gradient) */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: isHovered
                ? "drop-shadow(0 0 6px rgba(251, 146, 60, 0.6))"
                : "none",
            }}
          />
        </svg>
        </div>
      </div>
    </div>
  );
}
