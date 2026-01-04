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
  const [isBuffered, setIsBuffered] = useState(false);
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
      if (isActive && isBuffered) {
        playVideo();
      } else if (!isActive) {
        videoRef.current.pause();
        if (!shouldPreload) {
          videoRef.current.currentTime = 0;
        }
      }
    }
  }, [isActive, isBuffered, shouldPreload, playVideo]);

  // Preload video when shouldPreload becomes true
  useEffect(() => {
    if (shouldPreload && memory.type === "video" && videoRef.current) {
      videoRef.current.preload = "auto";
      videoRef.current.volume = 0.3; // 30% volume
      videoRef.current.load();
    }
  }, [shouldPreload, memory.type]);

  // Handle unexpected video pause - resume if still active
  const handlePause = useCallback(() => {
    if (isActiveRef.current && videoRef.current) {
      // Small delay to avoid fighting with intentional pauses
      setTimeout(() => {
        if (isActiveRef.current && videoRef.current?.paused) {
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    }
  }, []);

  // Handle video metadata loaded (for showing poster/thumbnail)
  const handleLoadedData = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Handle video fully buffered - only play when entire video is ready
  const handleCanPlayThrough = useCallback(() => {
    setIsBuffered(true);
    if (videoRef.current) {
      videoRef.current.volume = 0.3; // 30% volume
    }
    if (isActiveRef.current) {
      playVideo();
    }
  }, [playVideo]);

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
                onCanPlayThrough={handleCanPlayThrough}
                onPause={handlePause}
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

        {/* Loading placeholder - show while loading or buffering video */}
        {shouldPreload && (!isLoaded || (isVideo && !isBuffered)) && (
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
