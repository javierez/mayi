"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  MapPinned,
  Quote,
  Loader2,
  Upload,
  Link as LinkIcon,
  Search,
  Play,
  Pause,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  createNoteMemoryAction,
  createSongMemoryAction,
  createLocationMemoryAction,
  createQuoteMemoryAction,
} from "~/server/actions/memoria/memories";
import type { MemoryType, SongData, LocationData } from "~/types/memoria";
import { PlaceAutocomplete, type PlaceDataWithPhotos } from "./PlaceAutocomplete";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AddMemoryModalProps {
  open: boolean;
  onClose: () => void;
  date: string;
  initialType?: string | null;
  onSuccess: () => void;
}

interface SpotifyTrackResult {
  id: string;
  title: string;
  artist: string;
  albumName: string;
  albumArt: string | null;
  albumArtSmall: string | null;
  previewUrl: string | null;
  spotifyUrl: string;
  durationMs: number;
  popularity: number;
}

const MEMORY_TYPES = [
  { type: "photo", icon: ImageIcon, label: "Foto", color: "bg-slate-700" },
  { type: "video", icon: Video, label: "Video", color: "bg-slate-600" },
  { type: "note", icon: FileText, label: "Nota", color: "bg-slate-500" },
  { type: "song", icon: Music, label: "Canción", color: "bg-slate-600" },
  { type: "location", icon: MapPinned, label: "Lugar", color: "bg-slate-500" },
  { type: "quote", icon: Quote, label: "Frase", color: "bg-slate-700" },
];

