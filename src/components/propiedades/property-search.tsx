import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";
import React, { useState } from "react";

interface PropertySearchProps {
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export function PropertySearch({
  onSearchChange,
  onSearch,
  placeholder = "Buscar por título, descripción, ciudad o referencia...",
}: PropertySearchProps) {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSearchChange(newValue);
  };

  const handleSearch = () => {
    onSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
}
