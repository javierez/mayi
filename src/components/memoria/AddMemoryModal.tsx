"use client";

import { useState, useTransition } from "react";
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

interface AddMemoryModalProps {
  open: boolean;
  onClose: () => void;
  date: string;
  initialType?: string | null;
  onSuccess: () => void;
}

const MEMORY_TYPES = [
  { type: "photo", icon: ImageIcon, label: "Foto", color: "from-pink-400 to-rose-400" },
  { type: "video", icon: Video, label: "Video", color: "from-purple-400 to-violet-400" },
  { type: "note", icon: FileText, label: "Nota", color: "from-blue-400 to-sky-400" },
  { type: "song", icon: Music, label: "Canción", color: "from-green-400 to-emerald-400" },
  { type: "location", icon: MapPinned, label: "Lugar", color: "from-red-400 to-orange-400" },
  { type: "quote", icon: Quote, label: "Frase", color: "from-amber-400 to-yellow-400" },
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
  const [locationAddress, setLocationAddress] = useState("");

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
    setLocationAddress("");
  };

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
            const locationData: LocationData = {
              name: locationName,
              address: locationAddress || undefined,
              lat: 0, // Would be set by Google Places API in full implementation
              lng: 0,
            };
            result = await createLocationMemoryAction({
              date,
              locationData,
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
          className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${color}`}
          >
            <Icon className="h-6 w-6 text-white" />
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

  const renderSongForm = () => (
    <div className="space-y-4 p-4">
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
            Enlace (Spotify, Apple Music, YouTube)
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
    </div>
  );

  const renderLocationForm = () => (
    <div className="space-y-4 p-4">
      <div>
        <Label htmlFor="locationName">Nombre del lugar</Label>
        <Input
          id="locationName"
          placeholder="Ej: Caffè Florian"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="locationAddress">Dirección (opcional)</Label>
        <Input
          id="locationAddress"
          placeholder="Ej: Piazza San Marco, Venecia"
          value={locationAddress}
          onChange={(e) => setLocationAddress(e.target.value)}
          className="mt-1.5"
        />
      </div>
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
                <Button
                  variant="outline"
                  onClick={() => setSelectedType(null)}
                  className="flex-1"
                >
                  Atrás
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || !canSubmit()}
                  className="flex-1 bg-gradient-to-r from-amber-400 to-rose-400 text-white"
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
