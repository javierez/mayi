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

// Minimum seconds of buffer ahead before starting playback
const MIN_BUFFER_AHEAD_SECONDS = 4;
// Buffer threshold as percentage of video (for short videos)
const MIN_BUFFER_PERCENT = 30;

// Maximum time to wait for video to start loading before showing error
const LOAD_TIMEOUT_MS = 15000;
// Maximum time to wait when stalled before auto-retrying
const STALL_TIMEOUT_MS = 5000;
// Maximum retries for failed video loads
const MAX_RETRIES = 3;

export function FeedItem({ item, isActive, shouldPreload, isMuted, onToggleMute }: FeedItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReadyToPlay, setIsReadyToPlay] = useState(false); // Enough buffer to start
  const [isBuffering, setIsBuffering] = useState(false); // Currently waiting for data
  const [bufferProgress, setBufferProgress] = useState(0); // 0-100%
  const [hasError, setHasError] = useState(false); // Video failed to load
  const [isStalled, setIsStalled] = useState(false); // Network stalled
  const [retryCount, setRetryCount] = useState(0);
  const isActiveRef = useRef(isActive);
  const hasStartedPlaying = useRef(false);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stallTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
        stallTimeoutRef.current = null;
      }
    };
  }, []);

  // Preload video when shouldPreload becomes true
  useEffect(() => {
    if (shouldPreload && memory.type === "video" && videoRef.current) {
      // Reset error state on preload
      setHasError(false);
      setIsStalled(false);

      videoRef.current.preload = "auto";
      videoRef.current.volume = 0.3; // 30% volume
      videoRef.current.load();

      // Set a timeout for loading - if we don't get any progress, show error
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      loadTimeoutRef.current = setTimeout(() => {
        // Only show error if we haven't made any progress
        if (bufferProgress === 0 && !isReadyToPlay && !hasError) {
          console.warn("Video load timeout - no progress after", LOAD_TIMEOUT_MS, "ms");
          setHasError(true);
        }
      }, LOAD_TIMEOUT_MS);
    }
  }, [shouldPreload, memory.type, retryCount]); // retryCount triggers reload

  // Check if we have enough buffer to play smoothly
  const checkBufferStatus = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration || !isFinite(video.duration)) return;

    // Clear load timeout once we start receiving data
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    // Clear stalled state and timeout when we receive progress
    if (isStalled) {
      setIsStalled(false);
    }
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }

    const buffered = video.buffered;
    const currentTime = video.currentTime;
    const duration = video.duration;

    // Safe check for buffered ranges
    const bufferedLength = buffered.length;
    if (bufferedLength === 0) {
      setBufferProgress(0);
      return;
    }

    // Find the buffer range that contains current playback position
    let bufferAhead = 0;
    let lastBufferedEnd = 0;

    try {
      for (let i = 0; i < bufferedLength; i++) {
        const start = buffered.start(i);
        const end = buffered.end(i);

        // Use small tolerance for floating-point comparisons
        // This handles edge cases when video loops and currentTime resets
        if (start <= currentTime + 0.1 && end >= currentTime) {
          bufferAhead = end - currentTime;
        }
        // If we're near the beginning (looping), check from start of buffer
        if (currentTime < 0.5 && start < 0.5) {
          bufferAhead = Math.max(bufferAhead, end - currentTime);
        }
        // Track the furthest buffered point
        if (end > lastBufferedEnd) {
          lastBufferedEnd = end;
        }
      }
    } catch (e) {
      // Buffer access can fail in rare cases
      console.warn("Error accessing buffer ranges:", e);
      return;
    }

    // Calculate overall progress for display
    const progress = Math.min(100, (lastBufferedEnd / duration) * 100);
    setBufferProgress(progress);

    // Check if video is fully buffered - if so, never show buffering on replay
    const isFullyBuffered = lastBufferedEnd >= duration - 0.1;

    // If fully buffered, we're always ready to play and never buffering
    if (isFullyBuffered) {
      if (!isReadyToPlay) {
        setIsReadyToPlay(true);
        if (isActiveRef.current) {
          playVideo();
        }
      }
      setIsBuffering(false);
      return;
    }

    // Check if we have enough buffer to start/continue playing
    const hasEnoughBuffer =
      bufferAhead >= MIN_BUFFER_AHEAD_SECONDS ||
      progress >= MIN_BUFFER_PERCENT;

    if (hasEnoughBuffer && !isReadyToPlay) {
      setIsReadyToPlay(true);
      setIsBuffering(false);
      if (isActiveRef.current) {
        playVideo();
      }
    }

    // If playing and buffer runs low, show buffering indicator
    if (hasStartedPlaying.current && bufferAhead < 1) {
      setIsBuffering(true);
    } else if (bufferAhead >= 2) {
      setIsBuffering(false);
    }
  }, [playVideo, isReadyToPlay, isStalled]);

  // Handle buffer progress updates
  const handleProgress = useCallback(() => {
    checkBufferStatus();
  }, [checkBufferStatus]);

  // Handle video metadata loaded - start checking buffer
  const handleDurationChange = useCallback(() => {
    checkBufferStatus();
  }, [checkBufferStatus]);

  // Handle video waiting for data
  const handleWaiting = useCallback(() => {
    if (isActiveRef.current && hasStartedPlaying.current) {
      setIsBuffering(true);
    }
  }, []);

  // Handle video playing again after buffering
  const handlePlaying = useCallback(() => {
    setIsBuffering(false);
    setIsStalled(false);
    // Clear stall timeout since we're playing now
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }
  }, []);

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

    // Set error state
    setHasError(true);
    setIsBuffering(false);
  }, []);

  // Handle network stall (browser is trying to fetch but no data available)
  const handleStalled = useCallback(() => {
    console.warn("Video stalled - network issue detected");
    setIsStalled(true);

    // Clear any existing stall timeout
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
    }

    // Auto-retry after stall timeout if we haven't exceeded max retries
    stallTimeoutRef.current = setTimeout(() => {
      if (retryCount < MAX_RETRIES && !hasError) {
        console.log("Auto-retrying video after stall timeout");
        setHasError(false);
        setIsStalled(false);
        setBufferProgress(0);
        setIsReadyToPlay(false);
        setRetryCount((prev) => prev + 1);

        if (videoRef.current) {
          videoRef.current.load();
        }
      }
    }, STALL_TIMEOUT_MS);
  }, [retryCount, hasError]);

  // Handle suspend (browser intentionally stopped downloading)
  const handleSuspend = useCallback(() => {
    // This is normal browser behavior, only log in dev
    if (process.env.NODE_ENV === "development") {
      console.log("Video download suspended by browser");
    }
  }, []);

  // Retry loading the video
  const handleRetry = useCallback(() => {
    if (retryCount >= MAX_RETRIES) {
      console.error("Max retries reached for video");
      return;
    }

    // Clear any pending stall timeout
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }

    setHasError(false);
    setIsStalled(false);
    setBufferProgress(0);
    setIsReadyToPlay(false);
    setRetryCount((prev) => prev + 1);

    // Force reload the video
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [retryCount]);

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
  // Feed only contains photos and videos, safely cast to access media properties
  const mediaMemory = memory as { url?: string; compressedUrl?: string | null; thumbnailUrl?: string | null };
  // Prefer compressed URL for videos when available (Lambda-processed)
  const mediaUrl = isVideo
    ? (mediaMemory.compressedUrl ?? mediaMemory.url)
    : isPhoto
      ? mediaMemory.url
      : undefined;
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
                onDurationChange={handleDurationChange}
                onProgress={handleProgress}
                onCanPlayThrough={handleCanPlayThrough}
                onWaiting={handleWaiting}
                onPlaying={handlePlaying}
                onTimeUpdate={checkBufferStatus}
                onEnded={playVideo}
                onError={handleError}
                onStalled={handleStalled}
                onSuspend={handleSuspend}
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

        {/* Video error state with retry */}
        {shouldPreload && isVideo && hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {/* Show thumbnail as background if available */}
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
                <svg
                  className="h-8 w-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-sm text-white/80">Error al cargar el video</p>
              {retryCount < MAX_RETRIES && (
                <button
                  onClick={handleRetry}
                  className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  Reintentar
                </button>
              )}
              {retryCount >= MAX_RETRIES && (
                <p className="text-xs text-white/50">
                  No se pudo cargar el video
                </p>
              )}
            </div>
          </div>
        )}

        {/* Initial loading - show while waiting for enough buffer to start */}
        {shouldPreload && isVideo && !isReadyToPlay && !hasError && (
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
                  stroke={isStalled ? "rgb(251, 191, 36)" : "white"}
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
            {/* Stalled indicator */}
            {isStalled && (
              <p className="text-xs text-amber-400">Conexión lenta...</p>
            )}
          </div>
        )}

        {/* Mid-playback buffering indicator - smaller, less intrusive */}
        {isVideo && isReadyToPlay && isBuffering && (
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
