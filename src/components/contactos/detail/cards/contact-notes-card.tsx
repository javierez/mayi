import { Card } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { ModernSaveIndicator } from "~/components/propiedades/form/common/modern-save-indicator";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";

type SaveState = "idle" | "modified" | "saving" | "saved" | "error";
type ModuleName = "basicInfo" | "contactDetails" | "notes";

interface ContactNotesCardProps {
  notes: string;
  setNotes: (value: string) => void;
  saveState: SaveState;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  getCardStyles: (moduleName: ModuleName) => string;
  canEdit?: boolean;
}

export function ContactNotesCard({
  notes,
  setNotes,
  saveState,
  onSave,
  onUpdateModule,
  getCardStyles,
  canEdit = true,
}: ContactNotesCardProps) {
  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("notes"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide">NOTAS</h3>
      </div>
      <div className="space-y-3">
        <div className="relative space-y-1.5">
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
            className="min-h-[120px] resize-y border-gray-200 pr-10 transition-colors focus:border-gray-400 focus:ring-gray-300"
            placeholder="Información adicional sobre el contacto..."
          />
          <PushToTalkWhisperButton
            onTranscript={(text) => {
              setNotes((prev) => {
                const newValue = prev ? `${prev} ${text}`.trim() : text;
                onUpdateModule(true);
                return newValue;
              });
            }}
            language="es"
            disabled={!canEdit}
          />
        </div>
      </div>
    </Card>
  );
}
