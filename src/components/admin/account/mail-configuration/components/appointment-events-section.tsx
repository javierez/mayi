"use client";

import { useState } from "react";
import { CalendarClock, ChevronDown, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import type { AppointmentEventNotificationSettings } from "../types";
import { NotificationOptionRow } from "./notification-option-row";

interface AppointmentEventsSectionProps {
  settings: AppointmentEventNotificationSettings;
  onToggleEmail: (optionKey: keyof AppointmentEventNotificationSettings) => void;
  onToggleSMS: (optionKey: keyof AppointmentEventNotificationSettings) => void;
}

export function AppointmentEventsSection({
  settings,
  onToggleEmail,
  onToggleSMS,
}: AppointmentEventsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const enabledCount = Object.values(settings).filter(
    (opt) => opt.emailEnabled || opt.smsEnabled,
  ).length;
  const totalCount = Object.values(settings).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-gray-200">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-4 hover:bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="mr-2 h-4 w-4 text-gray-600" />
                <div>
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Eventos de Citas
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs text-gray-500">
                    Notificaciones cuando se programan, reprograman o cancelan citas
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">
                  {enabledCount}/{totalCount}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="divide-y divide-gray-100">
              {(
                Object.keys(
                  settings,
                ) as Array<keyof AppointmentEventNotificationSettings>
              ).map((key) => (
                <NotificationOptionRow
                  key={key}
                  option={settings[key]}
                  onToggleEmail={() => onToggleEmail(key)}
                  onToggleSMS={() => onToggleSMS(key)}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

