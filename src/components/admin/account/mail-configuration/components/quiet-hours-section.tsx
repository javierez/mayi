"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { QuietHoursSettings } from "../types";
import { daysOfWeek, timeOptions } from "../constants";

interface QuietHoursSectionProps {
  settings: QuietHoursSettings;
  onUpdate: (newSettings: QuietHoursSettings) => void;
}

export function QuietHoursSection({
  settings,
  onUpdate,
}: QuietHoursSectionProps) {
  const toggleDay = (dayId: keyof QuietHoursSettings["days"]) => {
    const newDays = {
      ...settings.days,
      [dayId]: !settings.days[dayId],
    };
    // Auto-enable if any day is selected
    const hasSelectedDays = Object.values(newDays).some((selected) => selected);
    onUpdate({
      ...settings,
      days: newDays,
      enabled: hasSelectedDays,
    });
  };

  return (
    <div className="space-y-4 border-b border-gray-200 pb-6">
      {/* Modern rounded square day buttons */}
      <div className="flex items-center justify-center gap-4">
        {daysOfWeek.flatMap((day, index) => [
          <button
            key={day.id}
            type="button"
            onClick={() => toggleDay(day.id)}
            className={`
              flex h-12 w-12 items-center justify-center rounded-xl font-mono text-base font-semibold tracking-tight transition-all
              ${
                settings.days[day.id]
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }
            `}
            title={day.fullLabel}
          >
            {day.label}
          </button>,
          ...(index < daysOfWeek.length - 1
            ? [<span key={`${day.id}-separator`} className="text-gray-400">-</span>]
            : []),
        ])}
      </div>
      
      {/* Modern digital clock time pickers */}
      <div className="flex items-center justify-center gap-2">
        <Select
          value={settings.startTime}
          onValueChange={(value) =>
            onUpdate({ ...settings, startTime: value, enabled: true })
          }
        >
          <SelectTrigger className="h-12 w-20 rounded-lg border border-gray-300 bg-gray-50 px-2 py-2 font-mono text-sm font-semibold text-gray-900 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-100 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-1">
            <SelectValue>
              <span className="font-mono">{settings.startTime}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((time) => (
              <SelectItem key={time.value} value={time.value}>
                {time.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <span className="text-sm font-medium text-gray-400">-</span>
        
        <Select
          value={settings.endTime}
          onValueChange={(value) =>
            onUpdate({ ...settings, endTime: value, enabled: true })
          }
        >
          <SelectTrigger className="h-12 w-20 rounded-lg border border-gray-300 bg-gray-50 px-2 py-2 font-mono text-sm font-semibold text-gray-900 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-100 focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-1">
            <SelectValue>
              <span className="font-mono">{settings.endTime}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((time) => (
              <SelectItem key={time.value} value={time.value}>
                {time.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

