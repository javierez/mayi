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

// Buffer threshold before starting playback
const MIN_BUFFER_PERCENT = 10; // Start after 10% buffered
const MIN_BUFFER_SECONDS = 2; // OR start after 2 seconds buffered (whichever comes first)
// Maximum time to wait for video to start loading before showing stalled
const LOAD_TIMEOUT_MS = 8000;

export function FeedItem({ item, isActive, shouldPreload, isMuted, onToggleMute }: FeedItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReadyToPlay, setIsReadyToPlay] = useState(false); // Enough buffer to start
  const [isBuffering, setIsBuffering] = useState(false); // Currently waiting for data
  const [bufferProgress, setBufferProgress] = useState(0); // 0-100%
  const [isFullyCached, setIsFullyCached] = useState(false); // Video fully loaded - no more buffer checks
  const [hasError, setHasError] = useState(false); // Video failed to load
  const [isStalled, setIsStalled] = useState(false); // Network stalled - tap to retry
  const [useOriginalUrl, setUseOriginalUrl] = useState(false); // Fallback if compressed not ready
  const isActiveRef = useRef(isActive);
  const hasStartedPlaying = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Refs for timeout closure to avoid stale values
  const bufferProgressRef = useRef(bufferProgress);
  const isReadyToPlayRef = useRef(isReadyToPlay);
  const isFullyCachedRef = useRef(isFullyCached);
  const { memory, dayNote, pinnedQuote, song, location, date } = item;

  // Cast for media properties access
  const mediaMemory = memory as { url?: string; compressedUrl?: string | null; thumbnailUrl?: string | null };

  // Keep refs in sync with state
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);
  useEffect(() => {
    bufferProgressRef.current = bufferProgress;
    isReadyToPlayRef.current = isReadyToPlay;
    isFullyCachedRef.current = isFullyCached;
  }, [bufferProgress, isReadyToPlay, isFullyCached]);

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
          if (playRetryTimeoutRef.current) {
            clearTimeout(playRetryTimeoutRef.current);
          }
          playRetryTimeoutRef.current = setTimeout(() => {
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
      if (isActive && isReadyToPlay) {
        hasStartedPlaying.current = true;
        playVideo();
      } else if (!isActive) {
        videoRef.current.pause();
        hasStartedPlaying.current = false;
        if (!shouldPreload) {
          videoRef.current.currentTime = 0;
          setIsReadyToPlay(false);
          setBufferProgress(0);
        }
      }
    }
  }, [isActive, isReadyToPlay, shouldPreload, playVideo]);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (playRetryTimeoutRef.current) {
        clearTimeout(playRetryTimeoutRef.current);
        playRetryTimeoutRef.current = null;
      }
    };
  }, []);

  // Preload video when shouldPreload becomes true
  useEffect(() => {
    if (shouldPreload && memory.type === "video" && videoRef.current) {
      // Skip if already cached
      if (isFullyCachedRef.current) return;

      videoRef.current.preload = "auto";
      videoRef.current.volume = 0.3;
      videoRef.current.load();

      // Set a timeout - if no progress, show stalled state (tap to retry)
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      loadTimeoutRef.current = setTimeout(() => {
        // Use refs to get current values, not stale closure
        if (bufferProgressRef.current === 0 && !isReadyToPlayRef.current && !isFullyCachedRef.current) {
          setIsStalled(true);
        }
      }, LOAD_TIMEOUT_MS);
    }
  }, [shouldPreload, memory.type]);

  // Check if we have enough buffer to play smoothly
  const checkBufferStatus = useCallback(() => {
    // Once fully cached, skip all buffer checks - video loops smoothly
    if (isFullyCached) return;

    const video = videoRef.current;
    if (!video || !video.duration || !isFinite(video.duration)) return;

    // Clear load timeout once we start receiving data
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    // Clear stalled state when we receive progress
    if (isStalled) {
      setIsStalled(false);
    }

    const buffered = video.buffered;
    const duration = video.duration;

    // Safe check for buffered ranges
    const bufferedLength = buffered.length;
    if (bufferedLength === 0) {
      setBufferProgress(0);
      return;
    }

    // Find the furthest buffered point
    let lastBufferedEnd = 0;
    try {
      for (let i = 0; i < bufferedLength; i++) {
        const end = buffered.end(i);
        if (end > lastBufferedEnd) {
          lastBufferedEnd = end;
        }
      }
    } catch (e) {
      console.warn("Error accessing buffer ranges:", e);
      return;
    }

    // Calculate overall progress for display
    const progress = Math.min(100, (lastBufferedEnd / duration) * 100);
    setBufferProgress(progress);

    // Check if video is fully buffered - once cached, never show buffering again
    const isFullyBuffered = lastBufferedEnd >= duration - 0.1;

    if (isFullyBuffered) {
      setIsFullyCached(true);
      setIsReadyToPlay(true);
      setIsBuffering(false);
      if (isActiveRef.current) {
        playVideo();
      }
      return;
    }

    // Check if we have enough buffer to start playing (first load only)
    // Use whichever threshold is reached first: percentage OR seconds
    const hasEnoughPercent = progress >= MIN_BUFFER_PERCENT;
    const hasEnoughSeconds = lastBufferedEnd >= MIN_BUFFER_SECONDS;

    if ((hasEnoughPercent || hasEnoughSeconds) && !isReadyToPlay) {
      setIsReadyToPlay(true);
      setIsBuffering(false);
      if (isActiveRef.current) {
        playVideo();
      }
    }
  }, [playVideo, isReadyToPlay, isStalled, isFullyCached]);

  // Handle buffer progress updates
  const handleProgress = useCallback(() => {
    checkBufferStatus();
  }, [checkBufferStatus]);

  // Handle video metadata loaded - start checking buffer
  const handleDurationChange = useCallback(() => {
    checkBufferStatus();
  }, [checkBufferStatus]);

  // Handle video waiting for data - only relevant during initial load
  const handleWaiting = useCallback(() => {
    if (isFullyCached) return; // Cached videos never buffer
    if (isActiveRef.current && hasStartedPlaying.current) {
      setIsBuffering(true);
    }
  }, [isFullyCached]);

  // Handle video playing again after buffering
  const handlePlaying = useCallback(() => {
    if (isFullyCached) return; // No state updates needed for cached videos
    setIsBuffering(false);
    setIsStalled(false);
  }, [isFullyCached]);

  // Handle video error (network error, decode error, etc.)
  const handleError = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const error = video.error;
    console.error("Video error:", error?.code, error?.message);

    // Clear any loading timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    // If compressed URL failed (404), try original URL
    if (!useOriginalUrl && mediaMemory.compressedUrl && mediaMemory.url) {
      console.log("Compressed video not ready, falling back to original");
      setUseOriginalUrl(true);
      return; // Don't set error, let it retry with original
    }

    // Set error state
    setHasError(true);
    setIsBuffering(false);
  }, [useOriginalUrl, mediaMemory.compressedUrl, mediaMemory.url]);

  // Handle network stall - user can tap to retry
  const handleStalled = useCallback(() => {
    if (isFullyCached) return; // Cached videos don't stall
    setIsStalled(true);
  }, [isFullyCached]);

  // Handle suspend (browser intentionally stopped downloading)
  const handleSuspend = useCallback(() => {
    // This is normal browser behavior, only log in dev
    if (process.env.NODE_ENV === "development") {
      console.log("Video download suspended by browser");
    }
  }, []);

  // Retry loading the video - user triggered
  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsStalled(false);
    setBufferProgress(0);
    setIsReadyToPlay(false);
    setIsFullyCached(false); // Reset cached state to allow fresh load

    // Force reload the video
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  // Handle video metadata loaded (for showing poster/thumbnail)
  const handleLoadedData = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Handle canplaythrough - check buffer and potentially start playing
  const handleCanPlayThrough = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.3; // 30% volume
    }
    checkBufferStatus();
  }, [checkBufferStatus]);

  const isVideo = memory.type === "video";
  const isPhoto = memory.type === "photo";

  // Prefer compressed URL for videos, fall back to original if compressed fails
  const mediaUrl = isVideo
    ? (useOriginalUrl ? mediaMemory.url : (mediaMemory.compressedUrl ?? mediaMemory.url))
    : isPhoto
      ? mediaMemory.url
      : undefined;
  const thumbnailUrl = (isVideo || isPhoto) ? mediaMemory.thumbnailUrl : undefined;

  return (
    <div className="relative h-[100dvh] w-full snap-start snap-always">
      {/* Background Media */}
      <div className="absolute inset-0 bg-black">
        {/* Only render media when shouldPreload is true */}
        {shouldPreload && (
          <>
            {isVideo && mediaUrl && !hasError ? (
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
                onError={handleError}
                // Only attach buffer-related handlers before video is cached
                onDurationChange={isFullyCached ? undefined : handleDurationChange}
                onProgress={isFullyCached ? undefined : handleProgress}
                onCanPlayThrough={isFullyCached ? undefined : handleCanPlayThrough}
                onWaiting={isFullyCached ? undefined : handleWaiting}
                onPlaying={isFullyCached ? undefined : handlePlaying}
                onTimeUpdate={isFullyCached ? undefined : checkBufferStatus}
                onStalled={isFullyCached ? undefined : handleStalled}
                onSuspend={isFullyCached ? undefined : handleSuspend}
              />
            ) : isPhoto && mediaUrl ? (
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

        {/* Video error state - tap to retry */}
        {shouldPreload && isVideo && hasError && (
          <button
            onClick={handleRetry}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          >
            {thumbnailUrl && (
              <Image
                src={thumbnailUrl}
                alt={dayNote ?? "Recuerdo"}
                fill
                className="object-cover opacity-30"
                sizes="100vw"
              />
            )}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="rounded-full bg-red-500/20 p-3">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm text-white/80">Toca para reintentar</p>
            </div>
          </button>
        )}

        {/* Initial loading - tap to retry when stalled */}
        {shouldPreload && isVideo && !isReadyToPlay && !hasError && (
          <button
            onClick={isStalled ? handleRetry : undefined}
            disabled={!isStalled}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          >
            <div className="relative h-14 w-14">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <circle
                  cx="28" cy="28" r="24" fill="none"
                  stroke={isStalled ? "rgb(251, 191, 36)" : "white"}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - bufferProgress / 100)}`}
                  className="transition-all duration-300"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                {Math.round(bufferProgress)}%
              </span>
            </div>
            {isStalled && (
              <p className="text-xs text-amber-400">Toca para reintentar</p>
            )}
          </button>
        )}

        {/* Mid-playback buffering - only during initial load, never for cached */}
        {isVideo && isReadyToPlay && isBuffering && !isFullyCached && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
