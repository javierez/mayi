import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import { Input } from "./input";

interface FloatingLabelInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  disabled?: boolean;
  type?: string;
  required?: boolean;
  name?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function FloatingLabelInput({
  id,
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  type = "text",
  required = false,
  name,
  onBlur,
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;
  const shouldShowLabel = isFocused || hasValue;

  return (
    <motion.div
      className="relative"
      animate={{
        marginTop: shouldShowLabel ? "32px" : "10px",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <AnimatePresence>
        {shouldShowLabel && (
          <motion.label
            htmlFor={id}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -12 }}
            exit={{ opacity: 0, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute -top-2 left-0 z-10 px-2 text-xs font-medium text-gray-600"
          >
            {placeholder}
            {required && <span className="ml-1 text-red-500">*</span>}
          </motion.label>
        )}
      </AnimatePresence>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          if (onBlur) {
            onBlur(e);
          }
        }}
        placeholder={shouldShowLabel ? "" : placeholder}
        disabled={disabled}
        required={required}
        className={cn(
          "h-10 border border-gray-200 shadow-md transition-all duration-200",
          className,
        )}
      />
    </motion.div>
  );
}
