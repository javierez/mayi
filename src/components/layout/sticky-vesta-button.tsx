"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";
import {
  searchFields,
  groupFieldsByCard,
  type FieldDefinition,
} from "~/lib/property-field-index";

export function StickyVestaButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Check if we're on a property detail page
  const isPropertyPage = useMemo(() => {
    return /^\/propiedades\/\d+/.test(pathname ?? "");
  }, [pathname]);

  // Search results
  const searchResults = useMemo(() => {
    return searchFields(searchQuery);
  }, [searchQuery]);

  // Grouped results for display
  const groupedResults = useMemo(() => {
    return groupFieldsByCard(searchResults);
  }, [searchResults]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => {
    const results: FieldDefinition[] = [];
    Object.values(groupedResults).forEach((fields) => {
      results.push(...fields);
    });
    return results;
  }, [groupedResults]);

  // Handle field selection
  const handleSelectField = useCallback((field: FieldDefinition) => {
    // Close modal
    setIsOpen(false);
    setSearchQuery("");
    setSelectedIndex(0);

    // Dispatch custom event for property form to handle
    window.dispatchEvent(
      new CustomEvent("vesta:navigate-to-field", {
        detail: {
          sectionKey: field.sectionKey,
          inputId: field.inputId,
          label: field.label,
        },
      }),
    );
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatResults.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            handleSelectField(flatResults[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery("");
          setSelectedIndex(0);
          break;
      }
    },
    [flatResults, selectedIndex, handleSelectField],
  );

  // Global keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    if (!isPropertyPage) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isPropertyPage]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && flatResults.length > 0) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      );
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, flatResults.length]);

  // Get current index in flat list
  const getFieldIndex = (field: FieldDefinition): number => {
    return flatResults.findIndex((f) => f.inputId === field.inputId);
  };

  // Render command palette for property pages
  if (isPropertyPage) {
    return (
      <>
        {/* Sticky Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          aria-label="Buscar campo (⌘K)"
          title="Buscar campo (⌘K)"
        >
          <Image
            src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/vesta-small.png"
            alt="Vesta"
            width={32}
            height={32}
            className="object-contain"
          />
        </button>

        {/* Command Palette Modal */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
            <DialogTitle className="sr-only">Buscar campo</DialogTitle>

            {/* Search Input */}
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Buscar campo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 border-0 px-0 focus-visible:ring-0"
              />
              <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={resultsRef}
              className="max-h-[300px] overflow-y-auto p-2"
            >
              {flatResults.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No se encontraron campos
                </div>
              ) : (
                Object.entries(groupedResults).map(([cardName, fields]) => (
                  <div key={cardName} className="mb-2">
                    {/* Card Name Header */}
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      {cardName}
                    </div>
                    {/* Fields */}
                    {fields.map((field) => {
                      const index = getFieldIndex(field);
                      const isSelected = index === selectedIndex;
                      return (
                        <button
                          key={field.inputId}
                          data-index={index}
                          onClick={() => handleSelectField(field)}
                          className={`flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-sm transition-colors ${
                            isSelected
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          <span className="mr-2 text-muted-foreground">→</span>
                          <span>{field.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <span>
                  <kbd className="rounded border bg-muted px-1">↑</kbd>
                  <kbd className="ml-0.5 rounded border bg-muted px-1">↓</kbd>
                  {" "}navegar
                </span>
                <span>
                  <kbd className="rounded border bg-muted px-1">↵</kbd>
                  {" "}seleccionar
                </span>
              </div>
              <span>
                <kbd className="rounded border bg-muted px-1">esc</kbd>
                {" "}cerrar
              </span>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Default "Coming Soon" modal for non-property pages
  return (
    <>
      {/* Sticky Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        aria-label="Vesta"
      >
        <Image
          src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/vesta-small.png"
          alt="Vesta"
          width={32}
          height={32}
          className="object-contain"
        />
      </button>

      {/* Coming Soon Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="border-none bg-white/95 backdrop-blur-sm sm:max-w-xs">
          <DialogTitle className="sr-only">Vesta AI</DialogTitle>
          <div className="flex flex-col items-center py-6">
            <Image
              src="https://vesta-configuration-files.s3.us-east-1.amazonaws.com/logos/vesta-small.png"
              alt="Vesta"
              width={48}
              height={48}
              className="object-contain"
            />
            <p className="mt-4 text-lg font-medium text-gray-700">
              Proximamente...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
