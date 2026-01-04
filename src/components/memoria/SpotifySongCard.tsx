"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Pause, Music, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react";
import type { SongData } from "~/types/memoria";
import { cn } from "~/lib/utils";

interface SpotifySongCardProps {
  songData: SongData;
  caption?: string | null;
  onClick?: () => void;
  onDelete?: () => void;
  index?: number;
  compact?: boolean;
}

export function SpotifySongCard({
  songData,
  caption,
  onClick,
  onDelete,
  index = 0,
  compact = false,
}: SpotifySongCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
    setShowMenu(false);
  };

  const hasAlbumArt = !!songData.albumArt;
  const hasPreview = !!songData.previewUrl;
  const spotifyUrl = songData.spotifyUrl;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!songData.previewUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Create new audio
    audioRef.current = new Audio(songData.previewUrl);
    audioRef.current.volume = 0.5;

    audioRef.current.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };

    audioRef.current.play();
    setIsPlaying(true);

    // Update progress bar
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(pct);
      }
    }, 100);
  };

  const handleSpotifyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (spotifyUrl) {
      window.open(spotifyUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (compact) {
    // Compact version for grid display
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        onClick={onClick}
        className="group relative aspect-square overflow-hidden rounded-xl shadow-sm transition-all hover:shadow-md"
      >
        {hasAlbumArt ? (
          <Image
            src={songData.albumArt!}
            alt={songData.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 200px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
            <Music className="h-8 w-8 text-white/50" />
          </div>
        )}

        {/* Overlay with song info */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3">
          <p className="line-clamp-1 text-sm font-semibold text-white">
            {songData.title}
          </p>
          <p className="line-clamp-1 text-xs text-white/70">
            {songData.artist}
          </p>
        </div>

        {/* Play button overlay */}
        {hasPreview && (
          <button
            onClick={togglePlay}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500 p-3 opacity-0 shadow-lg transition-all group-hover:opacity-100"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white" />
            ) : (
              <Play className="h-5 w-5 text-white" />
            )}
          </button>
        )}

        {/* Progress bar */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </motion.button>
    );
  }

  // Full card version
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl shadow-sm transition-all",
        onClick && "cursor-pointer hover:shadow-md"
      )}
    >
      {/* Three-dot menu - subtle */}
      {onDelete && (
        <div ref={menuRef} className="absolute right-1 top-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20"
          >
            <MoreHorizontal className="h-3 w-3 text-white/70" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-7 min-w-[120px] overflow-hidden rounded-lg bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eliminar</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-4">
        <div className="flex items-center gap-4">
          {/* Album art */}
          <div className="relative flex-shrink-0">
            {hasAlbumArt ? (
              <Image
                src={songData.albumArt!}
                alt={songData.title}
                width={80}
                height={80}
                className="h-20 w-20 rounded-lg object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-700">
                <Music className="h-8 w-8 text-slate-400" />
              </div>
            )}

            {/* Play button */}
            {hasPreview && (
              <button
                onClick={togglePlay}
                className={cn(
                  "absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all",
                  isPlaying
                    ? "bg-white"
                    : "bg-green-500 hover:scale-105"
                )}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-green-500" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
              </button>
            )}
          </div>

          {/* Song info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-white">
              {songData.title}
            </p>
            <p className="truncate text-sm text-gray-300">
              {songData.artist}
            </p>

            {/* Caption */}
            {caption && (
              <p className="mt-1 line-clamp-1 text-xs italic text-gray-400">
                &ldquo;{caption}&rdquo;
              </p>
            )}

            {/* Spotify link */}
            {spotifyUrl && (
              <button
                onClick={handleSpotifyClick}
                className="mt-2 inline-flex items-center gap-1 text-xs text-green-400 transition-colors hover:text-green-300"
              >
                <ExternalLink className="h-3 w-3" />
                Abrir en Spotify
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {isPlaying && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/20">
            <motion.div
              className="h-full bg-green-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Preview indicator */}
        {hasPreview && !isPlaying && (
          <p className="mt-2 text-center text-[10px] text-gray-500">
            Toca para escuchar un preview de 30 segundos
          </p>
        )}
      </div>
    </motion.div>
  );
}
