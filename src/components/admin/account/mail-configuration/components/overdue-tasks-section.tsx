"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
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
import type { OverdueTaskNotificationSettings } from "../types";
import { NotificationOptionRow } from "./notification-option-row";

interface OverdueTasksSectionProps {
  settings: OverdueTaskNotificationSettings;
  onToggleEmail: (optionKey: keyof OverdueTaskNotificationSettings) => void;
  onToggleSMS: (optionKey: keyof OverdueTaskNotificationSettings) => void;
}

export function OverdueTasksSection({
  settings,
  onToggleEmail,
  onToggleSMS,
}: OverdueTasksSectionProps) {
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
                <AlertCircle className="mr-2 h-4 w-4 text-gray-600" />
                <div>
                  <CardTitle className="text-sm font-medium text-gray-900">
                    Tareas Vencidas
                  </CardTitle>
                  <CardDescription className="mt-0.5 text-xs text-gray-500">
                    Notificaciones para tareas que ya pasaron su fecha límite
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
              <NotificationOptionRow
                option={settings.weeklyDigest}
                onToggleEmail={() => onToggleEmail("weeklyDigest")}
                onToggleSMS={() => onToggleSMS("weeklyDigest")}
              />
              <NotificationOptionRow
                option={settings.dailyDigest}
                onToggleEmail={() => onToggleEmail("dailyDigest")}
                onToggleSMS={() => onToggleSMS("dailyDigest")}
              />
              <NotificationOptionRow
                option={settings.notifyWhenOverdue}
                onToggleEmail={() => onToggleEmail("notifyWhenOverdue")}
                onToggleSMS={() => onToggleSMS("notifyWhenOverdue")}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