export function AddMemoryModal({
  open,
  onClose,
  date,
  initialType,
  onSuccess,
}: AddMemoryModalProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState<MemoryType | null>(
    initialType as MemoryType | null
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form fields for different types
  const [noteContent, setNoteContent] = useState("");
  const [quoteContent, setQuoteContent] = useState("");
  const [quoteAttribution, setQuoteAttribution] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationData, setLocationData] = useState<PlaceDataWithPhotos | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Spotify search state
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const [songSearchResults, setSongSearchResults] = useState<SpotifyTrackResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrackResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [spotifyAvailable, setSpotifyAvailable] = useState<boolean | null>(null); // null = unknown, true = available, false = not configured
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initialType to selectedType when modal opens with a specific type
  useEffect(() => {
    if (open && initialType) {
      setSelectedType(initialType as MemoryType);
    }
  }, [open, initialType]);

  const resetForm = () => {
    setSelectedType(null);
    setIsPrivate(false);
    setCaption("");
    setError(null);
    setNoteContent("");
    setQuoteContent("");
    setQuoteAttribution("");
    setSongTitle("");
    setSongArtist("");
    setSongUrl("");
    setLocationName("");
    setLocationData(null);
    setSelectedPhotoIndex(0);
    // Reset Spotify state
    setSongSearchQuery("");
    setSongSearchResults([]);
    setSelectedTrack(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // Spotify search with debounce
  const searchSpotify = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSongSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&limit=6`);
      if (response.ok) {
        const data = await response.json();
        setSongSearchResults(data.tracks ?? []);
        setSpotifyAvailable(true);
      } else if (response.status === 503) {
        // Spotify not configured - switch to manual mode
        setSpotifyAvailable(false);
      }
    } catch (err) {
      console.error("Spotify search error:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (songSearchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        void searchSpotify(songSearchQuery);
      }, 300);
    } else {
      setSongSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [songSearchQuery, searchSpotify]);

  // Handle track selection
  const handleSelectTrack = (track: SpotifyTrackResult) => {
    setSelectedTrack(track);
    setSongTitle(track.title);
    setSongArtist(track.artist);
    setSongUrl(track.spotifyUrl);
    setSongSearchQuery("");
    setSongSearchResults([]);
    // Stop any playing preview
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Play/pause preview
  const togglePreview = (previewUrl: string) => {
    if (!previewUrl) return;

    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    audioRef.current = new Audio(previewUrl);
    audioRef.current.volume = 0.5;
    audioRef.current.play();
    setIsPlaying(true);

    audioRef.current.onended = () => {
      setIsPlaying(false);
    };
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedType) return;

    setError(null);

    startTransition(async () => {
      try {
        let result;

        switch (selectedType) {
          case "note":
            if (!noteContent.trim()) {
              setError("La nota no puede estar vacía");
              return;
            }
            result = await createNoteMemoryAction({
              date,
              content: noteContent,
              caption: caption || undefined,
              isPrivate,
            });
            break;

          case "quote":
            if (!quoteContent.trim()) {
              setError("La frase no puede estar vacía");
              return;
            }
            result = await createQuoteMemoryAction({
              date,
              content: quoteContent,
              caption: quoteAttribution || undefined,
              isPrivate,
            });
            break;

          case "song":
            if (!songTitle.trim() || !songArtist.trim()) {
              setError("Título y artista son obligatorios");
              return;
            }
            const songData: SongData = {
              title: songTitle,
              artist: songArtist,
              spotifyUrl: songUrl.includes("spotify") ? songUrl : undefined,
              appleMusicUrl: songUrl.includes("apple") ? songUrl : undefined,
              youtubeUrl: songUrl.includes("youtube") || songUrl.includes("youtu.be") ? songUrl : undefined,
              previewUrl: selectedTrack?.previewUrl ?? undefined,
              albumArt: selectedTrack?.albumArt ?? undefined,
            };
            result = await createSongMemoryAction({
              date,
              songData,
              caption: caption || undefined,
              isPrivate,
            });
            break;

          case "location":
            if (!locationName.trim()) {
              setError("El nombre del lugar es obligatorio");
              return;
            }
            // Use the full location data with selected photo
            const selectedPhotoUrl = locationData?.availablePhotos?.[selectedPhotoIndex];
            const finalLocationData: LocationData = locationData
              ? {
                  name: locationData.name,
                  address: locationData.address,
                  lat: locationData.lat,
                  lng: locationData.lng,
                  googlePlaceId: locationData.googlePlaceId,
                  photoUrl: selectedPhotoUrl, // Use the selected photo
                }
              : {
                  name: locationName,
                  lat: 0,
                  lng: 0,
                };
            result = await createLocationMemoryAction({
              date,
              locationData: finalLocationData,
              caption: caption || undefined,
              isPrivate,
            });
            break;

          case "photo":
          case "video":
            // These will be handled by a separate upload flow
            setError("Usa el botón de subir para fotos y videos");
            return;

          default:
            setError("Tipo de recuerdo no soportado");
            return;
        }

        if (result?.success) {
          resetForm();
          onSuccess();
        } else {
          setError(result?.error ?? "Error al crear el recuerdo");
        }
      } catch (err) {
        console.error("Error creating memory:", err);
        setError("Error inesperado al crear el recuerdo");
      }
    });
  };

  const renderTypeSelector = () => (
    <div className="grid grid-cols-3 gap-3 p-4">
      {MEMORY_TYPES.map(({ type, icon: Icon, label, color }) => (
        <button
          key={type}
          onClick={() => setSelectedType(type as MemoryType)}
          className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 p-4 transition-all hover:bg-slate-100"
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </button>
      ))}
    </div>
  );

  const renderNoteForm = () => (
    <div className="space-y-4 p-4">
      <div>
        <Label htmlFor="noteContent">Tu nota</Label>
        <Textarea
          id="noteContent"
          placeholder="Escribe tu nota aquí..."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          rows={4}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="caption">Título (opcional)</Label>
        <Input
          id="caption"
          placeholder="Añade un título..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="mt-1.5"
        />
      </div>
    </div>
  );

  const renderQuoteForm = () => (
    <div className="space-y-4 p-4">
      <div>
        <Label htmlFor="quoteContent">La frase</Label>
        <Textarea
          id="quoteContent"
          placeholder="Escribe la frase memorable..."
          value={quoteContent}
          onChange={(e) => setQuoteContent(e.target.value)}
          rows={3}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="quoteAttribution">¿Quién lo dijo? (opcional)</Label>
        <Input
          id="quoteAttribution"
          placeholder="Ej: María, durante nuestra cena"
          value={quoteAttribution}
          onChange={(e) => setQuoteAttribution(e.target.value)}
          className="mt-1.5"
        />
      </div>
    </div>
  );

  // Manual song entry form (used when Spotify not available or user chooses manual)
  const renderManualSongForm = () => (
    <div className="space-y-3">
      <div>
        <Label htmlFor="songTitle">Título de la canción</Label>
        <Input
          id="songTitle"
          placeholder="Ej: Perfect"
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="songArtist">Artista</Label>
        <Input
          id="songArtist"
          placeholder="Ej: Ed Sheeran"
          value={songArtist}
          onChange={(e) => setSongArtist(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="songUrl">
          <div className="flex items-center gap-1">
            <LinkIcon className="h-3.5 w-3.5" />
            Enlace de Spotify (opcional)
          </div>
        </Label>
        <Input
          id="songUrl"
          placeholder="https://open.spotify.com/track/..."
          value={songUrl}
          onChange={(e) => setSongUrl(e.target.value)}
          className="mt-1.5"
        />
      </div>
      {spotifyAvailable !== false && (
        <button
          type="button"
          onClick={() => {
            setSelectedTrack(null);
            setSongTitle("");
            setSongArtist("");
            setSongUrl("");
          }}
          className="text-xs text-slate-500 underline"
        >
          Volver a buscar
        </button>
      )}
    </div>
  );

  const renderSongForm = () => (
    <div className="space-y-4 p-4">
      {/* Show manual form directly if Spotify not configured */}
      {spotifyAvailable === false ? (
        <>
          <div className="mb-3 rounded-lg bg-slate-100 p-3 text-center">
            <Music className="mx-auto mb-1 h-5 w-5 text-slate-400" />
            <p className="text-xs text-slate-500">
              Añade la canción manualmente
            </p>
          </div>
          {renderManualSongForm()}
        </>
      ) : !selectedTrack ? (
        <div className="relative">
          <Label htmlFor="songSearch">Buscar canción en Spotify</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="songSearch"
              placeholder="Busca por título o artista..."
              value={songSearchQuery}
              onChange={(e) => setSongSearchQuery(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
            )}
          </div>

          {/* Search Results */}
          {songSearchResults.length > 0 && (
            <div className="absolute left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border bg-white shadow-lg">
              {songSearchResults.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track)}
                  className="flex w-full items-center gap-3 p-2 text-left transition-colors hover:bg-gray-50"
                >
                  {track.albumArtSmall ? (
                    <Image
                      src={track.albumArtSmall}
                      alt={track.albumName}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200">
                      <Music className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {track.title}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {track.artist}
                    </p>
                  </div>
                  {track.previewUrl && (
                    <div className="flex-shrink-0">
                      <Play className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Manual entry fallback */}
          <p className="mt-3 text-center text-xs text-gray-400">
            ¿No encuentras la canción?{" "}
            <button
              type="button"
              onClick={() => setSelectedTrack({ id: "manual", title: "", artist: "", albumName: "", albumArt: null, albumArtSmall: null, previewUrl: null, spotifyUrl: "", durationMs: 0, popularity: 0 })}
              className="text-slate-600 underline"
            >
              Añádela manualmente
            </button>
          </p>
        </div>
      ) : (
        <>
          {/* Selected Track Card */}
          {selectedTrack.id !== "manual" && selectedTrack.albumArt ? (
            <div className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Image
                    src={selectedTrack.albumArt}
                    alt={selectedTrack.albumName}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-lg object-cover shadow-lg"
                  />
                  {selectedTrack.previewUrl && (
                    <button
                      type="button"
                      onClick={() => togglePreview(selectedTrack.previewUrl!)}
                      className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 shadow-md transition-transform hover:scale-105"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" />
                      )}
                    </button>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-white">
                    {selectedTrack.title}
                  </p>
                  <p className="truncate text-sm text-gray-300">
                    {selectedTrack.artist}
                  </p>
                  <a
                    href={selectedTrack.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Abrir en Spotify
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTrack(null);
                  setSongTitle("");
                  setSongArtist("");
                  setSongUrl("");
                  if (audioRef.current) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                  }
                }}
                className="mt-3 w-full rounded-lg bg-white/10 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/20"
              >
                Cambiar canción
              </button>
            </div>
          ) : (
            /* Manual entry form */
            renderManualSongForm()
          )}
        </>
      )}

      {/* Caption field (shown after track selected or in manual mode) */}
      {(selectedTrack || spotifyAvailable === false) && (
        <div>
          <Label htmlFor="songCaption">¿Por qué es especial? (opcional)</Label>
          <Input
            id="songCaption"
            placeholder="Ej: Sonaba en nuestra primera cita"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-1.5"
          />
        </div>
      )}
    </div>
  );

  const handlePlaceSelected = (data: PlaceDataWithPhotos) => {
    setLocationName(data.name);
    setLocationData(data);
    setSelectedPhotoIndex(0); // Reset to first photo
  };

  const handlePrevPhoto = () => {
    if (!locationData?.availablePhotos) return;
    setSelectedPhotoIndex((prev) =>
      prev === 0 ? locationData.availablePhotos!.length - 1 : prev - 1
    );
  };

  const handleNextPhoto = () => {
    if (!locationData?.availablePhotos) return;
    setSelectedPhotoIndex((prev) =>
      prev === locationData.availablePhotos!.length - 1 ? 0 : prev + 1
    );
  };

  const renderLocationForm = () => (
    <div className="space-y-4 p-4">
      <div>
        <Label htmlFor="locationName">Buscar lugar</Label>
        <PlaceAutocomplete
          value={locationName}
          onChange={setLocationName}
          onPlaceSelected={handlePlaceSelected}
          placeholder="Restaurante, playa, café..."
          className="mt-1.5"
        />
      </div>

      {/* Photo picker carousel */}
      {locationData?.availablePhotos && locationData.availablePhotos.length > 0 && (
        <div className="mt-2">
          <div className="relative overflow-hidden rounded-lg">
            <Image
              src={locationData.availablePhotos[selectedPhotoIndex] ?? ""}
              alt={locationData.name}
              width={400}
              height={200}
              className="h-40 w-full object-cover"
            />

            {/* Navigation arrows - only show if multiple photos */}
            {locationData.availablePhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Photo indicator dots */}
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                  {locationData.availablePhotos.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        idx === selectedPhotoIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Place name overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
              <p className="text-sm font-medium text-white">{locationData.name}</p>
              {locationData.address && (
                <p className="truncate text-xs text-white/80">{locationData.address}</p>
              )}
            </div>
          </div>

          {/* Photo count indicator */}
          {locationData.availablePhotos.length > 1 && (
            <p className="mt-1 text-center text-xs text-gray-400">
              Foto {selectedPhotoIndex + 1} de {locationData.availablePhotos.length}
            </p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="locationCaption">¿Por qué es especial? (opcional)</Label>
        <Input
          id="locationCaption"
          placeholder="Ej: Donde nos conocimos"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="mt-1.5"
        />
      </div>
    </div>
  );

  const renderMediaForm = () => (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
        <Upload className="mx-auto h-10 w-10 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          La subida de fotos y videos estará disponible pronto
        </p>
      </div>
    </div>
  );

  const renderFormContent = () => {
    switch (selectedType) {
      case "note":
        return renderNoteForm();
      case "quote":
        return renderQuoteForm();
      case "song":
        return renderSongForm();
      case "location":
        return renderLocationForm();
      case "photo":
      case "video":
        return renderMediaForm();
      default:
        return null;
    }
  };

  const canSubmit = () => {
    switch (selectedType) {
      case "note":
        return noteContent.trim().length > 0;
      case "quote":
        return quoteContent.trim().length > 0;
      case "song":
        return songTitle.trim().length > 0 && songArtist.trim().length > 0;
      case "location":
        return locationName.trim().length > 0;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedType
              ? `Añadir ${MEMORY_TYPES.find((t) => t.type === selectedType)?.label}`
              : "Añadir recuerdo"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!selectedType ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderTypeSelector()}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderFormContent()}

              {/* Privacy toggle (for all types) */}
              {selectedType !== "photo" && selectedType !== "video" && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div>
                    <Label htmlFor="private">Recuerdo privado</Label>
                    <p className="text-xs text-gray-500">
                      Solo tú podrás verlo
                    </p>
                  </div>
                  <Switch
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mx-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 border-t p-4">
                {/* Only show back button if user came from type selector (no initialType) */}
                {!initialType && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedType(null)}
                    className="flex-1"
                  >
                    Atrás
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || !canSubmit()}
                  className={initialType ? "w-full" : "flex-1"}
                  style={{ backgroundColor: "#1e293b" }}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
