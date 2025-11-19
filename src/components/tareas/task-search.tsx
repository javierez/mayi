import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";
import React, { useState } from "react";

interface TaskSearchProps {
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function TaskSearch({
  onSearchChange,
  placeholder = "Buscar por título, contacto o propiedad...",
}: TaskSearchProps) {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearchChange(newValue);
  };

  return (
    <div className="relative flex-1 md:max-w-sm">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="h-8 w-full border-0 pl-8 text-sm shadow-md"
          value={value}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

