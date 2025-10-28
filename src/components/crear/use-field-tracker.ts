import { useState, useCallback, useRef, useEffect } from "react";

interface UseFieldTrackerOptions {
  onFieldChange?: (field: string, value: unknown, prevValue: unknown) => void;
}

export function useFieldTracker<T extends Record<string, unknown>>(
  initialData: T,
  options?: UseFieldTrackerOptions,
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [changedFields, setChangedFields] = useState<Set<keyof T>>(new Set());
  const initialDataRef = useRef<T>(initialData);
  const previousDataRef = useRef<T>(initialData);

  // Update initial data when it changes (e.g., when data loads from server)
  useEffect(() => {
    // Only update if the data has actually changed
    const hasDataChanged =
      JSON.stringify(initialData) !== JSON.stringify(initialDataRef.current);
    if (hasDataChanged) {
      initialDataRef.current = initialData;
      previousDataRef.current = initialData;
      setFormData(initialData);
      setChangedFields(new Set());
    }
  }, [initialData]);

  // Update a single field
  const updateField = useCallback(
    (field: keyof T, value: unknown) => {
      const prevValue = previousDataRef.current[field];

      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
        previousDataRef.current = updated;
        return updated;
      });

      // Track if field has changed from initial value
      if (
        JSON.stringify(value) !== JSON.stringify(initialDataRef.current[field])
      ) {
        setChangedFields((prev) => new Set(prev).add(field));
      } else {
        setChangedFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(field);
          return newSet;
        });
      }

      // Call the callback if provided
      options?.onFieldChange?.(String(field), value, prevValue);
    },
    [options],
  );

  // Update multiple fields at once
  const updateFields = useCallback(
    (updates: Partial<T>) => {
      const prevData = previousDataRef.current;

      setFormData((prev) => {
        const updated = { ...prev, ...updates };
        previousDataRef.current = updated;
        return updated;
      });

      // Track which fields have changed from initial values
      setChangedFields((prev) => {
        const newChangedFields = new Set(prev);

        Object.entries(updates).forEach(([field, value]) => {
          const fieldKey = field as keyof T;
          if (
            JSON.stringify(value) !==
            JSON.stringify(initialDataRef.current[fieldKey])
          ) {
            newChangedFields.add(fieldKey);
          } else {
            newChangedFields.delete(fieldKey);
          }

          // Call the callback for each field if provided
          const prevValue = prevData[fieldKey];
          options?.onFieldChange?.(String(fieldKey), value, prevValue);
        });

        return newChangedFields;
      });
    },
    [options],
  );

  // Get only the fields that have changed
  const getChangedData = useCallback((): Partial<T> => {
    const changed: Partial<T> = {};
    changedFields.forEach((field) => {
      changed[field] = formData[field];
    });
    return changed;
  }, [formData, changedFields]);

  // Check if a specific field has changed
  const hasFieldChanged = useCallback(
    (field: keyof T): boolean => {
      return changedFields.has(field);
    },
    [changedFields],
  );

  // Check if any fields have changed
  const hasChanges = useCallback((): boolean => {
    return changedFields.size > 0;
  }, [changedFields]);

  // Reset to initial data
  const resetForm = useCallback(() => {
    setFormData(initialDataRef.current);
    previousDataRef.current = initialDataRef.current;
    setChangedFields(new Set());
  }, []);

  // Mark all current data as saved (new baseline)
  const markAsSaved = useCallback(() => {
    initialDataRef.current = formData;
    setChangedFields(new Set());
  }, [formData]);

  // Get a comparison of current vs initial
  const getDiff = useCallback((): {
    field: string;
    initial: unknown;
    current: unknown;
  }[] => {
    const diff: { field: string; initial: unknown; current: unknown }[] = [];

    changedFields.forEach((field) => {
      diff.push({
        field: String(field),
        initial: initialDataRef.current[field],
        current: formData[field],
      });
    });

    return diff;
  }, [formData, changedFields]);

  return {
    formData,
    changedFields,
    updateField,
    updateFields,
    getChangedData,
    hasFieldChanged,
    hasChanges,
    resetForm,
    markAsSaved,
    getDiff,
  };
}
