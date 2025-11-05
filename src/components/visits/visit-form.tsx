"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { SignaturePad } from "./signature-pad";
import { VisitBreadcrumb } from "./visit-breadcrumb";
import { toast } from "sonner";
import { createVisitAction } from "~/server/actions/visits";
import { Save, Loader, Eye } from "lucide-react";
import type { AppointmentWithDetails, VisitFormData } from "~/types/visits";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";
import Link from "next/link";

interface VisitFormProps {
  appointment: AppointmentWithDetails;
}

export function VisitForm({ appointment }: VisitFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<VisitFormData>({
    appointmentId: appointment.appointmentId,
    notes: appointment.notes ?? "",
  });
  const [agentSignature, setAgentSignature] = useState<string | null>(null);
  const [visitorSignature, setVisitorSignature] = useState<string | null>(null);
  const [marketingConsent, setMarketingConsent] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🚀 Form submission started", {
      formData,
      agentSignature: !!agentSignature,
      visitorSignature: !!visitorSignature,
    });

    if (!agentSignature || !visitorSignature) {
      console.log("❌ Missing signatures", {
        agentSignature: !!agentSignature,
        visitorSignature: !!visitorSignature,
      });
      toast.error("Ambas firmas son requeridas");
      return;
    }

    if (!appointment.listingId) {
      console.log("❌ Missing listingId", { appointment });
      toast.error("La propiedad es requerida para esta cita");
      return;
    }

    setIsLoading(true);

    try {
      console.log("📤 Calling createVisitAction with:", {
        ...formData,
        agentSignature: agentSignature ? "present" : "missing",
        visitorSignature: visitorSignature ? "present" : "missing",
      });

      const result = await createVisitAction({
        ...formData,
        agentSignature,
        visitorSignature,
      });

      console.log("📥 createVisitAction result:", result);

      if (result.success) {
        console.log("✅ Visit created successfully");
        toast.success("Visita registrada correctamente");
        router.push("/calendario");
      } else {
        console.log("❌ Visit creation failed:", result.error);
        toast.error(result.error ?? "Error al registrar la visita");
      }
    } catch (error) {
      console.error("💥 Error submitting visit:", error);
      toast.error("Error al registrar la visita");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/calendario");
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <VisitBreadcrumb />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Registro de Visita
              </h1>
              <p className="mt-1 text-sm text-gray-600 sm:text-base">
                {appointment.propertyStreet ?? "Propiedad"}
              </p>
            </div>
            <Link
              href={`/templates/visita/${appointment.appointmentId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Vista Previa
              </Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-8">
          {/* Visit Details */}
          <div className="space-y-6 rounded-lg border bg-white p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Detalles de la Visita
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Contacto
                </label>
                <p className="mt-1 rounded-md bg-gray-50 p-3 text-gray-700">
                  {appointment.contactFirstName} {appointment.contactLastName}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900">
                  DNI / NIF
                </label>
                <p className="mt-1 rounded-md bg-gray-50 p-3 text-gray-700">
                  {appointment.contactNif ?? "No especificado"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900">
                  Agente
                </label>
                <p className="mt-1 rounded-md bg-gray-50 p-3 text-gray-700">
                  {appointment.agentName ??
                    `${appointment.agentFirstName} ${appointment.agentLastName}`}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900">
                  Fecha y Hora
                </label>
                <p className="mt-1 rounded-md bg-gray-50 p-3 text-gray-700">
                  {formatDateTime(appointment.datetimeStart)}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-900">
                  Propiedad
                </label>
                <p className="mt-1 rounded-md bg-gray-50 p-3 text-gray-700">
                  {appointment.propertyStreet ?? "Propiedad no especificada"}
                  {appointment.propertyAddressDetails &&
                    ` - ${appointment.propertyAddressDetails}`}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900">
                Notas de la Visita
              </label>
              <div className="relative mt-1">
                <Textarea
                  value={formData.notes ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Observaciones, comentarios del cliente, detalles relevantes..."
                  className="pr-10"
                  rows={4}
                />
                <PushToTalkWhisperButton
                  onTranscript={(text) => {
                    setFormData((prev) => ({
                      ...prev,
                      notes: prev.notes
                        ? `${prev.notes} ${text}`.trim()
                        : text,
                    }));
                  }}
                  language="es"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Condiciones */}
          <div className="space-y-4 rounded-lg border bg-white p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Control de Visitas
            </h2>

            <div className="space-y-4 text-sm text-gray-700">
              <p className="italic leading-relaxed">
                El inmueble arriba indicado ha sido visitado por el cliente en el
                día de hoy en compañía de{" "}
                <span className="font-medium">
                  {appointment.agentName ??
                    `${appointment.agentFirstName} ${appointment.agentLastName}`}
                </span>
                , en representación de la agencia de la propiedad inmobiliaria.
              </p>
            </div>

            <div className="mt-6 rounded-md bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">NOTA:</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-800">
                Con la firma de este documento ambas partes reconocen la
                mediación de la Agencia de la Propiedad Inmobiliaria y
                subsistirá el derecho a sus honorarios, aunque el contrato de
                Compra-Venta o Alquiler sea perfeccionado por las mismas, sin
                intervención de Agencia.
              </p>
            </div>
          </div>

          {/* Protección de Datos */}
          <div className="space-y-4 rounded-lg border bg-white p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Protección de Datos
            </h2>

            <div className="space-y-4 text-xs leading-relaxed text-gray-700 sm:text-sm">
              <p>
                De conformidad con lo establecido en el REGLAMENTO (UE) 2016/679
                de protección de datos de carácter personal, le informamos que
                los datos que usted nos facilite serán incorporados al sistema de
                tratamiento titularidad de su agencia inmobiliaria. Los datos
                proporcionados se conservarán mientras se mantenga la relación
                comercial durante los años necesarios para cumplir con las
                obligaciones legales. Los datos no se cederán a terceros, salvo
                en los casos que exista una obligación legal. Usted tiene derecho
                a obtener confirmación sobre si estamos tratando sus datos
                personales, por tanto tiene derecho a acceder a sus datos
                personales, rectificar los datos inexactos o solicitar su
                supresión cuando los datos no sean necesarios.
              </p>

              <div className="space-y-2 pt-2">
                <p className="text-sm text-gray-800">
                  Así mismo solicito su autorización para ofrecerle productos y
                  servicios relacionados con los solicitados y fidelizarle como
                  cliente:
                </p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setMarketingConsent(true)}
                    className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                      marketingConsent
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarketingConsent(false)}
                    className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                      !marketingConsent
                        ? "border-gray-400 bg-gray-100 text-gray-900"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="space-y-6 rounded-lg border bg-white p-4 sm:space-y-8 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">Firmas</h2>

            <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
              <SignaturePad
                label="Firma del Agente"
                onSignatureChange={setAgentSignature}
                required
              />

              <SignaturePad
                label="Firma del Visitante"
                onSignatureChange={setVisitorSignature}
                required
              />
            </div>

            <p className="text-center text-xs text-gray-600 sm:text-sm">
              Ambas partes deben firmar en las áreas designadas para confirmar
              la visita.
            </p>
          </div>

          {/* Submit */}
          <div className="sticky bottom-4 flex flex-col justify-end gap-3 rounded-lg border bg-white p-4 shadow-lg sm:flex-row sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !agentSignature || !visitorSignature}
              className="w-full sm:w-auto sm:min-w-[150px]"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Registrar Visita
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
