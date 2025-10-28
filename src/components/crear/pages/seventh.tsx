import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Home,
  Sparkles,
  Trees,
  Zap,
  WashingMachine,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFormContext } from "../form-context";

interface SeventhPageProps {
  listingId: string;
  onNext: () => void;
  onBack?: () => void;
}

export default function SeventhPage({ onNext, onBack }: SeventhPageProps) {
  const { state, updateFormData } = useFormContext();

  const propertyType = state.formData.propertyType ?? "";

  // Get current form data from context
  const formData = {
    views: !!state.formData.views,
    mountainViews: !!state.formData.mountainViews,
    seaViews: !!state.formData.seaViews,
    beachfront: !!state.formData.beachfront,
    jacuzzi:
      (Array.isArray(state.formData.luxuryFeatures) &&
        state.formData.luxuryFeatures.includes("jacuzzi")) ||
      false,
    hydromassage:
      (Array.isArray(state.formData.luxuryFeatures) &&
        state.formData.luxuryFeatures.includes("hydromassage")) ||
      false,
    fireplace: !!state.formData.fireplace,
    garden: !!state.formData.hasGarden,
    pool: !!state.formData.hasSwimmingPool,
    homeAutomation: !!state.formData.smartHome,
    musicSystem: !!state.formData.musicSystem,
    laundryRoom: !!state.formData.hasLaundryRoom,
    coveredClothesline: !!state.formData.coveredClothesline,
    gym: !!state.formData.gym,
    sportsArea: !!state.formData.sportsArea,
    childrenArea: !!state.formData.childrenArea,
    suiteBathroom: !!state.formData.suiteBathroom,
    nearbyPublicTransport: !!state.formData.nearbyPublicTransport,
    communityPool: !!state.formData.communityPool,
    privatePool: !!state.formData.privatePool,
    tennisCourt: !!state.formData.tennisCourt,
  };

  // Update form data helper
  const updateField = (field: string, value: boolean) => {
    if (field === "jacuzzi" || field === "hydromassage") {
      // Handle luxury features array
      const currentFeatures = Array.isArray(state.formData.luxuryFeatures)
        ? [...state.formData.luxuryFeatures]
        : [];

      if (value) {
        if (!currentFeatures.includes(field)) {
          currentFeatures.push(field);
        }
      } else {
        const index = currentFeatures.indexOf(field);
        if (index > -1) {
          currentFeatures.splice(index, 1);
        }
      }
      updateFormData({
        luxuryFeatures: currentFeatures,
        // Also save individual boolean fields for database
        [field]: value,
      });
    } else if (field === "garden") {
      updateFormData({ hasGarden: value });
    } else if (field === "pool") {
      updateFormData({ hasSwimmingPool: value });
    } else if (field === "homeAutomation") {
      updateFormData({ smartHome: value });
    } else if (field === "laundryRoom") {
      updateFormData({ hasLaundryRoom: value });
    } else {
      updateFormData({ [field]: value });
    }
  };

  // Handle property type-specific logic
  useEffect(() => {
    // For garage properties, skip this page entirely
    if (propertyType === "garaje") {
      onNext();
      return;
    }
  }, [propertyType, onNext]);

  const handleNext = () => {
    // Navigate IMMEDIATELY - no saves, completely instant!
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          Extras de Lujo y Confort
        </h2>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {/* Views */}
        <div className="space-y-4 rounded-lg p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">Vistas</h4>
            <Eye className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="views"
                checked={formData.views}
                onCheckedChange={(checked) => updateField("views", !!checked)}
              />
              <Label htmlFor="views" className="text-sm">
                Vistas
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mountainViews"
                checked={formData.mountainViews}
                onCheckedChange={(checked) =>
                  updateField("mountainViews", !!checked)
                }
              />
              <Label htmlFor="mountainViews" className="text-sm">
                Vistas montaña
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="seaViews"
                checked={formData.seaViews}
                onCheckedChange={(checked) =>
                  updateField("seaViews", !!checked)
                }
              />
              <Label htmlFor="seaViews" className="text-sm">
                Vistas mar
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="beachfront"
                checked={formData.beachfront}
                onCheckedChange={(checked) =>
                  updateField("beachfront", !!checked)
                }
              />
              <Label htmlFor="beachfront" className="text-sm">
                Primera línea
              </Label>
            </div>
          </div>
        </div>

        {/* Wellness - Hide for solar properties */}
        {propertyType !== "solar" && (
          <div className="space-y-4 rounded-lg p-4 shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-600">Bienestar</h4>
              <Sparkles className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="jacuzzi"
                  checked={formData.jacuzzi}
                  onCheckedChange={(checked) =>
                    updateField("jacuzzi", !!checked)
                  }
                />
                <Label htmlFor="jacuzzi" className="text-sm">
                  Jacuzzi
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hydromassage"
                  checked={formData.hydromassage}
                  onCheckedChange={(checked) =>
                    updateField("hydromassage", !!checked)
                  }
                />
                <Label htmlFor="hydromassage" className="text-sm">
                  Hidromasaje
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fireplace"
                  checked={formData.fireplace}
                  onCheckedChange={(checked) =>
                    updateField("fireplace", !!checked)
                  }
                />
                <Label htmlFor="fireplace" className="text-sm">
                  Chimenea
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="suiteBathroom"
                  checked={formData.suiteBathroom}
                  onCheckedChange={(checked) =>
                    updateField("suiteBathroom", !!checked)
                  }
                />
                <Label htmlFor="suiteBathroom" className="text-sm">
                  Baño en suite
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Outdoor Features - Hide for solar properties */}
        {propertyType !== "solar" && (
          <div className="space-y-4 rounded-lg p-4 shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-600">Exterior</h4>
              <Trees className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="garden"
                  checked={formData.garden}
                  onCheckedChange={(checked) =>
                    updateField("garden", !!checked)
                  }
                />
                <Label htmlFor="garden" className="text-sm">
                  Jardín
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pool"
                  checked={formData.pool}
                  onCheckedChange={(checked) => updateField("pool", !!checked)}
                />
                <Label htmlFor="pool" className="text-sm">
                  Piscina
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privatePool"
                  checked={formData.privatePool}
                  onCheckedChange={(checked) =>
                    updateField("privatePool", !!checked)
                  }
                />
                <Label htmlFor="privatePool" className="text-sm">
                  Piscina privada
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="communityPool"
                  checked={formData.communityPool}
                  onCheckedChange={(checked) =>
                    updateField("communityPool", !!checked)
                  }
                />
                <Label htmlFor="communityPool" className="text-sm">
                  Piscina comunitaria
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tennisCourt"
                  checked={formData.tennisCourt}
                  onCheckedChange={(checked) =>
                    updateField("tennisCourt", !!checked)
                  }
                />
                <Label htmlFor="tennisCourt" className="text-sm">
                  Pista de tenis
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Community Amenities - Hide for solar properties */}
        {propertyType !== "solar" && (
          <div className="space-y-4 rounded-lg p-4 shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-600">
                Comunitarios
              </h4>
              <Home className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gym"
                  checked={formData.gym}
                  onCheckedChange={(checked) => updateField("gym", !!checked)}
                />
                <Label htmlFor="gym" className="text-sm">
                  Gimnasio
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sportsArea"
                  checked={formData.sportsArea}
                  onCheckedChange={(checked) =>
                    updateField("sportsArea", !!checked)
                  }
                />
                <Label htmlFor="sportsArea" className="text-sm">
                  Zona deportiva
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="childrenArea"
                  checked={formData.childrenArea}
                  onCheckedChange={(checked) =>
                    updateField("childrenArea", !!checked)
                  }
                />
                <Label htmlFor="childrenArea" className="text-sm">
                  Zona infantil
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Location Features - Show for all property types */}
        <div className="space-y-4 rounded-lg p-4 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-medium text-gray-600">Ubicación</h4>
            <Home className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="nearbyPublicTransport"
                checked={formData.nearbyPublicTransport}
                onCheckedChange={(checked) =>
                  updateField("nearbyPublicTransport", !!checked)
                }
              />
              <Label htmlFor="nearbyPublicTransport" className="text-sm">
                Transporte público cercano
              </Label>
            </div>
          </div>
        </div>

        {/* Smart Home - Hide for solar properties */}
        {propertyType !== "solar" && (
          <div className="space-y-4 rounded-lg p-4 shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-600">Domótica</h4>
              <Zap className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="homeAutomation"
                  checked={formData.homeAutomation}
                  onCheckedChange={(checked) =>
                    updateField("homeAutomation", !!checked)
                  }
                />
                <Label htmlFor="homeAutomation" className="text-sm">
                  Domótica
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="musicSystem"
                  checked={formData.musicSystem}
                  onCheckedChange={(checked) =>
                    updateField("musicSystem", !!checked)
                  }
                />
                <Label htmlFor="musicSystem" className="text-sm">
                  Sistema de música
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Utility Rooms - Hide for solar properties */}
        {propertyType !== "solar" && (
          <div className="col-span-full space-y-4 rounded-lg p-4 shadow-md">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-600">Estancias</h4>
              <WashingMachine className="h-4 w-4 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="laundryRoom"
                  checked={formData.laundryRoom}
                  onCheckedChange={(checked) =>
                    updateField("laundryRoom", !!checked)
                  }
                />
                <Label htmlFor="laundryRoom" className="text-sm">
                  Lavadero
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="coveredClothesline"
                  checked={formData.coveredClothesline}
                  onCheckedChange={(checked) =>
                    updateField("coveredClothesline", !!checked)
                  }
                />
                <Label htmlFor="coveredClothesline" className="text-sm">
                  Tendedero cubierto
                </Label>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        className="flex justify-between border-t pt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            onClick={onBack}
            disabled={!onBack}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleNext}
            className="flex items-center space-x-1 bg-gray-900 hover:bg-gray-800"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
