import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ChevronLeft, ChevronRight, Wand2, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePropertyDescription } from "~/server/openai/property_descriptions";
import { getListingDetailsWithAuth } from "~/server/queries/listing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useFormContext } from "../form-context";

// Form data interface for description page
interface DescriptionPageFormData {
  description: string;
}

interface DescriptionPageProps {
  listingId: string;
  onNext: () => void;
  onBack?: () => void;
}

export default function DescriptionPage({
  listingId,
  onNext,
  onBack,
}: DescriptionPageProps) {
  const { state, updateFormData } = useFormContext();
  const [isGenerating, setIsGenerating] = useState(false);
  const [, setIsSignatureDialogOpen] = useState(false);
  const [saveError] = useState<string | null>(null);

  // Get current form data from context
  const formData = {
    description: state.formData.description ?? "",
  };

  // Update form data helper
  const updateField = (field: keyof DescriptionPageFormData, value: string) => {
    updateFormData({ [field]: value });
  };

  // Handle description input
  const handleDescriptionChange = (value: string) => {
    updateField("description", value);
  };

  const handleGenerateDescription = async () => {
    try {
      setIsGenerating(true);
      // Fetch complete listing data for description generation
      const listingDetails = await getListingDetailsWithAuth(Number(listingId));

      // Convert null values to undefined to match PropertyListing interface
      const propertyData = Object.fromEntries(
        Object.entries(listingDetails).map(([key, value]) => [
          key,
          value ?? undefined,
        ]),
      );

      const generated = await generatePropertyDescription(propertyData);
      handleDescriptionChange(generated);
    } finally {
      setIsGenerating(false);
    }
  };

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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Descripción</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsSignatureDialogOpen(true)}>
              Añadir Firma
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Textarea
        id="description"
        value={formData.description}
        onChange={(e) => handleDescriptionChange(e.target.value)}
        className="min-h-[200px] resize-y border-gray-200 transition-colors focus:border-gray-400 focus:ring-gray-300"
        placeholder="Describe las características principales de la propiedad, su ubicación, y cualquier detalle relevante que pueda interesar a los potenciales compradores o inquilinos."
      />
      <div className="flex justify-center pt-2">
        <Button
          type="button"
          onClick={handleGenerateDescription}
          disabled={isGenerating}
          className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-amber-400 to-rose-400 px-6 py-2.5 font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-amber-500 hover:to-rose-500 hover:shadow-xl active:scale-95"
        >
          {isGenerating ? (
            <>
              <Wand2 className="mr-2 h-4 w-4 animate-spin" />
              Generando descripción...
            </>
          ) : (
            <>
              Asistente de descripción
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {saveError}
          </motion.div>
        )}
      </AnimatePresence>

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
