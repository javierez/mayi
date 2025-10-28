"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface DaysDropdownProps {
  value: number;
  onChange: (days: number) => void;
  options?: number[];
  className?: string;
}

export default function DaysDropdown({
  value,
  onChange,
  options = [1, 2, 3, 5, 7, 10, 14, 21, 30],
  className = "",
}: DaysDropdownProps) {
  return (
    <Select
      value={value.toString()}
      onValueChange={(val) => onChange(parseInt(val))}
    >
      <SelectTrigger className={`h-8 w-20 text-xs ${className}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((days) => (
          <SelectItem key={days} value={days.toString()}>
            {days}d
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
