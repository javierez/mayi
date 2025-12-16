"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import type { MailSettings } from "./types";
import { defaultSettings, taskCategories, appointmentTypes } from "./constants";
import {
  getNotificationSettingsAction,
  updateNotificationSettingsAction,
} from "~/app/actions/notification-settings";
import { QuietHoursSection } from "./components/quiet-hours-section";
import { TaskEventsSection } from "./components/task-events-section";
import { OverdueTasksSection } from "./components/overdue-tasks-section";
import { TaskNotificationSection } from "./components/task-notification-section";
import { AppointmentEventsSection } from "./components/appointment-events-section";
import { AppointmentNotificationSection } from "./components/appointment-notification-section";
import { CustomerPropertyNotificationSection } from "./components/customer-property-notification-section";
import { CustomerDocumentNotificationSection } from "./components/customer-document-notification-section";
import { CustomerDealNotificationSection } from "./components/customer-deal-notification-section";
import { CustomerAppointmentNotificationSection } from "./components/customer-appointment-notification-section";
import type {
  TaskNotificationSettings,
  OverdueTaskNotificationSettings,
  TaskEventNotificationSettings,
  AppointmentNotificationSettings,
  AppointmentEventNotificationSettings,
  CustomerAppointmentNotificationSettings,
  CustomerPropertyNotificationSettings,
  CustomerDocumentNotificationSettings,
  CustomerDealNotificationSettings,
} from "./types";

