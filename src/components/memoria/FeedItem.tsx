"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Music,
  MapPin,
  Volume2,
  VolumeX,
  Quote,
} from "lucide-react";
import type { FeedItem as FeedItemType } from "~/server/queries/memoria/feed";

interface FeedItemProps {
  item: FeedItemType;
  isActive: boolean;
  shouldPreload: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function FeedItem({ item, isActive, shouldPreload, isMuted, onToggleMute }: FeedItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullyBuffered, setIsFullyBuffered] = useState(false); // Video is 100% downloaded
  const [bufferProgress, setBufferProgress] = useState(0); // 0-100%
  const isActiveRef = useRef(isActive);
  const { memory, dayNote, pinnedQuote, song, location, date } = item;

  // Keep ref in sync
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Format date
  const formattedDate = new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Play video helper
  const playVideo = useCallback(() => {
    if (videoRef.current && isActiveRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Retry after a short delay if autoplay fails
          setTimeout(() => {
            if (videoRef.current && isActiveRef.current) {
              videoRef.current.play().catch(() => {});
            }
          }, 100);
        });
      }
    }
  }, []);

  // Handle video playback and preloading
  useEffect(() => {
    if (videoRef.current) {
      if (isActive && isFullyBuffered) {
        playVideo();
      } else if (!isActive) {
        videoRef.current.pause();
        if (!shouldPreload) {
          videoRef.current.currentTime = 0;
        }
      }
    }
  }, [isActive, isFullyBuffered, shouldPreload, playVideo]);

  // Preload video when shouldPreload becomes true
  useEffect(() => {
    if (shouldPreload && memory.type === "video" && videoRef.current) {
      videoRef.current.preload = "auto";
      videoRef.current.volume = 0.3; // 30% volume
      videoRef.current.load();
    }
  }, [shouldPreload, memory.type]);

  // Check if video is fully buffered (entire video downloaded)
  const checkFullyBuffered = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || !isFinite(video.duration)) return;

    const buffered = video.buffered;
    if (buffered.length === 0) {
      setBufferProgress(0);
      return;
    }

    // Check the last buffered range - if it reaches the end, video is fully loaded
    const lastBufferedEnd = buffered.end(buffered.length - 1);
    const progress = Math.min(100, (lastBufferedEnd / video.duration) * 100);
    setBufferProgress(progress);

    // Consider fully buffered if we have 99.5%+ (small tolerance for rounding)
    if (lastBufferedEnd >= video.duration - 0.1) {
      setIsFullyBuffered(true);
      if (isActiveRef.current) {
        playVideo();
      }
    }
  }, [playVideo]);

  // Handle buffer progress updates
  const handleProgress = useCallback(() => {
    checkFullyBuffered();
  }, [checkFullyBuffered]);

  // Handle video metadata loaded - start checking buffer
  const handleDurationChange = useCallback(() => {
    checkFullyBuffered();
  }, [checkFullyBuffered]);

  // Handle video metadata loaded (for showing poster/thumbnail)
  const handleLoadedData = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Handle canplaythrough - but we still wait for full buffer
  const handleCanPlayThrough = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.3; // 30% volume
    }
    // Don't auto-play here, wait for full buffer via handleProgress
    checkFullyBuffered();
  }, [checkFullyBuffered]);

  const isVideo = memory.type === "video";
  const isPhoto = memory.type === "photo";
  // Feed only contains photos and videos, safely cast to access media properties
  const mediaMemory = memory as { url?: string; thumbnailUrl?: string | null };
  const mediaUrl = (isVideo || isPhoto) ? mediaMemory.url : undefined;
  const thumbnailUrl = (isVideo || isPhoto) ? mediaMemory.thumbnailUrl : undefined;

  return (
    <div
      className="relative h-[100dvh] w-full snap-start snap-always"
      style={{ scrollSnapAlign: "start" }}
    >
      {/* Background Media */}
      <div className="absolute inset-0 bg-black">
        {/* Only render media when shouldPreload is true */}
        {shouldPreload && (
          <>
            {isVideo && mediaUrl ? (
              <video
                ref={videoRef}
                src={mediaUrl}
                poster={thumbnailUrl ?? undefined}
                className="h-full w-full object-cover"
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                onLoadedData={handleLoadedData}
                onDurationChange={handleDurationChange}
                onProgress={handleProgress}
                onCanPlayThrough={handleCanPlayThrough}
                onEnded={playVideo}
              />
            ) : mediaUrl ? (
              <Image
                src={mediaUrl}
                alt={dayNote ?? "Recuerdo"}
                fill
                className="object-cover"
                priority={isActive}
                loading={shouldPreload ? "eager" : "lazy"}
                sizes="100vw"
                onLoad={() => setIsLoaded(true)}
              />
            ) : null}
          </>
        )}

        {/* Loading placeholder - show while video is downloading */}
        {shouldPreload && isVideo && !isFullyBuffered && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {/* Circular progress indicator */}
            <div className="relative h-14 w-14">
              {/* Background circle */}
              <svg className="h-full w-full -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="3"
                />
                {/* Progress circle */}
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - bufferProgress / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
              {/* Percentage text */}
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                {Math.round(bufferProgress)}%
              </span>
            </div>
          </div>
        )}

        {/* Photo loading indicator */}
        {shouldPreload && isPhoto && !isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}

        {/* Thumbnail fallback when not preloading */}
        {!shouldPreload && thumbnailUrl && (
          <Image
            src={thumbnailUrl}
            alt={dayNote ?? "Recuerdo"}
            fill
            className="object-cover opacity-50"
            sizes="100vw"
          />
        )}

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 pb-24">
        {/* Top Section - Song Info */}
        {song && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : -20 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={onToggleMute}
              className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 backdrop-blur-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Music className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white line-clamp-1">
                  {song.title}
                </p>
                <p className="text-xs text-white/70 line-clamp-1">{song.artist}</p>
              </div>
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-white/70" />
              ) : (
                <Volume2 className="h-4 w-4 text-white" />
              )}
            </button>
          </motion.div>
        )}

        {/* Bottom Section - Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {/* Pinned Quote */}
          {pinnedQuote && (
            <div className="flex items-start gap-2 rounded-lg bg-black/30 p-3 backdrop-blur-sm">
              <Quote className="h-4 w-4 flex-shrink-0 text-pink-400" />
              <p className="text-sm italic text-white/90 line-clamp-2">
                &ldquo;{pinnedQuote}&rdquo;
              </p>
            </div>
          )}

          {/* Day Note / Title */}
          {dayNote && (
            <p className="text-base font-medium text-white leading-snug line-clamp-3">
              {dayNote}
            </p>
          )}

          {/* Location and Date */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </span>
            )}
            <span>{formattedDate}</span>
            {memory.user && (
              <span className="text-white/50">
                por {memory.user.firstName}
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
