"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { updateProperty } from "~/server/queries/properties";
import { updateListingWithAuth } from "~/server/queries/listing";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveQueueItem {
  type: "property" | "listing";
  id: number;
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

// Local state tracking for immediate UI updates
interface LocalStateItem {
  type: "property" | "listing";
  id: number;
  data: Record<string, unknown>;
  status: "pending" | "saving" | "saved" | "error";
  timestamp: number;
}

// Callback for when local state updates
type StateUpdateCallback = (updates: {
  propertyChanges?: Record<string, unknown>;
  listingChanges?: Record<string, unknown>;
}) => void;

interface SaveContextType {
  saveStatus: SaveStatus;
  queuePropertyChanges: (
    propertyId: number,
    changes: Record<string, unknown>,
  ) => void;
  queueListingChanges: (
    listingId: number,
    changes: Record<string, unknown>,
  ) => void;
  updateFormPositionOnly: (
    propertyId: number,
    position: number,
  ) => Promise<void>;
  forceFlush: () => Promise<void>;
  // New methods for local state management
  registerStateUpdateCallback: (callback: StateUpdateCallback) => () => void;
  getLocalState: () => {
    property: Record<string, unknown>;
    listing: Record<string, unknown>;
  };
  clearLocalState: () => void;
}

const SaveContext = createContext<SaveContextType | undefined>(undefined);

const BATCH_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

export function SaveProvider({ children }: { children: React.ReactNode }) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveQueue, setSaveQueue] = useState<Map<string, SaveQueueItem>>(
    new Map(),
  );
  const [retryQueue, setRetryQueue] = useState<SaveQueueItem[]>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Local state management
  const [localState, setLocalState] = useState<Map<string, LocalStateItem>>(
    new Map(),
  );
  const stateUpdateCallbacks = useRef<Set<StateUpdateCallback>>(new Set());

  // Helper to show saved status temporarily
  const showSavedStatus = useCallback(() => {
    setSaveStatus("saved");
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    statusTimerRef.current = setTimeout(() => {
      setSaveStatus("idle");
    }, 2000);
  }, []);

  // Notify all registered callbacks about state changes
  const notifyStateUpdate = useCallback(
    (updates: {
      propertyChanges?: Record<string, unknown>;
      listingChanges?: Record<string, unknown>;
    }) => {
      stateUpdateCallbacks.current.forEach((callback) => {
        try {
          callback(updates);
        } catch (error) {
          console.error("Error in state update callback:", error);
        }
      });
    },
    [],
  );

  // Register callback for state updates
  const registerStateUpdateCallback = useCallback(
    (callback: StateUpdateCallback) => {
      stateUpdateCallbacks.current.add(callback);

      // Return unregister function
      return () => {
        stateUpdateCallbacks.current.delete(callback);
      };
    },
    [],
  );

  // Get current local state
  const getLocalState = useCallback(() => {
    const property: Record<string, unknown> = {};
    const listing: Record<string, unknown> = {};

    localState.forEach((item) => {
      if (item.type === "property") {
        Object.assign(property, item.data);
      } else if (item.type === "listing") {
        Object.assign(listing, item.data);
      }
    });

    return { property, listing };
  }, [localState]);

  // Clear local state
  const clearLocalState = useCallback(() => {
    setLocalState(new Map());
  }, []);

  // Process the save queue
  const processSaveQueue = useCallback(async () => {
    if (saveQueue.size === 0) return;

    setSaveStatus("saving");
    const itemsToSave = Array.from(saveQueue.values());
    setSaveQueue(new Map()); // Clear queue immediately

    // Update local state to 'saving' status
    setLocalState((prev) => {
      const newState = new Map(prev);
      itemsToSave.forEach((item) => {
        const key = `${item.type}-${item.id}`;
        const existing = newState.get(key);
        if (existing) {
          newState.set(key, { ...existing, status: "saving" });
        }
      });
      return newState;
    });

    try {
      // Group saves by type and ID for efficient batching
      const propertyUpdates = new Map<number, Record<string, unknown>>();
      const listingUpdates = new Map<number, Record<string, unknown>>();

      itemsToSave.forEach((item) => {
        if (item.type === "property") {
          const existing = propertyUpdates.get(item.id) ?? {};
          propertyUpdates.set(item.id, { ...existing, ...item.data });
        } else if (item.type === "listing") {
          const existing = listingUpdates.get(item.id) ?? {};
          listingUpdates.set(item.id, { ...existing, ...item.data });
        }
      });

      // Execute all saves in parallel
      const promises: Promise<unknown>[] = [];

      propertyUpdates.forEach((data, id) => {
        promises.push(updateProperty(id, data));
      });

      listingUpdates.forEach((data, id) => {
        promises.push(updateListingWithAuth(id, data));
      });

      await Promise.all(promises);

      // Update local state to 'saved' status
      setLocalState((prev) => {
        const newState = new Map(prev);
        itemsToSave.forEach((item) => {
          const key = `${item.type}-${item.id}`;
          const existing = newState.get(key);
          if (existing) {
            newState.set(key, { ...existing, status: "saved" });
          }
        });
        return newState;
      });

      showSavedStatus();
      // No more refreshListingDetails calls - local state is the source of truth
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");

      // Update local state to 'error' status
      setLocalState((prev) => {
        const newState = new Map(prev);
        itemsToSave.forEach((item) => {
          const key = `${item.type}-${item.id}`;
          const existing = newState.get(key);
          if (existing) {
            newState.set(key, { ...existing, status: "error" });
          }
        });
        return newState;
      });

      // Add failed items to retry queue
      itemsToSave.forEach((item) => {
        if (item.retries < MAX_RETRIES) {
          setRetryQueue((prev) => [
            ...prev,
            { ...item, retries: item.retries + 1 },
          ]);
        }
      });

      // Show error status for longer
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [saveQueue, showSavedStatus]);

  // Process retry queue
  useEffect(() => {
    if (retryQueue.length === 0) return;

    const item = retryQueue[0];
    if (!item) return;

    const delay =
      RETRY_DELAYS[item.retries - 1] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];

    const timer = setTimeout(() => {
      setRetryQueue((prev) => prev.slice(1));
      setSaveQueue((prev) => {
        const newQueue = new Map(prev);
        const key = `${item.type}-${item.id}`;
        newQueue.set(key, item);
        return newQueue;
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [retryQueue]);

  // Batch timer effect
  useEffect(() => {
    if (saveQueue.size === 0) {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
        batchTimerRef.current = null;
      }
      return;
    }

    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
    }

    batchTimerRef.current = setTimeout(() => {
      void processSaveQueue();
    }, BATCH_DELAY);

    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, [saveQueue, processSaveQueue]);

  // Queue property changes
  const queuePropertyChanges = useCallback(
    (propertyId: number, changes: Record<string, unknown>) => {
      // Filter out unchanged or empty values
      const filteredChanges = Object.entries(changes).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );

      if (Object.keys(filteredChanges).length === 0) return;

      // Update local state immediately for optimistic UI
      setLocalState((prev) => {
        const newState = new Map(prev);
        const key = `property-${propertyId}`;
        const existing = newState.get(key);

        if (existing) {
          newState.set(key, {
            ...existing,
            data: { ...existing.data, ...filteredChanges },
            status: "pending",
            timestamp: Date.now(),
          });
        } else {
          newState.set(key, {
            type: "property",
            id: propertyId,
            data: filteredChanges,
            status: "pending",
            timestamp: Date.now(),
          });
        }

        return newState;
      });

      // Notify callbacks about state update
      notifyStateUpdate({ propertyChanges: filteredChanges });

      setSaveQueue((prev) => {
        const newQueue = new Map(prev);
        const key = `property-${propertyId}`;
        const existing = newQueue.get(key);

        if (existing) {
          // Merge with existing queued changes
          newQueue.set(key, {
            ...existing,
            data: { ...existing.data, ...filteredChanges },
            timestamp: Date.now(),
          });
        } else {
          newQueue.set(key, {
            type: "property",
            id: propertyId,
            data: filteredChanges,
            timestamp: Date.now(),
            retries: 0,
          });
        }

        return newQueue;
      });
    },
    [notifyStateUpdate],
  );

  // Queue listing changes
  const queueListingChanges = useCallback(
    (listingId: number, changes: Record<string, unknown>) => {
      const filteredChanges = Object.entries(changes).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );

      if (Object.keys(filteredChanges).length === 0) return;

      // Update local state immediately for optimistic UI
      setLocalState((prev) => {
        const newState = new Map(prev);
        const key = `listing-${listingId}`;
        const existing = newState.get(key);

        if (existing) {
          newState.set(key, {
            ...existing,
            data: { ...existing.data, ...filteredChanges },
            status: "pending",
            timestamp: Date.now(),
          });
        } else {
          newState.set(key, {
            type: "listing",
            id: listingId,
            data: filteredChanges,
            status: "pending",
            timestamp: Date.now(),
          });
        }

        return newState;
      });

      // Notify callbacks about state update
      notifyStateUpdate({ listingChanges: filteredChanges });

      setSaveQueue((prev) => {
        const newQueue = new Map(prev);
        const key = `listing-${listingId}`;
        const existing = newQueue.get(key);

        if (existing) {
          newQueue.set(key, {
            ...existing,
            data: { ...existing.data, ...filteredChanges },
            timestamp: Date.now(),
          });
        } else {
          newQueue.set(key, {
            type: "listing",
            id: listingId,
            data: filteredChanges,
            timestamp: Date.now(),
            retries: 0,
          });
        }

        return newQueue;
      });
    },
    [notifyStateUpdate],
  );

  // Update form position immediately (not batched)
  const updateFormPositionOnly = useCallback(
    async (propertyId: number, position: number) => {
      try {
        await updateProperty(propertyId, { formPosition: position });
      } catch (error) {
        console.error("Failed to update form position:", error);
        // Don't show error for position updates - they're not critical
      }
    },
    [],
  );

  // Force flush the queue (useful for form submission or navigation away)
  const forceFlush = useCallback(async () => {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    await processSaveQueue();
  }, [processSaveQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  return (
    <SaveContext.Provider
      value={{
        saveStatus,
        queuePropertyChanges,
        queueListingChanges,
        updateFormPositionOnly,
        forceFlush,
        registerStateUpdateCallback,
        getLocalState,
        clearLocalState,
      }}
    >
      {children}
    </SaveContext.Provider>
  );
}

export function useSaveQueue() {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error("useSaveQueue must be used within SaveProvider");
  }
  return context;
}
