"use client";

import { Mail, MessageSquare } from "lucide-react";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import type { CustomerNotificationOption } from "../types";

interface CustomerNotificationOptionRowProps {
  option: CustomerNotificationOption;
  onToggleEmail: () => void;
  onToggleSMS: () => void;
}

export function CustomerNotificationOptionRow({
  option,
  onToggleEmail,
  onToggleSMS,
}: CustomerNotificationOptionRowProps) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Label className="block text-sm font-medium text-gray-900">
            {option.label}
          </Label>
          <p className="mt-0.5 text-xs text-gray-500">{option.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <Switch
              checked={option.emailEnabled}
              onCheckedChange={onToggleEmail}
              className="data-[state=checked]:bg-slate-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <Switch
              checked={option.smsEnabled}
              onCheckedChange={onToggleSMS}
              className="data-[state=checked]:bg-slate-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

