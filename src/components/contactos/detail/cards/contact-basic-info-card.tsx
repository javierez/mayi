import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { ModernSaveIndicator } from "~/components/propiedades/form/common/modern-save-indicator";
import { CONTACT_SOURCES, CONTACT_SOURCE_LABELS } from "~/types/contact-source";

type SaveState = "idle" | "modified" | "saving" | "saved" | "error";
type ModuleName = "basicInfo" | "contactDetails" | "notes";

interface ContactBasicInfoCardProps {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  nif: string;
  setNif: (value: string) => void;
  source: string;
  setSource: (value: string) => void;
  saveState: SaveState;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  getCardStyles: (moduleName: ModuleName) => string;
  canEdit?: boolean;
}

export function ContactBasicInfoCard({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  nif,
  setNif,
  source,
  setSource,
  saveState,
  onSave,
  onUpdateModule,
  getCardStyles,
  canEdit = true,
}: ContactBasicInfoCardProps) {
  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("basicInfo"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide">
          INFORMACIÓN BÁSICA
        </h3>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="text-sm">
            Nombre
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
            className="h-8 text-gray-500 placeholder:text-gray-300"
            placeholder="Nombre"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-sm">
            Apellidos
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
            className="h-8 text-gray-500 placeholder:text-gray-300"
            placeholder="Apellidos"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nif" className="text-sm">
            DNI
          </Label>
          <Input
            id="nif"
            value={nif}
            onChange={(e) => {
              setNif(e.target.value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
            className="h-8 text-gray-500 placeholder:text-gray-300"
            placeholder="Opcional"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="source" className="text-sm">
            Origen
          </Label>
          <Select
            value={source ?? undefined}
            onValueChange={(value) => {
              setSource(value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
          >
            <SelectTrigger className="h-8 text-gray-500">
              <SelectValue placeholder="Seleccionar origen" />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_SOURCES.map((sourceOption) => (
                <SelectItem key={sourceOption} value={sourceOption}>
                  {CONTACT_SOURCE_LABELS[sourceOption]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
