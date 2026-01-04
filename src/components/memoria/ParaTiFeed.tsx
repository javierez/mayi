"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { FeedItem } from "./FeedItem";
import type { FeedItem as FeedItemType } from "~/server/queries/memoria/feed";

interface ParaTiFeedProps {
  initialItems: FeedItemType[];
}

export function ParaTiFeed({ initialItems }: ParaTiFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle scroll to detect current visible item
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < initialItems.length) {
        setCurrentIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentIndex, initialItems.length]);

  // Handle audio playback when current item changes
  useEffect(() => {
    const currentItem = initialItems[currentIndex];
    const previewUrl = currentItem?.song?.previewUrl;

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Play new audio if available and not muted
    if (previewUrl && !isMuted) {
      const audio = new Audio(previewUrl);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Auto-play was prevented, user needs to interact
      });
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentIndex, isMuted, initialItems]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;

      if (audioRef.current) {
        if (newMuted) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(() => {});
        }
      } else if (!newMuted) {
        // Start playing current song
        const currentItem = initialItems[currentIndex];
        const previewUrl = currentItem?.song?.previewUrl;
        if (previewUrl) {
          const audio = new Audio(previewUrl);
          audio.loop = true;
          audio.volume = 0.5;
          audio.play().catch(() => {});
          audioRef.current = audio;
        }
      }

      return newMuted;
    });
  }, [currentIndex, initialItems]);

  if (initialItems.length === 0) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="text-lg">No hay recuerdos aún</p>
          <p className="mt-2 text-sm text-gray-400">
            Añade fotos y videos en el calendario
          </p>
        </div>
      </div>
    );
  }

  // Preload next 2 items
  const shouldPreload = (index: number) => {
    return index >= currentIndex && index <= currentIndex + 2;
  };

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll bg-black"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {initialItems.map((item, index) => (
        <FeedItem
          key={item.memory.id.toString()}
          item={item}
          isActive={index === currentIndex}
          shouldPreload={shouldPreload(index)}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      ))}
    </div>
  );
}