export const MailConfiguration = () => {
  const [settings, setSettings] = useState<MailSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from server on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getNotificationSettingsAction();
        
        if (result.success && result.data) {
          setSettings(result.data);
        } else {
          setError(result.error ?? "Failed to load notification settings");
          // Use defaults on error
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.error("Error loading notification settings:", err);
        setError("Failed to load notification settings");
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const handleTaskToggle = (
    category: "critical" | "urgent" | "other",
    optionKey: keyof TaskNotificationSettings,
    channel: "email" | "sms",
  ) => {
    setSettings((prev) => {
      const currentOption = prev.tasks[category][optionKey];
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [category]: {
            ...prev.tasks[category],
            [optionKey]: {
              ...currentOption,
              emailEnabled: channel === "email" ? !currentOption.emailEnabled : currentOption.emailEnabled,
              smsEnabled: channel === "sms" ? !currentOption.smsEnabled : currentOption.smsEnabled,
            },
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleOverdueToggle = (
    optionKey: keyof OverdueTaskNotificationSettings,
    channel: "email" | "sms",
  ) => {
    setSettings((prev) => {
      const currentOption = prev.tasks.overdue[optionKey];
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          overdue: {
            ...prev.tasks.overdue,
            [optionKey]: {
              ...currentOption,
              emailEnabled: channel === "email" ? !currentOption.emailEnabled : currentOption.emailEnabled,
              smsEnabled: channel === "sms" ? !currentOption.smsEnabled : currentOption.smsEnabled,
            },
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleOverdueUrgencyToggle = (
    optionKey: keyof OverdueTaskNotificationSettings,
    level: number,
  ) => {
    setSettings((prev) => {
      const currentOption = prev.tasks.overdue[optionKey];
      const currentUrgencyLevels = currentOption.urgencyLevels ?? [];
      const newUrgencyLevels = currentUrgencyLevels.includes(level)
        ? currentUrgencyLevels.filter((l) => l !== level)
        : [...currentUrgencyLevels, level].sort((a, b) => a - b);

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          overdue: {
            ...prev.tasks.overdue,
            [optionKey]: {
              ...currentOption,
              urgencyLevels: newUrgencyLevels,
            },
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleTaskEventToggle = (
    optionKey: keyof TaskEventNotificationSettings,
    channel: "email" | "sms",
  ) => {
    setSettings((prev) => {
      const currentOption = prev.tasks.events[optionKey];
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          events: {
            ...prev.tasks.events,
            [optionKey]: {
              ...currentOption,
              emailEnabled: channel === "email" ? !currentOption.emailEnabled : currentOption.emailEnabled,
              smsEnabled: channel === "sms" ? !currentOption.smsEnabled : currentOption.smsEnabled,
            },
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleTaskEventUrgencyToggle = (
    optionKey: keyof TaskEventNotificationSettings,
    level: number,
  ) => {
    setSettings((prev) => {
      const currentOption = prev.tasks.events[optionKey];
      const currentUrgencyLevels = currentOption.urgencyLevels ?? [];
      const newUrgencyLevels = currentUrgencyLevels.includes(level)
        ? currentUrgencyLevels.filter((l) => l !== level)
        : [...currentUrgencyLevels, level].sort((a, b) => a - b);

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          events: {
            ...prev.tasks.events,
            [optionKey]: {
              ...currentOption,
              urgencyLevels: newUrgencyLevels,
            },
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleAppointmentToggle = (
    appointmentType: keyof Omit<MailSettings["appointments"], "events">,
    optionKey: keyof AppointmentNotificationSettings,
    channel: "email" | "sms",
  ) => {
    setSettings((prev) => {
      const currentOption = prev.appointments[appointmentType][optionKey];
      return {
        ...prev,
        appointments: {
          ...prev.appointments,
          [appointmentType]: {
            ...prev.appointments[appointmentType],
            [optionKey]: {
              ...currentOption,
              emailEnabled: channel === "email" ? !currentOption.emailEnabled : currentOption.emailEnabled,
              smsEnabled: channel === "sms" ? !currentOption.smsEnabled : currentOption.smsEnabled,
            },
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleAppointmentEventToggle = (
    optionKey: keyof AppointmentEventNotificationSettings,
    channel: "email" | "sms",
  ) => {
    setSettings((prev) => {
      const currentOption = prev.appointments.events[optionKey];
      return {
        ...prev,
        appointments: {
          ...prev.appointments,
          events: {
            ...prev.appointments.events,
            [optionKey]: {
              ...currentOption,
              emailEnabled: channel === "email" ? !currentOption.emailEnabled : currentOption.emailEnabled,
              smsEnabled: channel === "sms" ? !currentOption.smsEnabled : currentOption.smsEnabled,
            },
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleQuietHoursUpdate = (newSettings: MailSettings["quietHours"]) => {
    setSettings((prev) => ({
      ...prev,
      quietHours: newSettings,
    }));
    setHasChanges(true);
  };

  const handleCustomerAppointmentToggle = (
    appointmentType: keyof Omit<MailSettings["customers"]["appointments"], never>,
    optionKey: keyof CustomerAppointmentNotificationSettings,
    channel: "email" | "sms",
  ) => {
    setSettings((prev) => {
      const currentOption = prev.customers.appointments[appointmentType][optionKey];
      return {
        ...prev,
        customers: {
          ...prev.customers,
          appointments: {
            ...prev.customers.appointments,
            [appointmentType]: {
              ...prev.customers.appointments[appointmentType],
              [optionKey]: {
                ...currentOption,
                emailEnabled: channel === "email" ? !currentOption.emailEnabled : currentOption.emailEnabled,
                smsEnabled: channel === "sms" ? !currentOption.smsEnabled : currentOption.smsEnabled,
              },
            },
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleCustomerPropertyToggle = (
    optionKey: keyof CustomerPropertyNotificationSettings,
    channel: "email" | "sms",
  ) => {
    setSettings((prev) => {
      const currentOption = prev.customers.properties[optionKey];
      return {
        ...prev,
        customers: {
          ...prev.customers,
          properties: {
            ...prev.customers.properties,
            [optionKey]: {
              ...currentOption,
              emailEnabled: channel === "email" ? !currentOption.emailEnabled : currentOption.emailEnabled,
              smsEnabled: channel === "sms" ? !currentOption.smsEnabled : currentOption.smsEnabled,
            },
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleCustomerDocumentToggle = (
    optionKey: keyof CustomerDocumentNotificationSettings,
    channel: "email" | "sms",
  ) => {
    setSettings((prev) => {
      const currentOption = prev.customers.documents[optionKey];
      return {
        ...prev,
        customers: {
          ...prev.customers,
          documents: {
            ...prev.customers.documents,
            [optionKey]: {
              ...currentOption,
              emailEnabled: channel === "email" ? !currentOption.emailEnabled : currentOption.emailEnabled,
              smsEnabled: channel === "sms" ? !currentOption.smsEnabled : currentOption.smsEnabled,
            },
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleCustomerDealToggle = (
    optionKey: keyof CustomerDealNotificationSettings,
    channel: "email" | "sms",
  ) => {
    setSettings((prev) => {
      const currentOption = prev.customers.deals[optionKey];
      return {
        ...prev,
        customers: {
          ...prev.customers,
          deals: {
            ...prev.customers.deals,
            [optionKey]: {
              ...currentOption,
              emailEnabled: channel === "email" ? !currentOption.emailEnabled : currentOption.emailEnabled,
              smsEnabled: channel === "sms" ? !currentOption.smsEnabled : currentOption.smsEnabled,
            },
          },
        },
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await updateNotificationSettingsAction(settings);
      
      if (result.success && result.data) {
        setSettings(result.data);
        setHasChanges(false);
        toast.success("Configuración guardada");
      } else {
        const errorMessage = result.error ?? "Failed to save notification settings";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save notification settings";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Cargando configuración de notificaciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with save/cancel buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                Descartar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Notification Hours - Always visible at top */}
      <QuietHoursSection
        settings={settings.quietHours}
        onUpdate={handleQuietHoursUpdate}
      />

      {/* Tabs for Internas and Clientes */}
      <Tabs defaultValue="internas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="internas">Internas</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>

        {/* Internas Tab - Internal Notifications (Tareas + Calendario merged) */}
        <TabsContent value="internas" className="mt-6 space-y-6">
          {/* Tareas Section */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-base font-semibold text-gray-900">Tareas</h3>
            </div>
            
            {/* Task Events Section */}
            <TaskEventsSection
              settings={settings.tasks.events}
              onToggleEmail={(optionKey) =>
                handleTaskEventToggle(optionKey, "email")
              }
              onToggleSMS={(optionKey) =>
                handleTaskEventToggle(optionKey, "sms")
              }
              onToggleUrgency={(optionKey, level) =>
                handleTaskEventUrgencyToggle(optionKey, level)
              }
            />

            {/* Overdue Tasks Section */}
            <OverdueTasksSection
              settings={settings.tasks.overdue}
              onToggleEmail={(optionKey) =>
                handleOverdueToggle(optionKey, "email")
              }
              onToggleSMS={(optionKey) =>
                handleOverdueToggle(optionKey, "sms")
              }
              onToggleUrgency={(optionKey, level) =>
                handleOverdueUrgencyToggle(optionKey, level)
              }
            />

            {/* Upcoming Task Categories */}
            <div className="ml-6 mt-4 space-y-4 border-l border-gray-200 pl-4">
              <p className="text-xs text-gray-500">Por nivel de urgencia</p>
              {taskCategories.map((category) => (
                <TaskNotificationSection
                  key={category.id}
                  title={category.title}
                  settings={settings.tasks[category.id]}
                  onToggleEmail={(optionKey) =>
                    handleTaskToggle(category.id, optionKey, "email")
                  }
                  onToggleSMS={(optionKey) =>
                    handleTaskToggle(category.id, optionKey, "sms")
                  }
                  isCritical={category.id === "critical"}
                />
              ))}
            </div>
          </div>

          {/* Citas Section */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-base font-semibold text-gray-900">Citas</h3>
            </div>
            
            {/* Appointment Events Section */}
            <AppointmentEventsSection
              settings={settings.appointments.events}
              onToggleEmail={(optionKey) =>
                handleAppointmentEventToggle(optionKey, "email")
              }
              onToggleSMS={(optionKey) =>
                handleAppointmentEventToggle(optionKey, "sms")
              }
            />

            {/* Appointment Type Categories */}
            <div className="ml-6 mt-4 space-y-4 border-l border-gray-200 pl-4">
              <p className="text-xs text-gray-500">Por tipo de cita</p>
              {appointmentTypes.map((appointmentType) => (
                <AppointmentNotificationSection
                  key={appointmentType.id}
                  title={appointmentType.title}
                  settings={settings.appointments[appointmentType.id]}
                  onToggleEmail={(optionKey) =>
                    handleAppointmentToggle(appointmentType.id, optionKey, "email")
                  }
                  onToggleSMS={(optionKey) =>
                    handleAppointmentToggle(appointmentType.id, optionKey, "sms")
                  }
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Clientes Tab - External Customer Notifications */}
        <TabsContent value="clientes" className="mt-6 space-y-6">
          {/* General Customer Notifications */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-base font-semibold text-gray-900">Notificaciones generales</h3>
            </div>
            
            <CustomerPropertyNotificationSection
              settings={settings.customers.properties}
              onToggleEmail={(optionKey) =>
                handleCustomerPropertyToggle(optionKey, "email")
              }
              onToggleSMS={(optionKey) =>
                handleCustomerPropertyToggle(optionKey, "sms")
              }
            />

            <CustomerDocumentNotificationSection
              settings={settings.customers.documents}
              onToggleEmail={(optionKey) =>
                handleCustomerDocumentToggle(optionKey, "email")
              }
              onToggleSMS={(optionKey) =>
                handleCustomerDocumentToggle(optionKey, "sms")
              }
            />

            <CustomerDealNotificationSection
              settings={settings.customers.deals}
              onToggleEmail={(optionKey) =>
                handleCustomerDealToggle(optionKey, "email")
              }
              onToggleSMS={(optionKey) =>
                handleCustomerDealToggle(optionKey, "sms")
              }
            />
          </div>

          {/* Customer Appointment Reminders */}
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-base font-semibold text-gray-900">Recordatorios de citas</h3>
            </div>

            {/* Customer Appointment Type Categories */}
            <div className="ml-6 mt-4 space-y-4 border-l border-gray-200 pl-4">
              <p className="text-xs text-gray-500">Por tipo de cita</p>
              {appointmentTypes.map((appointmentType) => (
                <CustomerAppointmentNotificationSection
                  key={appointmentType.id}
                  title={appointmentType.title}
                  settings={settings.customers.appointments[appointmentType.id]}
                  onToggleEmail={(optionKey) =>
                    handleCustomerAppointmentToggle(
                      appointmentType.id,
                      optionKey,
                      "email",
                    )
                  }
                  onToggleSMS={(optionKey) =>
                    handleCustomerAppointmentToggle(
                      appointmentType.id,
                      optionKey,
                      "sms",
                    )
                  }
                />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

