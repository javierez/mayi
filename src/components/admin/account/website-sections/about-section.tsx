"use client";

import { useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import {
  Users,
  Plus,
  Trash2,
  User,
  Calculator,
  Megaphone,
  Briefcase,
  Map,
  Clock,
  MessageSquare,
  Handshake,
  HelpCircle,
  Home,
  Key,
  Shield,
  Star,
  Phone,
  Mail,
} from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { KPIConfiguration } from "./components/kpi-configuration";
import type { AboutSectionProps } from "../types/website-sections";

// Available icons for services
const AVAILABLE_ICONS = [
  { value: "user", label: "Servicio personalizado", icon: User },
  { value: "calculator", label: "Valoraciones", icon: Calculator },
  { value: "megaphone", label: "Marketing", icon: Megaphone },
  { value: "briefcase", label: "Gestión integral", icon: Briefcase },
  { value: "map", label: "Conocimiento local", icon: Map },
  { value: "clock", label: "Soporte 24/7", icon: Clock },
  { value: "message-square", label: "Comunicación", icon: MessageSquare },
  { value: "handshake", label: "Negociación", icon: Handshake },
  { value: "help-circle", label: "Soporte continuo", icon: HelpCircle },
  { value: "home", label: "Propiedades", icon: Home },
  { value: "key", label: "Acceso", icon: Key },
  { value: "shield", label: "Protección", icon: Shield },
  { value: "star", label: "Calidad", icon: Star },
  { value: "phone", label: "Contacto", icon: Phone },
  { value: "mail", label: "Correo", icon: Mail },
];

function ServicesConfiguration({ form }: { form: any }) {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  const { fields, append, remove } = useFieldArray({
    control: form.control, // eslint-disable-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    name: "aboutProps.services",
  });

  const addService = () => {
    append({
      title: "",
      icon: "user",
    });
  };

  const removeService = (index: number) => {
    remove(index);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Servicios Ofrecidos ({fields.length})
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addService}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Agregar Servicio
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Plus className="h-6 w-6 text-gray-400" />
          </div>
          <h4 className="mt-4 text-sm font-medium text-gray-900">
            No hay servicios configurados
          </h4>
          <p className="mt-2 text-sm text-gray-500">
            Agrega servicios para mostrar en la sección &quot;Sobre
            Nosotros&quot;
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addService}
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Primer Servicio
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="relative rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                {/* Service Title */}
                <div className="md:col-span-7">
                  <FormField
                    control={form.control} // eslint-disable-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    name={`aboutProps.services.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Título del Servicio
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""} // eslint-disable-line @typescript-eslint/no-unsafe-assignment
                            placeholder="Ej: Asesoramiento personalizado"
                            className="bg-white"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Icon Selection */}
                <div className="md:col-span-4">
                  <FormField
                    control={form.control} // eslint-disable-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    name={`aboutProps.services.${index}.icon`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Icono</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""} // eslint-disable-line @typescript-eslint/no-unsafe-assignment
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Seleccionar icono">
                                {field.value && (
                                  <div className="flex items-center gap-2">
                                    {(() => {
                                      const selectedIcon = AVAILABLE_ICONS.find(
                                        (icon) => icon.value === field.value,
                                      );
                                      if (selectedIcon) {
                                        const IconComponent = selectedIcon.icon;
                                        return (
                                          <>
                                            <IconComponent className="h-4 w-4" />
                                            <span>{selectedIcon.label}</span>
                                          </>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AVAILABLE_ICONS.map((iconOption) => {
                              const IconComponent = iconOption.icon;
                              return (
                                <SelectItem
                                  key={iconOption.value}
                                  value={iconOption.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    <span>{iconOption.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Remove Button */}
                <div className="flex items-end md:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(index)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Service Number Badge */}
              <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <FormField
        control={form.control} // eslint-disable-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        name="aboutProps.maxServicesDisplayed"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Máximo de servicios a mostrar</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="number"
                placeholder="6"
                min="1"
                max="20"
                onChange={(e) => field.onChange(parseInt(e.target.value) || 6)}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {fields.length > 0 && (
        <div className="text-xs text-gray-500">
          💡 Tip: Los servicios aparecerán en la página web en el orden que los
          hayas configurado aquí
        </div>
      )}
    </div>
  );
}

export function AboutSection({
  form,
  isActive,
  onUnsavedChanges,
}: AboutSectionProps) {
  // Watch for form changes to detect unsaved changes - PRESERVE existing logic
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith("aboutProps")) {
        onUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onUnsavedChanges]);

  // Only render when active section
  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Users className="h-5 w-5 text-gray-500" />
          Sobre Nosotros
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Información sobre tu empresa
        </p>
      </div>

      <div className="space-y-4">
        {/* Title Field */}
        <FormField
          control={form.control}
          name="aboutProps.title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Sobre Nosotros" />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Subtitle Field */}
        <FormField
          control={form.control}
          name="aboutProps.subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtítulo</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tu socio de confianza en el viaje inmobiliario"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Main Content Field */}
        <FormField
          control={form.control}
          name="aboutProps.content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido Principal</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="En nuestra inmobiliaria, creemos que encontrar la propiedad perfecta..."
                  rows={4}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Secondary Content Field */}
        <FormField
          control={form.control}
          name="aboutProps.content2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido Secundario</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Nuestro enfoque personalizado y atención al detalle..."
                  rows={4}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Image Field */}
        <FormField
          control={form.control}
          name="aboutProps.image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="https://ejemplo.com/nosotros.jpg"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Section Titles */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="aboutProps.servicesSectionTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título Sección Servicios</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nuestros Servicios" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="aboutProps.aboutSectionTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título Sección Misión</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nuestra Misión" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Button Text Field */}
        <FormField
          control={form.control}
          name="aboutProps.buttonName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto del Botón</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Contacta a Nuestro Equipo" />
              </FormControl>
            </FormItem>
          )}
        />

        {/* KPI Configuration - INTEGRATE KpiConfiguration sub-component */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-700">
            Indicadores Clave (KPIs)
          </h3>
          <KPIConfiguration form={form} />
        </div>

        {/* Services Configuration */}
        <ServicesConfiguration form={form} />
      </div>
    </div>
  );
}
