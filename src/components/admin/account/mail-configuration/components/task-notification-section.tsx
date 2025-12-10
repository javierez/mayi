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
import type { TaskNotificationSettings } from "../types";
import { NotificationOptionRow } from "./notification-option-row";

interface TaskNotificationSectionProps {
  title: string;
  description: string;
  settings: TaskNotificationSettings;
  onToggleEmail: (optionKey: keyof TaskNotificationSettings) => void;
  onToggleSMS: (optionKey: keyof TaskNotificationSettings) => void;
  isCritical?: boolean;
}

export function TaskNotificationSection({
  title,
  description,
  settings,
  onToggleEmail,
  onToggleSMS,
  isCritical = false,
}: TaskNotificationSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter out 1h/2h options for non-critical tasks when counting
  const visibleOptions = isCritical
    ? Object.values(settings)
    : Object.entries(settings)
        .filter(([key]) => key !== "dueIn2h" && key !== "dueIn1h")
        .map(([, value]) => value);

  const enabledCount = visibleOptions.filter((opt) => opt.emailEnabled || opt.smsEnabled).length;
  const totalCount = visibleOptions.length;

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
                option={settings.dueIn1Week}
                onToggleEmail={() => onToggleEmail("dueIn1Week")}
                onToggleSMS={() => onToggleSMS("dueIn1Week")}
              />
              <NotificationOptionRow
                option={settings.dueIn48h}
                onToggleEmail={() => onToggleEmail("dueIn48h")}
                onToggleSMS={() => onToggleSMS("dueIn48h")}
              />
              <NotificationOptionRow
                option={settings.dueIn24h}
                onToggleEmail={() => onToggleEmail("dueIn24h")}
                onToggleSMS={() => onToggleSMS("dueIn24h")}
              />
              <NotificationOptionRow
                option={settings.dueIn12h}
                onToggleEmail={() => onToggleEmail("dueIn12h")}
                onToggleSMS={() => onToggleSMS("dueIn12h")}
              />
              {/* Only show 1h/2h options for critical tasks */}
              {isCritical && (
                <>
                  <NotificationOptionRow
                    option={settings.dueIn2h}
                    onToggleEmail={() => onToggleEmail("dueIn2h")}
                    onToggleSMS={() => onToggleSMS("dueIn2h")}
                  />
                  <NotificationOptionRow
                    option={settings.dueIn1h}
                    onToggleEmail={() => onToggleEmail("dueIn1h")}
                    onToggleSMS={() => onToggleSMS("dueIn1h")}
                  />
                </>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

