import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { ModernSaveIndicator } from "~/components/propiedades/form/common/modern-save-indicator";

type SaveState = "idle" | "modified" | "saving" | "saved" | "error";
type ModuleName = "basicInfo" | "contactDetails" | "notes";

interface ContactDetailsCardProps {
  email: string;
  setEmail: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  phoneNotes: string;
  setPhoneNotes: (value: string) => void;
  secondaryPhone: string;
  setSecondaryPhone: (value: string) => void;
  secondaryPhoneNotes: string;
  setSecondaryPhoneNotes: (value: string) => void;
  saveState: SaveState;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  getCardStyles: (moduleName: ModuleName) => string;
  canEdit?: boolean;
}

export function ContactDetailsCard({
  email,
  setEmail,
  address,
  setAddress,
  phone,
  setPhone,
  phoneNotes,
  setPhoneNotes,
  secondaryPhone,
  setSecondaryPhone,
  secondaryPhoneNotes,
  setSecondaryPhoneNotes,
  saveState,
  onSave,
  onUpdateModule,
  getCardStyles,
  canEdit = true,
}: ContactDetailsCardProps) {
  return (
    <Card
      className={cn(
        "relative p-4 transition-all duration-500 ease-out",
        getCardStyles("contactDetails"),
      )}
    >
      <ModernSaveIndicator state={saveState} onSave={onSave} />
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide">
          DATOS DE CONTACTO
        </h3>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
            className="h-8 text-gray-500"
            placeholder="contacto@email.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-sm">
            Dirección
          </Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
            className="h-8 text-gray-500 placeholder:text-gray-300"
            placeholder="Calle, número, ciudad..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm">
            Teléfono
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
            className="h-8 text-gray-500 placeholder:text-gray-300"
            placeholder="Teléfono principal"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phoneNotes" className="text-xs text-muted-foreground">
            Notas del Teléfono
          </Label>
          <Textarea
            id="phoneNotes"
            value={phoneNotes}
            onChange={(e) => {
              setPhoneNotes(e.target.value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
            className="min-h-[50px] text-sm text-gray-400 placeholder:text-gray-300"
            placeholder="Notas sobre el teléfono principal..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="secondaryPhone" className="text-sm">
            Teléfono Secundario
          </Label>
          <Input
            id="secondaryPhone"
            type="tel"
            value={secondaryPhone}
            onChange={(e) => {
              setSecondaryPhone(e.target.value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
            className="h-8 text-gray-500 placeholder:text-gray-300"
            placeholder="Teléfono alternativo"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="secondaryPhoneNotes"
            className="text-xs text-muted-foreground"
          >
            Notas del Teléfono Secundario
          </Label>
          <Textarea
            id="secondaryPhoneNotes"
            value={secondaryPhoneNotes}
            onChange={(e) => {
              setSecondaryPhoneNotes(e.target.value);
              onUpdateModule(true);
            }}
            disabled={!canEdit}
            className="min-h-[50px] text-sm text-gray-400 placeholder:text-gray-300"
            placeholder="Notas sobre el teléfono secundario..."
          />
        </div>
      </div>
    </Card>
  );
}
