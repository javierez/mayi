"use client";

import { type ChangelogEntry } from "~/lib/changelog-data";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { Play } from "lucide-react";

interface LaunchCardProps {
  entry: ChangelogEntry;
  onClick: () => void;
}

export function LaunchCard({ entry, onClick }: LaunchCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!hasPlayed) {
      // First time clicking play - switch to video and start playing
      setHasPlayed(true);
      setIsPlaying(true);
    } else if (videoRef.current) {
      // Subsequent clicks - toggle play/pause
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        void videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Auto-play video when it loads for the first time
  React.useEffect(() => {
    if (hasPlayed && videoRef.current && isPlaying) {
      void videoRef.current.play();
    }
  }, [hasPlayed, isPlaying]);

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer rounded-xl bg-gradient-to-br from-amber-50 via-white to-rose-50 p-8 h-full min-h-[350px] flex flex-col items-center justify-center"
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br from-amber-300/20 to-rose-300/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gradient-to-br from-rose-300/20 to-amber-300/20 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        {/* Vesta Logo */}
        <div className="relative h-32 w-32 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-xl transition-all duration-300 p-4">
          <Image
            src="/vestazoomin.jpeg"
            alt="Vesta Logo"
            fill
            className="object-contain p-2"
            priority
          />
        </div>

        {/* Title */}
        <div>
          <h3 className="text-sm font-bold font-mono tracking-widest uppercase bg-gradient-to-r from-amber-600 via-amber-500 to-rose-600 bg-clip-text text-transparent">
            {entry.title}
          </h3>
        </div>

        {/* Video */}
        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100">
          {!hasPlayed ? (
            <>
              <Image
                src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/marketing/first_week_poster.jpg"
                alt="Video preview"
                fill
                className="object-cover scale-150 brightness-110"
              />
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/20"
              >
                <Play className="h-12 w-12 text-white opacity-80" />
              </button>
            </>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover scale-150 brightness-110"
                loop
                muted
                playsInline
              >
                <source
                  src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/marketing/first_week.MOV"
                  type="video/mp4"
                />
              </video>
              {!isPlaying && (
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/20"
                >
                  <Play className="h-12 w-12 text-white opacity-80" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
