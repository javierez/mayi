"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import type { AppointmentNotificationSettings } from "../types";
import { NotificationOptionRow } from "./notification-option-row";

interface AppointmentNotificationSectionProps {
  title: string;
  settings: AppointmentNotificationSettings;
  onToggleEmail: (optionKey: keyof AppointmentNotificationSettings) => void;
  onToggleSMS: (optionKey: keyof AppointmentNotificationSettings) => void;
}

export function AppointmentNotificationSection({
  title,
  settings,
  onToggleEmail,
  onToggleSMS,
}: AppointmentNotificationSectionProps) {
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
              <CardTitle className="text-sm font-medium text-gray-900">
                {title}
              </CardTitle>
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
                option={settings.weeklyBriefing}
                onToggleEmail={() => onToggleEmail("weeklyBriefing")}
                onToggleSMS={() => onToggleSMS("weeklyBriefing")}
              />
              <NotificationOptionRow
                option={settings.dailyBriefing}
                onToggleEmail={() => onToggleEmail("dailyBriefing")}
                onToggleSMS={() => onToggleSMS("dailyBriefing")}
              />
              <NotificationOptionRow
                option={settings.notify24h}
                onToggleEmail={() => onToggleEmail("notify24h")}
                onToggleSMS={() => onToggleSMS("notify24h")}
              />
              <NotificationOptionRow
                option={settings.notify12h}
                onToggleEmail={() => onToggleEmail("notify12h")}
                onToggleSMS={() => onToggleSMS("notify12h")}
              />
              <NotificationOptionRow
                option={settings.notify1h}
                onToggleEmail={() => onToggleEmail("notify1h")}
                onToggleSMS={() => onToggleSMS("notify1h")}
              />
              <NotificationOptionRow
                option={settings.notify30min}
                onToggleEmail={() => onToggleEmail("notify30min")}
                onToggleSMS={() => onToggleSMS("notify30min")}
              />
              <NotificationOptionRow
                option={settings.notifyTravelTime}
                onToggleEmail={() => onToggleEmail("notifyTravelTime")}
                onToggleSMS={() => onToggleSMS("notifyTravelTime")}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

