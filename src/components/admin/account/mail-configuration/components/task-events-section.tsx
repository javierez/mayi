"use client";

import { useState } from "react";
import { Bell, ChevronDown, ChevronRight } from "lucide-react";
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
import type { TaskEventNotificationSettings } from "../types";
import { TaskEventNotificationRow } from "./task-event-notification-row";

interface TaskEventsSectionProps {
  settings: TaskEventNotificationSettings;
  onToggleEmail: (optionKey: keyof TaskEventNotificationSettings) => void;
  onToggleSMS: (optionKey: keyof TaskEventNotificationSettings) => void;
  onToggleUrgency?: (optionKey: keyof TaskEventNotificationSettings, level: number) => void;
}

export function TaskEventsSection({
  settings,
  onToggleEmail,
  onToggleSMS,
  onToggleUrgency,
}: TaskEventsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const enabledCount = (Object.values(settings) as Array<{ emailEnabled: boolean; smsEnabled: boolean }>).filter(
    (opt) => Boolean(opt.emailEnabled) || Boolean(opt.smsEnabled),
  ).length;
  const totalCount = Object.values(settings).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border border-gray-200">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-4 hover:bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="mr-2 h-4 w-4 text-gray-600" />
                <div>
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Eventos de Tareas
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs text-gray-500">
                    Notificaciones cuando se asignan, completan o reasignan tareas
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
                Object.keys(settings) as Array<keyof TaskEventNotificationSettings>
              ).map((key) => (
                <TaskEventNotificationRow
                  key={key}
                  option={settings[key]}
                  onToggleEmail={() => onToggleEmail(key)}
                  onToggleSMS={() => onToggleSMS(key)}
                  onToggleUrgency={
                    onToggleUrgency && (key === "taskAssigned" || key === "taskCompleted" || key === "taskReassigned")
                      ? (level) => onToggleUrgency(key, level)
                      : undefined
                  }
                  showUrgencySelector={key === "taskAssigned" || key === "taskCompleted" || key === "taskReassigned"}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

