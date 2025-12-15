"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { FloatingLabelInput } from "~/components/ui/floating-label-input";
import { Textarea } from "~/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Check,
  Loader,
  Search,
  Clock,
  Car,
  Home,
  Users,
  PenTool,
  Handshake,
  Train,
  X,
  Plus,
  ListTodo,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createAppointmentAction,
  updateAppointmentAction,
  validateAppointmentForm,
} from "~/server/actions/appointments";
import {
  searchContactsWithAuth,
  getContactByIdWithAuth,
} from "~/server/queries/contact";
import { PushToTalkWhisperButton } from "~/components/shared/push-to-talk-whisper-button";
import {
  listListingsCompactWithAuth,
  getListingCompactByIdWithAuth,
} from "~/server/queries/listing";
import { getAgentsForSelectionWithAuth } from "~/server/queries/users";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { useSession } from "~/lib/auth-client";
import { matchesSearch, matchesPhoneSearch } from "~/lib/search-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { QuickContactModal } from "~/components/contactos/quick-contact-modal";
import { getSquareMeter } from "~/lib/properties/area-utils";

// Appointment form data interface from PRP
interface AppointmentFormData {
  contactId?: bigint;
  listingId?: bigint;
  leadId?: bigint;
  dealId?: bigint;
  prospectId?: bigint;
  startDate: string; // DD-MM-YYYY format (internal format)
  startTime: string; // HH:mm format
  endDate: string; // DD-MM-YYYY format (internal format)
  endTime: string; // HH:mm format
  tripTimeMinutes?: number;
  title: string; // Appointment title
  notes?: string;
  appointmentType: "Visita" | "Reunión" | "Firma" | "Cierre" | "Viaje" | "Tarea";
  assignedTo?: string; // FK → users.id (who is assigned to the appointment)
}

interface Contact {
  contactId: bigint;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface Listing {
  listingId: bigint;
  title: string | null;
  referenceNumber: string | null;
  price: string;
  listingType: string;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareMeter: number | null;
  builtSurfaceArea: number | null;
  city: string | null;
  agentName: string | null;
  imageUrl: string | null;
}

// Props interface
interface AppointmentFormProps {
  initialData?: Partial<AppointmentFormData>;
  onSubmit?: (appointmentId: bigint) => void;
  onCancel?: () => void;
  mode?: "create" | "edit"; // New prop to distinguish between create and edit modes
  appointmentId?: bigint; // Required for edit mode
  // Optimistic update functions
  addOptimisticEvent?: (event: Partial<Record<string, unknown>>) => bigint;
  removeOptimisticEvent?: (tempId: bigint) => void;
  updateOptimisticEvent?: (
    tempId: bigint,
    updates: Partial<Record<string, unknown>>,
  ) => void;
}

// Helper function to get tomorrow's date in DD-MM-YYYY format
const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const year = tomorrow.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper function to get current time in HH:mm format, rounded to nearest 15 minutes
const getCurrentTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  now.setMinutes(roundedMinutes);
  now.setSeconds(0);
  now.setMilliseconds(0);

  // If rounding pushed us to next hour
  if (roundedMinutes >= 60) {
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
  }

  return now.toTimeString().slice(0, 5);
};

// Helper function to calculate end date and time from start date, start time, and duration
// Date format: DD-MM-YYYY
const calculateEndDateTime = (
  startDate: string,
  startTime: string,
  durationMinutes: number,
): { endDate: string; endTime: string } => {
  if (!startDate || !startTime) {
    return { endDate: startDate, endTime: startTime };
  }

  // Parse date and time strings to create Date object using local time components
  // Date format: DD-MM-YYYY
  const dateParts = startDate.split("-").map(Number);
  const timeParts = startTime.split(":").map(Number);
  
  if (dateParts.length !== 3 || timeParts.length < 2) {
    return { endDate: startDate, endTime: startTime };
  }
  
  const day = dateParts[0];
  const month = dateParts[1];
  const year = dateParts[2];
  const hours = timeParts[0];
  const minutes = timeParts[1];
  
  // Validate parsed values
  if (year === undefined || month === undefined || day === undefined || hours === undefined) {
    return { endDate: startDate, endTime: startTime };
  }
  
  // Create Date object using local time components (month is 0-indexed)
  const startDateTime = new Date(year, month - 1, day, hours, minutes ?? 0, 0, 0);

  // Add the duration in minutes
  startDateTime.setMinutes(startDateTime.getMinutes() + durationMinutes);

  // Extract the new date and time using local time components in DD-MM-YYYY format
  const endDate = `${String(startDateTime.getDate()).padStart(2, '0')}-${String(startDateTime.getMonth() + 1).padStart(2, '0')}-${startDateTime.getFullYear()}`;
  const endTime = `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`;

  return { endDate, endTime };
};

// Helper function to calculate duration from start and end date/time
// Date format: DD-MM-YYYY
const calculateDurationFromEndDateTime = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): { hours: number; minutes: number } => {
  if (!startDate || !startTime || !endDate || !endTime) {
    return { hours: 0, minutes: 30 };
  }

  // Parse DD-MM-YYYY format
  const startDateParts = startDate.split("-").map(Number);
  const endDateParts = endDate.split("-").map(Number);
  const startTimeParts = startTime.split(":").map(Number);
  const endTimeParts = endTime.split(":").map(Number);

  if (startDateParts.length !== 3 || endDateParts.length !== 3 || 
      startTimeParts.length < 2 || endTimeParts.length < 2) {
    return { hours: 0, minutes: 30 };
  }

  const startDateTime = new Date(
    startDateParts[2]!, // year
    startDateParts[1]! - 1, // month (0-indexed)
    startDateParts[0]!, // day
    startTimeParts[0] ?? 0,
    startTimeParts[1] ?? 0
  );

  const endDateTime = new Date(
    endDateParts[2]!, // year
    endDateParts[1]! - 1, // month (0-indexed)
    endDateParts[0]!, // day
    endTimeParts[0] ?? 0,
    endTimeParts[1] ?? 0
  );

  const diffMs = endDateTime.getTime() - startDateTime.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  return {
    hours: Math.floor(diffMinutes / 60),
    minutes: diffMinutes % 60,
  };
};

// Helper function to generate appointment title
const generateAppointmentTitle = (
  appointmentType: string,
  contactName?: string,
): string => {
  if (!contactName) {
    return appointmentType;
  }
  return `${appointmentType} - ${contactName}`;
};

const getInitialFormData = (): Omit<AppointmentFormData, "contactId"> => {
  const startDate = getTomorrowDate();
  const startTime = getCurrentTime();
  const { endDate, endTime } = calculateEndDateTime(startDate, startTime, 30);

  return {
    startDate,
    startTime,
    endDate,
    endTime,
    tripTimeMinutes: 0,
    title: "",
    notes: "",
    appointmentType: "Visita",
  };
};

// Step definitions
interface Step {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    id: "contact",
    title: "Contacto y Agente",
    icon: <User className="h-5 w-5" />,
  },
  {
    id: "details",
    title: "Detalles de la Cita",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: "confirmation",
    title: "Confirmar",
    icon: <Check className="h-5 w-5" />,
  },
];

const appointmentTypes = [
  {
    value: "Visita",
    label: "Visita",
    color: "bg-blue-100 text-blue-800",
    icon: <Home className="h-4 w-4" />,
  },
  {
    value: "Reunión",
    label: "Reunión",
    color: "bg-purple-100 text-purple-800",
    icon: <Users className="h-4 w-4" />,
  },
  {
    value: "Firma",
    label: "Firma",
    color: "bg-green-100 text-green-800",
    icon: <PenTool className="h-4 w-4" />,
  },
  {
    value: "Cierre",
    label: "Cierre",
    color: "bg-yellow-100 text-yellow-800",
    icon: <Handshake className="h-4 w-4" />,
  },
  {
    value: "Viaje",
    label: "Viaje",
    color: "bg-emerald-100 text-emerald-800",
    icon: <Train className="h-4 w-4" />,
  },
  {
    value: "Tarea",
    label: "Tarea",
    color: "bg-rose-100 text-rose-800",
    icon: <ListTodo className="h-4 w-4" />,
  },
];

export default function AppointmentForm({
  initialData = {},
  onSubmit,
  onCancel,
  mode = "create",
  appointmentId,
  addOptimisticEvent,
  removeOptimisticEvent,
  updateOptimisticEvent,
}: AppointmentFormProps) {
  // Skip contact selection step if contactId is provided
  const initialStep = initialData.contactId ? 1 : 0;
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<Partial<AppointmentFormData>>({
    ...getInitialFormData(),
    ...initialData,
  });
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isCreating, setIsCreating] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [optimisticEventId, setOptimisticEventId] = useState<bigint | null>(
    null,
  );
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const isMountedRef = useRef(true);
  // Track which field initiated the update to prevent circular recalculations
  const updateSourceRef = useRef<"duration" | "end" | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [listingSearchQuery, setListingSearchQuery] = useState("");
  // Calculate initial duration from initialData if available
  const initialDuration = (() => {
    if (
      initialData.startDate &&
      initialData.startTime &&
      initialData.endDate &&
      initialData.endTime
    ) {
      return calculateDurationFromEndDateTime(
        initialData.startDate,
        initialData.startTime,
        initialData.endDate,
        initialData.endTime,
      );
    }
    return { hours: 0, minutes: 30 };
  })();
  const [durationHours, setDurationHours] = useState(initialDuration.hours);
  const [durationMinutes, setDurationMinutes] = useState(initialDuration.minutes);
  const [agents, setAgents] = useState<
    { id: string; name: string; firstName?: string; lastName?: string }[]
  >([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState("");
  const { data: session } = useSession();

  // Calculate endTime and endDate based on startTime, startDate, and duration
  // Only run when duration changes or start changes (not when end is changed by user)
  useEffect(() => {
    // Skip if the update was triggered by changing end date/time
    if (updateSourceRef.current === "end") {
      updateSourceRef.current = null;
      return;
    }

    if (formData.startTime && formData.startDate) {
      const totalMinutes = durationHours * 60 + durationMinutes;
      const { endDate, endTime } = calculateEndDateTime(
        formData.startDate,
        formData.startTime,
        totalMinutes,
      );
      setFormData((prev) => ({ ...prev, endDate, endTime }));
    }

    // Reset the update source after processing
    updateSourceRef.current = null;
  }, [formData.startTime, formData.startDate, durationHours, durationMinutes]);

  // Cleanup effect to handle component unmounting
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Clean up optimistic event if component unmounts during creation
      if (optimisticEventId && removeOptimisticEvent) {
        removeOptimisticEvent(optimisticEventId);
      }
    };
  }, [optimisticEventId, removeOptimisticEvent]);

  // Fetch last 10 contacts on mount, then fetch when user searches
  useEffect(() => {
    // Skip this effect entirely if contact comes from URL - the dedicated effect below handles it
    if (initialData.contactId && !selectedContact) {
      return;
    }

    // For initial load, fetch last 10 contacts
    const isInitialLoad = contacts.length === 0 && searchQuery.length === 0;
    // For search, we fetch based on query
    const hasSearchQuery = searchQuery.length > 0;

    if (!isInitialLoad && !hasSearchQuery) {
      return;
    }

    const fetchContacts = async () => {
      setIsLoadingContacts(true);
      try {
        let contactsData;

        if (isInitialLoad) {
          // For initial load, get last 10 contacts
          const { listContactsWithAuth } = await import(
            "~/server/queries/contact"
          );
          contactsData = await listContactsWithAuth(1, 10); // page 1, limit 10
        } else {
          // For search, use the optimized search function
          const searchResults = await searchContactsWithAuth(
            searchQuery.trim(),
          );
          // Transform search results to match Contact interface
          contactsData = searchResults.map((result) => {
            const [firstName, ...lastNameParts] = result.name.split(" ");
            return {
              contactId: result.id,
              firstName: firstName ?? "",
              lastName: lastNameParts.join(" ") || "",
              email: result.email,
              phone: result.phone,
            };
          });
        }

        setContacts(contactsData);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setContacts([]);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    // Debounce the search to avoid too many requests (but not for initial loads)
    if (isInitialLoad) {
      void fetchContacts();
    } else {
      const debounceTimer = setTimeout(() => {
        void fetchContacts();
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, initialData.contactId, selectedContact, contacts.length]);

  // Dedicated effect to fetch a single contact when initialData.contactId is provided (e.g., from URL)
  useEffect(() => {
    // Only fetch if we have initialData.contactId but haven't set selectedContact yet
    if (!initialData.contactId || selectedContact) {
      return;
    }

    const fetchSingleContact = async () => {
      setIsLoadingContacts(true);
      try {
        // Early return if contactId is somehow undefined (shouldn't happen due to effect guard)
        if (!initialData.contactId) {
          return;
        }

        // Fetch ONLY the specific contact by ID - much more efficient than fetching all contacts
        // Convert to number since getContactByIdWithAuth accepts number parameter
        const contactIdNumber =
          typeof initialData.contactId === "bigint"
            ? Number(initialData.contactId)
            : Number(initialData.contactId);

        const matchedContact = await getContactByIdWithAuth(contactIdNumber);

        if (matchedContact) {
          // Transform to match the Contact interface expected by the form
          const formContact: Contact = {
            contactId: matchedContact.contactId,
            firstName: matchedContact.firstName,
            lastName: matchedContact.lastName,
            email: matchedContact.email,
            phone: matchedContact.phone,
          };

          setSelectedContact(formContact);
          // Also add to contacts array so it appears in search if needed
          setContacts((prev) => {
            // Only add if not already in the list
            const exists = prev.some(
              (c) =>
                c.contactId.toString() === formContact.contactId.toString(),
            );
            return exists ? prev : [formContact, ...prev];
          });
          
          // Auto-generate title when contact is loaded from initialData
          const contactName = `${formContact.firstName} ${formContact.lastName}`;
          setFormData((prev) => {
            const generatedTitle = generateAppointmentTitle(
              prev.appointmentType ?? initialData.appointmentType ?? "Visita",
              contactName,
            );
            // Only auto-generate if title is empty or matches the old pattern
            const shouldAutoGenerate = !prev.title || prev.title === prev.appointmentType || prev.title === `${prev.appointmentType} - ${prev.contactId}`;
            return {
              ...prev,
              contactId: formContact.contactId,
              title: shouldAutoGenerate ? generatedTitle : prev.title,
            };
          });
        }
      } catch (error) {
        console.error("Error fetching contact by ID:", error);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    void fetchSingleContact();
  }, [initialData.contactId, initialData.appointmentType, selectedContact]);

  // Fetch all agents when user is on step 0 (contact selection)
  useEffect(() => {
    if (currentStep !== 0) return;

    const fetchAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const agentsData = await getAgentsForSelectionWithAuth();
        const formattedAgents = agentsData.map((agent) => ({
          id: agent.id,
          name: agent.name,
          firstName: agent.firstName,
          lastName: agent.lastName ?? undefined,
        }));
        setAgents(formattedAgents);
      } catch (error) {
        console.error("Error fetching agents:", error);
      } finally {
        setIsLoadingAgents(false);
      }
    };

    void fetchAgents();
  }, [currentStep]);

  // Initialize agent selection with current user when on step 0
  useEffect(() => {
    if (currentStep === 0 && !formData.assignedTo && session?.user?.id) {
      setFormData((prev) => ({ ...prev, assignedTo: session.user.id }));
    }
  }, [currentStep, session?.user?.id, formData.assignedTo]);

  // Initialize title edit value when entering confirmation step
  useEffect(() => {
    if (currentStep === 2 && formData.title && !isEditingTitle) {
      setTitleEditValue(formData.title);
    }
  }, [currentStep, formData.title, isEditingTitle]);

  // Fetch last 10 listings on mount when on step 2, then fetch when user searches
  useEffect(() => {
    // Skip this effect entirely if listing comes from URL - the dedicated effect below handles it
    if (initialData.listingId && !selectedListing) {
      return;
    }

    // For initial load on step 1, fetch last 10 listings
    const isInitialLoad =
      currentStep === 1 &&
      listings.length === 0 &&
      listingSearchQuery.length === 0;
    // For search, we fetch based on query
    const hasSearchQuery = listingSearchQuery.length > 0;

    if (!isInitialLoad && !hasSearchQuery) {
      return;
    }

    const fetchListings = async () => {
      setIsLoadingListings(true);
      try {
        let listingsData;

        if (isInitialLoad) {
          // For initial load on step 1, get last 10 listings
          listingsData = await listListingsCompactWithAuth({
            // Get recent listings (backend will handle default filtering)
            page: 1,
            limit: 10,
          });
          console.log("Initial load listings:", listingsData);
        } else {
          // For search, use optimized search with query
          listingsData = await listListingsCompactWithAuth({
            // Search all non-draft listings
            searchQuery: listingSearchQuery.trim(),
          });
        }

        setListings(listingsData.map(listing => ({
          ...listing,
          builtSurfaceArea: listing.builtSurfaceArea
            ? parseFloat(listing.builtSurfaceArea as unknown as string)
            : null
        })));
      } catch (error) {
        console.error("Error fetching listings:", error);
        setListings([]);
      } finally {
        setIsLoadingListings(false);
      }
    };

    // Debounce the search to avoid too many requests (but not for initial loads)
    if (isInitialLoad) {
      void fetchListings();
    } else {
      const debounceTimer = setTimeout(() => {
        void fetchListings();
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [
    listingSearchQuery,
    initialData.listingId,
    currentStep,
    selectedListing,
    listings.length,
  ]);

  // Dedicated effect to fetch a single listing when initialData.listingId is provided (e.g., from URL)
  useEffect(() => {
    // Only fetch if we have initialData.listingId but haven't set selectedListing yet
    if (!initialData.listingId || selectedListing) {
      return;
    }

    const fetchSingleListing = async () => {
      setIsLoadingListings(true);
      try {
        // Early return if listingId is somehow undefined (shouldn't happen due to effect guard)
        if (!initialData.listingId) {
          return;
        }

        // Fetch ONLY the specific listing by ID - much more efficient than fetching all 100 listings
        // Convert to BigInt to handle serialization from URL params
        const listingIdBigInt =
          typeof initialData.listingId === "string"
            ? BigInt(initialData.listingId)
            : initialData.listingId;

        const matchedListing = await getListingCompactByIdWithAuth(listingIdBigInt);

        if (matchedListing) {
          const transformedListing = {
            ...matchedListing,
            builtSurfaceArea: matchedListing.builtSurfaceArea
              ? parseFloat(matchedListing.builtSurfaceArea as unknown as string)
              : null
          };
          setSelectedListing(transformedListing);
          // Also add to listings array so it appears in search if needed
          setListings((prev) => {
            // Only add if not already in the list
            const exists = prev.some(
              (l) => l.listingId.toString() === transformedListing.listingId.toString(),
            );
            return exists ? prev : [transformedListing, ...prev];
          });
        }
      } catch (error) {
        console.error("Error fetching listing by ID:", error);
      } finally {
        setIsLoadingListings(false);
      }
    };

    void fetchSingleListing();
  }, [initialData.listingId, selectedListing]);

  // Filter contacts based on search query and exclude selected contact
  const filteredContacts = contacts.filter((contact) => {
    // Exclude selected contact from search results
    if (selectedContact && contact.contactId === selectedContact.contactId) {
      return false;
    }

    // If no search query, show all contacts
    if (searchQuery.length === 0) {
      return true;
    }

    // Use normalized search for case-insensitive and accent-insensitive matching
    const fullName = `${contact.firstName} ${contact.lastName}`;
    return (
      matchesSearch(fullName, searchQuery) ||
      matchesSearch(contact.email, searchQuery) ||
      matchesPhoneSearch(contact.phone, searchQuery)
    );
  });

  // Filter listings based on search query and exclude selected listing
  const filteredListings = listings.filter((listing) => {
    // Exclude selected listing from search results
    if (selectedListing && listing.listingId.toString() === selectedListing.listingId.toString()) {
      return false;
    }

    // If no search query, show all listings
    if (listingSearchQuery.length === 0) {
      return true;
    }

    // Use normalized search for case-insensitive and accent-insensitive matching
    return (
      matchesSearch(listing.title, listingSearchQuery) ||
      matchesSearch(listing.referenceNumber, listingSearchQuery) ||
      matchesSearch(listing.city, listingSearchQuery)
    );
  });

  // Generate time options (15-minute intervals)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        options.push(time);
      }
    }
    return options;
  };

  // Helper to convert YYYY-MM-DD (from date input) to DD-MM-YYYY (internal format)
  const convertDateInputToInternal = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    // YYYY-MM-DD -> DD-MM-YYYY
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // Helper to convert DD-MM-YYYY (internal format) to YYYY-MM-DD (for date input)
  const convertInternalToDateInput = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    // DD-MM-YYYY -> YYYY-MM-DD
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // Handle input changes
  const handleInputChange =
    (field: keyof AppointmentFormData) => (value: string | number) => {
      setFormData((prev) => {
        let processedValue: string | number = value;
        
        // Convert date inputs from YYYY-MM-DD to DD-MM-YYYY
        if ((field === "startDate" || field === "endDate") && typeof value === "string") {
          processedValue = convertDateInputToInternal(value);
        }

        const updates: Partial<AppointmentFormData> = { [field]: processedValue };

        // Auto-update endDate and endTime when startTime changes
        if (field === "startTime" && typeof value === "string") {
          const startDate = prev.startDate ?? getTomorrowDate();
          const { endDate, endTime } = calculateEndDateTime(startDate, value, 30);
          updates.endDate = endDate;
          updates.endTime = endTime;
        }

        // Auto-update endDate and endTime when startDate changes
        if (field === "startDate" && typeof processedValue === "string") {
          const startTime = prev.startTime ?? getCurrentTime();
          const { endDate, endTime } = calculateEndDateTime(processedValue, startTime, 30);
          updates.endDate = endDate;
          updates.endTime = endTime;
        }

        // Auto-generate title when appointment type changes (only if title is empty or matches previous type pattern)
        if (field === "appointmentType" && typeof value === "string") {
          const currentTitle = prev.title ?? "";
          const previousType = prev.appointmentType ?? "";
          const previousPattern = previousType ? `${previousType} -` : "";
          
          // Only auto-generate if title is empty, matches previous type, or matches previous pattern
          const shouldAutoGenerate = 
            !currentTitle || 
            currentTitle === previousType || 
            currentTitle.startsWith(previousPattern);
          
          if (shouldAutoGenerate) {
            if (selectedContact) {
              const contactName = `${selectedContact.firstName} ${selectedContact.lastName}`;
              updates.title = generateAppointmentTitle(value, contactName);
            } else {
              updates.title = generateAppointmentTitle(value);
            }
          }
        }

        return { ...prev, ...updates };
      });
      setValidationError(null);

      // Clear listing selection if appointment type changes from "Visita"
      if (field === "appointmentType" && value !== "Visita") {
        handleClearListing();
      }
    };

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    const contactName = `${contact.firstName} ${contact.lastName}`;
    setFormData((prev) => {
      // Auto-generate title when contact is selected (only if title is empty or matches previous type)
      const currentTitle = prev.title ?? "";
      const appointmentType = prev.appointmentType ?? "Visita";
      const shouldAutoGenerate = !currentTitle || currentTitle === appointmentType;
      
      const generatedTitle = shouldAutoGenerate
        ? generateAppointmentTitle(appointmentType, contactName)
        : currentTitle;
      
      return {
        ...prev,
        contactId: contact.contactId,
        title: generatedTitle,
      };
    });
    // Don't modify search query - keep it as is for future searches
    setValidationError(null);
  };

  // Handle clearing contact selection
  const handleClearContact = () => {
    setSelectedContact(null);
    setFormData((prev) => ({ ...prev, contactId: undefined }));
    setSearchQuery("");
    setContacts([]);
    setValidationError(null);
  };

  // Handle contact creation from popup
  const handleContactCreated = (contact: unknown) => {
    console.log("New contact created:", contact);

    // Type guard to check if contact has the expected properties
    interface NewContact {
      contactId: number | bigint;
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
    }

    const isValidContact = (obj: unknown): obj is NewContact => {
      return (
        typeof obj === "object" &&
        obj !== null &&
        "contactId" in obj &&
        "firstName" in obj &&
        "lastName" in obj
      );
    };

    // Immediately add the new contact to the contacts list for instant UI update
    if (isValidContact(contact)) {
      const newContactForList: Contact = {
        contactId: typeof contact.contactId === "bigint"
          ? contact.contactId
          : BigInt(contact.contactId),
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
      };

      // Add to contacts list at the top
      setContacts((prev) => [newContactForList, ...prev]);

      // Auto-select the new contact
      setSelectedContact(newContactForList);
      const contactName = `${newContactForList.firstName} ${newContactForList.lastName}`;
      setFormData((prev) => {
        // Auto-generate title when contact is created and selected (only if title is empty or matches previous type)
        const currentTitle = prev.title ?? "";
        const appointmentType = prev.appointmentType ?? "Visita";
        const shouldAutoGenerate = !currentTitle || currentTitle === appointmentType;
        
        const generatedTitle = shouldAutoGenerate
          ? generateAppointmentTitle(appointmentType, contactName)
          : currentTitle;
        
        return {
          ...prev,
          contactId: newContactForList.contactId,
          title: generatedTitle,
        };
      });

      // Clear validation error
      setValidationError(null);
    }
  };

  // Handle listing selection
  const handleListingSelect = (listing: Listing) => {
    setSelectedListing(listing);
    setFormData((prev) => ({ ...prev, listingId: listing.listingId }));
    // Don't modify search query - keep it as is for future searches
    setValidationError(null);
  };

  // Handle clearing listing selection
  const handleClearListing = () => {
    setSelectedListing(null);
    setFormData((prev) => ({ ...prev, listingId: undefined }));
    setListingSearchQuery("");
    setValidationError(null);
  };

  // Step validation
  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 0: // Contact selection
        // Contact is now optional - only validate agent assignment
        if (!formData.assignedTo) {
          setValidationError("Debe seleccionar un agente");
          return false;
        }
        return true;
      case 1: // Details
        // Check if listing is required for "Visita" appointments with contacts
        if (formData.appointmentType === "Visita" && formData.contactId && !formData.listingId) {
          setValidationError("Debe seleccionar una propiedad para las visitas con contactos");
          return false;
        }

        const validation = await validateAppointmentForm(
          formData as AppointmentFormData,
        );
        if (!validation.valid) {
          setValidationError(validation.errors[0] ?? "Datos incompletos");
          return false;
        }
        return true;
      case 2: // Confirmation
        // Ensure title is auto-generated if not set (always succeeds)
        if (!formData.title || formData.title.trim() === "") {
          // Auto-generate title if missing
          if (selectedContact && formData.appointmentType) {
            const contactName = `${selectedContact.firstName} ${selectedContact.lastName}`;
            const generatedTitle = generateAppointmentTitle(
              formData.appointmentType,
              contactName,
            );
            setFormData((prev) => ({ ...prev, title: generatedTitle }));
          } else if (formData.appointmentType) {
            const generatedTitle = generateAppointmentTitle(formData.appointmentType);
            setFormData((prev) => ({ ...prev, title: generatedTitle }));
          }
        }
        return true;
      default:
        return true;
    }
  };

  // Navigation handlers
  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      
      // Auto-generate title when moving to confirmation step (step 2)
      if (nextStepIndex === 2) {
        setFormData((prev) => {
          // Only auto-generate if title is empty or just the appointment type
          if (!prev.title || prev.title.trim() === "" || prev.title === prev.appointmentType) {
            let newTitle = "";
            if (selectedContact && prev.appointmentType) {
              const contactName = `${selectedContact.firstName} ${selectedContact.lastName}`;
              newTitle = generateAppointmentTitle(prev.appointmentType, contactName);
            } else if (prev.appointmentType) {
              newTitle = generateAppointmentTitle(prev.appointmentType);
            }
            if (newTitle) {
              // Initialize title edit value
              setTitleEditValue(newTitle);
              return {
                ...prev,
                title: newTitle,
              };
            }
          } else {
            // Initialize title edit value with existing title
            setTitleEditValue(prev.title);
          }
          return prev;
        });
      }
      
      setDirection("forward");
      setCurrentStep(nextStepIndex);
    }
  };

  const prevStep = () => {
    // Don't go back past the initial step (which may be 0 or 1)
    if (currentStep > initialStep) {
      setDirection("backward");
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Transform form data to CalendarEvent format for optimistic updates
  const transformFormDataToCalendarEvent = (
    data: Partial<AppointmentFormData>,
  ) => {
    if (!data.contactId || !data.startDate || !data.startTime) {
      return null;
    }

    // Create start and end Date objects (parse DD-MM-YYYY format)
    const startDateParts = data.startDate.split("-").map(Number);
    const endDateParts = (data.endDate ?? data.startDate).split("-").map(Number);
    const startTimeParts = data.startTime.split(":").map(Number);
    const endTimeParts = (data.endTime ?? data.startTime).split(":").map(Number);
    
    const startDateTime = new Date(
      startDateParts[2]!, // year
      startDateParts[1]! - 1, // month (0-indexed)
      startDateParts[0]!, // day
      startTimeParts[0] ?? 0,
      startTimeParts[1] ?? 0
    );
    const endDateTime = new Date(
      endDateParts[2]!, // year
      endDateParts[1]! - 1, // month (0-indexed)
      endDateParts[0]!, // day
      endTimeParts[0] ?? 0,
      endTimeParts[1] ?? 0
    );

    return {
      contactId: data.contactId,
      contactName: selectedContact
        ? `${selectedContact.firstName} ${selectedContact.lastName}`
        : "New Contact",
      propertyAddress: selectedListing?.title ?? undefined,
      startTime: startDateTime,
      endTime: endDateTime,
      status: "Scheduled" as const,
      type: data.appointmentType ?? "Visita",
      title: data.title ?? "",
      tripTimeMinutes: data.tripTimeMinutes,
      notes: data.notes,
      listingId: data.listingId,
      listingContactId: data.leadId,
      dealId: data.dealId,
      prospectId: data.prospectId,
    };
  };

  // Transform server response to CalendarEvent format
  const transformServerResponseToCalendarEvent = (appointmentId: bigint) => {
    return {
      appointmentId,
      contactId: formData.contactId!,
      contactName: selectedContact
        ? `${selectedContact.firstName} ${selectedContact.lastName}`
        : "New Contact",
      propertyAddress: selectedListing?.title ?? undefined,
      // Parse DD-MM-YYYY format dates
      startTime: (() => {
        if (!formData.startDate || !formData.startTime) {
          return new Date();
        }
        const dateParts = formData.startDate.split("-").map(Number);
        const timeParts = formData.startTime.split(":").map(Number);
        return new Date(
          dateParts[2]!, // year
          dateParts[1]! - 1, // month (0-indexed)
          dateParts[0]!, // day
          timeParts[0] ?? 0,
          timeParts[1] ?? 0
        );
      })(),
      endTime: (() => {
        const endDate = formData.endDate ?? formData.startDate;
        const endTime = formData.endTime ?? formData.startTime;
        if (!endDate || !endTime) {
          return new Date();
        }
        const dateParts = endDate.split("-").map(Number);
        const timeParts = endTime.split(":").map(Number);
        return new Date(
          dateParts[2]!, // year
          dateParts[1]! - 1, // month (0-indexed)
          dateParts[0]!, // day
          timeParts[0] ?? 0,
          timeParts[1] ?? 0
        );
      })(),
      status: "Scheduled" as const,
      type: formData.appointmentType ?? "Visita",
      title: formData.title ?? "",
      tripTimeMinutes: formData.tripTimeMinutes,
      notes: formData.notes,
      listingId: formData.listingId,
      listingContactId: formData.leadId,
      dealId: formData.dealId,
      prospectId: formData.prospectId,
      agentName: undefined,
      isOptimistic: false,
    };
  };

  // Form submission
  const handleSubmit = async () => {
    // Ensure title is set before submission (auto-generate if missing)
    let finalFormData = formData;
    if (!formData.title || formData.title.trim() === "") {
      let generatedTitle = "";
      if (selectedContact && formData.appointmentType) {
        const contactName = `${selectedContact.firstName} ${selectedContact.lastName}`;
        generatedTitle = generateAppointmentTitle(
          formData.appointmentType,
          contactName,
        );
      } else if (formData.appointmentType) {
        generatedTitle = generateAppointmentTitle(formData.appointmentType);
      }
      if (generatedTitle) {
        finalFormData = { ...formData, title: generatedTitle };
        setFormData(finalFormData);
      }
    }

    // Use finalFormData for validation and submission
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    setIsCreating(true);

    // Add optimistic update for create mode
    let tempEventId: bigint | null = null;
    if (mode === "create" && addOptimisticEvent) {
      try {
        const eventData = transformFormDataToCalendarEvent(formData);
        if (eventData) {
          tempEventId = addOptimisticEvent(eventData);
          setOptimisticEventId(tempEventId);
          console.log("Added optimistic event with ID:", tempEventId);
        } else {
          console.warn("Could not create optimistic event: invalid form data");
        }
      } catch (error) {
        console.error("Error adding optimistic event:", error);
        // Continue with server action even if optimistic update fails
      }
    }

    try {
      let result;

      if (mode === "edit" && appointmentId) {
        // Update existing appointment
        console.log(
          "Updating appointment in edit mode with ID:",
          appointmentId,
        );
        result = await updateAppointmentAction(
          appointmentId,
          formData as AppointmentFormData,
        );
      } else {
        // Create new appointment
        console.log("Creating new appointment in create mode");
        result = await createAppointmentAction(formData as AppointmentFormData);
      }

      if (result.success) {
        // Convert optimistic event to real event instead of removing
        if (tempEventId && updateOptimisticEvent && result.appointmentId) {
          const realEventData = transformServerResponseToCalendarEvent(
            result.appointmentId,
          );
          updateOptimisticEvent(tempEventId, realEventData);
        }
        if (isMountedRef.current) {
          onSubmit?.(result.appointmentId!);
        }
      } else {
        // Remove optimistic event on error
        if (tempEventId && removeOptimisticEvent) {
          removeOptimisticEvent(tempEventId);
        }
        if (isMountedRef.current) {
          setValidationError(result.error ?? "Error desconocido");
        }
      }
    } catch (error) {
      // Remove optimistic event on error
      if (tempEventId && removeOptimisticEvent) {
        removeOptimisticEvent(tempEventId);
      }
      if (isMountedRef.current) {
        const errorMessage =
          mode === "edit"
            ? "Error al actualizar la cita"
            : "Error al crear la cita";
        setValidationError(errorMessage);
      }
      console.error(
        `Error ${mode === "edit" ? "updating" : "creating"} appointment:`,
        error,
      );
    } finally {
      if (isMountedRef.current) {
        setIsCreating(false);
        setOptimisticEventId(null);
      }
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Contact Selection
        return (
          <div className="space-y-3">
            {/* Agent Selection */}
            <div className="space-y-2">
              <label
                htmlFor="agent-select"
                className="text-sm font-medium text-gray-700"
              >
                Asignar a
              </label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, assignedTo: value }));
                  setValidationError(null);
                }}
                disabled={isLoadingAgents}
              >
                <SelectTrigger className="h-9 text-gray-500">
                  <SelectValue
                    placeholder={
                      isLoadingAgents
                        ? "Cargando agentes..."
                        : agents.length === 0
                          ? "No hay agentes"
                          : "Seleccionar agente"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name ??
                        (`${agent.firstName ?? ""} ${agent.lastName ?? ""}`.trim() ||
                          agent.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="contact-search"
                  className="text-sm font-medium text-gray-700"
                >
                  Contacto
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex h-6 items-center space-x-1 px-2 text-xs"
                  onClick={() => setShowContactPopup(true)}
                >
                  <Plus className="h-3 w-3" />
                  <span>Agregar</span>
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="contact-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar contactos..."
                  className="h-9 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {selectedContact && (
              // Show selected contact
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </div>
                    {selectedContact.email && (
                      <div className="text-xs text-muted-foreground">
                        {selectedContact.email}
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="text-xs text-muted-foreground">
                        {selectedContact.phone}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearContact}
                    className="h-6 w-6 shrink-0 p-0"
                    title="Cambiar contacto"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="h-[300px]">
              {isLoadingContacts ? (
                <div className="flex items-center justify-center py-6">
                  <Loader className="h-5 w-5 animate-spin" />
                </div>
              ) : filteredContacts.length === 0 && searchQuery.length > 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No se encontraron contactos
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredContacts.map((contact, index) => (
                    <div
                      key={`${contact.contactId.toString()}-${index}`}
                      className="cursor-pointer rounded-lg border border-gray-100/50 bg-gray-50/30 p-2 transition-all hover:border-gray-200 hover:bg-gray-100/60 hover:shadow-sm"
                      onClick={() => handleContactSelect(contact)}
                    >
                      <div className="text-sm font-medium text-gray-600">
                        {contact.firstName} {contact.lastName}
                      </div>
                      {contact.email && (
                        <div className="text-xs text-gray-400">
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="text-xs text-gray-400">
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        );

      case 1: // Details
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FloatingLabelInput
                  id="startDate"
                  value={formData.startDate ? convertInternalToDateInput(formData.startDate) : ""}
                  onChange={handleInputChange("startDate")}
                  placeholder="Fecha de inicio"
                  type="date"
                  required
                  className="text-sm"
                />

              <div className="relative mt-8">
                <label className="absolute -top-5 left-0 z-10 px-2 text-xs font-medium text-gray-600">
                  Hora de inicio
                </label>
                <Select
                  value={formData.startTime}
                  onValueChange={handleInputChange("startTime")}
                >
                  <SelectTrigger className="h-9 border border-gray-200 text-sm shadow-md">
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {generateTimeOptions().map((time, index) => (
                        <SelectItem key={`${time}-${index}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration and End Date/Time Row */}
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
              {/* Duration */}
              <div className="relative">
                <label className="absolute -top-6 left-0 z-10 px-2 text-xs font-medium text-gray-600">
                  Duración
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateSourceRef.current = "duration";
                      const totalMinutes = durationHours * 60 + durationMinutes;
                      let newTotal;

                      if (totalMinutes > 8 * 60) {
                        // If more than 8 hours, decrease by 1 day
                        newTotal = Math.max(8 * 60, totalMinutes - 24 * 60);
                      } else {
                        // If 8 hours or less, decrease by 15 minutes
                        newTotal = Math.max(0, totalMinutes - 15);
                      }

                      setDurationHours(Math.floor(newTotal / 60));
                      setDurationMinutes(newTotal % 60);
                    }}
                    className="h-9 w-9 p-0 text-lg"
                    title="Restar 15 minutos o 1 día"
                  >
                    −
                  </Button>
                  <Select
                    value={`${durationHours}:${durationMinutes}`}
                    onValueChange={(value) => {
                      updateSourceRef.current = "duration";
                      const [h, m] = value.split(":").map(Number);
                      setDurationHours(h ?? 0);
                      setDurationMinutes(m ?? 0);
                    }}
                  >
                    <SelectTrigger className="h-9 flex-1 border border-gray-200 text-sm shadow-md">
                      <SelectValue>
                        {(() => {
                          const totalMinutes = durationHours * 60 + durationMinutes;
                          const totalDays = Math.floor(totalMinutes / (24 * 60));

                          if (totalDays >= 1 && totalMinutes % (24 * 60) === 0) {
                            // Show as days if it's a whole number of days
                            return totalDays === 1 ? "1 día" : `${totalDays} días`;
                          }

                          // Show as HH:mm for durations under 1 day or partial days
                          return `${durationHours.toString().padStart(2, "0")}:${durationMinutes.toString().padStart(2, "0")}`;
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {/* Generate duration options from 0 to 8 hours in 5-minute increments */}
                        {Array.from({ length: 97 }, (_, i) => i * 5).map((totalMinutes) => {
                          const h = Math.floor(totalMinutes / 60);
                          const m = totalMinutes % 60;
                          const displayText = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                          return (
                            <SelectItem key={totalMinutes} value={`${h}:${m}`}>
                              {displayText}
                            </SelectItem>
                          );
                        })}
                        {/* Add day options from 1 to 14 days */}
                        {Array.from({ length: 14 }, (_, i) => i + 1).map((days) => {
                          const totalMinutes = days * 24 * 60;
                          const h = Math.floor(totalMinutes / 60);
                          const m = totalMinutes % 60;
                          const displayText = days === 1 ? "1 día" : `${days} días`;
                          return (
                            <SelectItem key={`day-${days}`} value={`${h}:${m}`}>
                              {displayText}
                            </SelectItem>
                          );
                        })}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateSourceRef.current = "duration";
                      const totalMinutes = durationHours * 60 + durationMinutes;
                      let newTotal;

                      if (totalMinutes >= 8 * 60) {
                        // If 8 hours or more, increase by 1 day
                        newTotal = Math.min(14 * 24 * 60, totalMinutes + 24 * 60); // Max 14 days
                      } else {
                        // If less than 8 hours, increase by 15 minutes (up to 8 hours)
                        newTotal = Math.min(8 * 60, totalMinutes + 15);
                      }

                      setDurationHours(Math.floor(newTotal / 60));
                      setDurationMinutes(newTotal % 60);
                    }}
                    className="h-9 w-9 p-0 text-lg"
                    title="Añadir 15 minutos o 1 día"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* End Date */}
              <div className="relative">
                <label className="absolute -top-6 left-0 z-10 px-2 text-xs font-medium text-gray-600">
                  Fecha de fin
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={formData.endDate ? convertInternalToDateInput(formData.endDate) : ""}
                  onChange={(e) => {
                    updateSourceRef.current = "end";
                    const newEndDate = convertDateInputToInternal(e.target.value);
                    setFormData((prev) => ({ ...prev, endDate: newEndDate }));

                    // Recalculate duration from new end date
                    if (formData.startDate && formData.startTime && formData.endTime) {
                      const { hours, minutes } = calculateDurationFromEndDateTime(
                        formData.startDate,
                        formData.startTime,
                        newEndDate,
                        formData.endTime,
                      );

                      // Validate: if end is before or equal to start, auto-correct to start + 30 min
                      // Parse DD-MM-YYYY format
                      const startDateParts = formData.startDate.split("-").map(Number);
                      const endDateParts = newEndDate.split("-").map(Number);
                      const startTimeParts = formData.startTime.split(":").map(Number);
                      const endTimeParts = formData.endTime.split(":").map(Number);
                      
                      const startDateTime = new Date(
                        startDateParts[2]!, startDateParts[1]! - 1, startDateParts[0]!,
                        startTimeParts[0] ?? 0, startTimeParts[1] ?? 0
                      );
                      const endDateTime = new Date(
                        endDateParts[2]!, endDateParts[1]! - 1, endDateParts[0]!,
                        endTimeParts[0] ?? 0, endTimeParts[1] ?? 0
                      );

                      if (endDateTime <= startDateTime) {
                        // Auto-correct to start + 30 minutes
                        const corrected = calculateEndDateTime(formData.startDate, formData.startTime, 30);
                        setFormData((prev) => ({ ...prev, endDate: corrected.endDate, endTime: corrected.endTime }));
                        setDurationHours(0);
                        setDurationMinutes(30);
                      } else {
                        // Cap duration at 14 days max
                        const totalMinutes = hours * 60 + minutes;
                        const maxMinutes = 14 * 24 * 60;
                        if (totalMinutes > maxMinutes) {
                          const corrected = calculateEndDateTime(formData.startDate, formData.startTime, maxMinutes);
                          setFormData((prev) => ({ ...prev, endDate: corrected.endDate, endTime: corrected.endTime }));
                          setDurationHours(Math.floor(maxMinutes / 60));
                          setDurationMinutes(maxMinutes % 60);
                        } else {
                          setDurationHours(hours);
                          setDurationMinutes(minutes);
                        }
                      }
                    }
                  }}
                  required
                  className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm shadow-md"
                />
              </div>

              {/* End Time */}
              <div className="relative">
                <label className="absolute -top-6 left-0 z-10 px-2 text-xs font-medium text-gray-600">
                  Hora de fin
                </label>
                <Select
                  value={formData.endTime}
                  onValueChange={(newEndTime) => {
                    updateSourceRef.current = "end";
                    setFormData((prev) => ({ ...prev, endTime: newEndTime }));

                    // Recalculate duration from new end time
                    if (formData.startDate && formData.startTime && formData.endDate) {
                      const { hours, minutes } = calculateDurationFromEndDateTime(
                        formData.startDate,
                        formData.startTime,
                        formData.endDate,
                        newEndTime,
                      );

                      // Validate: if end is before or equal to start, auto-correct to start + 30 min
                      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
                      const endDateTime = new Date(`${formData.endDate}T${newEndTime}`);

                      if (endDateTime <= startDateTime) {
                        // Auto-correct to start + 30 minutes
                        const corrected = calculateEndDateTime(formData.startDate, formData.startTime, 30);
                        setFormData((prev) => ({ ...prev, endDate: corrected.endDate, endTime: corrected.endTime }));
                        setDurationHours(0);
                        setDurationMinutes(30);
                      } else {
                        // Cap duration at 14 days max
                        const totalMinutes = hours * 60 + minutes;
                        const maxMinutes = 14 * 24 * 60;
                        if (totalMinutes > maxMinutes) {
                          const corrected = calculateEndDateTime(formData.startDate, formData.startTime, maxMinutes);
                          setFormData((prev) => ({ ...prev, endDate: corrected.endDate, endTime: corrected.endTime }));
                          setDurationHours(Math.floor(maxMinutes / 60));
                          setDurationMinutes(maxMinutes % 60);
                        } else {
                          setDurationHours(hours);
                          setDurationMinutes(minutes);
                        }
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-9 border border-gray-200 text-sm shadow-md">
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {generateTimeOptions().map((time, index) => (
                        <SelectItem key={`end-${time}-${index}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">
                Tipo de cita
              </label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {appointmentTypes.map((type) => {
                  const isSelected = formData.appointmentType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInputChange("appointmentType")(type.value)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-lg p-2 shadow transition-all hover:shadow-md sm:p-3",
                        isSelected
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "bg-white"
                      )}
                    >
                      <span className={cn(
                        "text-gray-500",
                        isSelected && "text-primary"
                      )}>
                        {type.icon}
                      </span>
                      <span className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-primary" : "text-gray-600"
                      )}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Listing selection - only show for "Visita" appointments */}
            {formData.appointmentType === "Visita" && (
              <div className="space-y-3">
                {/* Only show label and search if listing wasn't pre-selected via URL */}
                {!initialData.listingId && !selectedListing && (
                  <div className="relative">
                    <label className="absolute -top-5 left-0 z-10 px-2 text-xs font-medium text-gray-600">
                      Seleccionar Propiedad
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={listingSearchQuery}
                        onChange={(e) => setListingSearchQuery(e.target.value)}
                        placeholder="Buscar propiedades..."
                        className="h-9 w-full rounded-md border border-gray-200 bg-background pl-10 pr-3 text-sm shadow-md transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                )}

                {selectedListing && !initialData.listingId && (
                  // Show selected listing (only when manually selected, not from URL)
                  <div className="rounded-lg border border-primary/40 bg-primary/5 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {selectedListing.title ??
                            `${selectedListing.propertyType} en ${selectedListing.city}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Ref: {selectedListing.referenceNumber} •{" "}
                          {selectedListing.city} •{" "}
                          {Math.floor(
                            parseFloat(selectedListing.price),
                          ).toLocaleString("es-ES")}
                          €
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedListing.bedrooms &&
                            `${selectedListing.bedrooms} hab`}
                          {selectedListing.bathrooms &&
                            ` • ${Math.floor(parseFloat(selectedListing.bathrooms))} baños`}
                          {getSquareMeter(selectedListing) &&
                            ` • ${getSquareMeter(selectedListing)}m²`}
                        </div>
                      </div>
                      {/* Only show clear button if listing wasn't pre-selected via URL */}
                      {!initialData.listingId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearListing}
                          className="h-6 w-6 shrink-0 p-0"
                          title="Cambiar propiedad"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Only show listing search results if listing wasn't pre-selected via URL */}
                {!selectedListing && !initialData.listingId && (
                  <ScrollArea className="h-[180px]">
                    {isLoadingListings ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader className="h-5 w-5 animate-spin" />
                      </div>
                    ) : filteredListings.length === 0 &&
                      listingSearchQuery.length > 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        No se encontraron propiedades
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {filteredListings.map((listing, index) => (
                          <div
                            key={`${listing.listingId.toString()}-${index}`}
                            className="cursor-pointer rounded-lg border border-gray-100/50 bg-gray-50/30 p-2 transition-all hover:border-gray-200 hover:bg-gray-100/60 hover:shadow-sm"
                            onClick={() => handleListingSelect(listing)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-600">
                                  {listing.title ??
                                    `${listing.propertyType} en ${listing.city}`}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Ref: {listing.referenceNumber} •{" "}
                                  {listing.city} •{" "}
                                  {Math.floor(
                                    parseFloat(listing.price),
                                  ).toLocaleString("es-ES")}
                                  €
                                </div>
                                <div className="text-xs text-gray-400">
                                  {listing.bedrooms &&
                                    `${listing.bedrooms} hab`}
                                  {listing.bathrooms &&
                                    ` • ${Math.floor(parseFloat(listing.bathrooms))} baños`}
                                  {getSquareMeter(listing) &&
                                    ` • ${getSquareMeter(listing)}m²`}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                )}
              </div>
            )}

            <div className="relative">
              <label className="absolute -top-5 left-0 z-10 px-2 text-xs font-medium text-gray-600">
                Tiempo de viaje (minutos)
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentValue = formData.tripTimeMinutes ?? 0;
                    const newValue = Math.max(0, currentValue - 15);
                    handleInputChange("tripTimeMinutes")(newValue);
                  }}
                  className="h-9 w-9 p-0 text-lg"
                  title="Restar 15 minutos"
                >
                  −
                </Button>
                <input
                  id="tripTimeMinutes"
                  value={
                    formData.tripTimeMinutes === 0 ||
                    formData.tripTimeMinutes === undefined
                      ? ""
                      : formData.tripTimeMinutes
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    // If empty, set to 0
                    if (value === "") {
                      handleInputChange("tripTimeMinutes")(0);
                    } else {
                      handleInputChange("tripTimeMinutes")(parseInt(value) || 0);
                    }
                  }}
                  placeholder="-"
                  type="number"
                  min="0"
                  className="h-9 flex-1 rounded-md border border-gray-200 bg-background px-3 py-2 text-sm shadow-md ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentValue = formData.tripTimeMinutes ?? 0;
                    const newValue = currentValue + 15;
                    handleInputChange("tripTimeMinutes")(newValue);
                  }}
                  className="h-9 w-9 p-0 text-lg"
                  title="Añadir 15 minutos"
                >
                  +
                </Button>
              </div>
            </div>

            <div className="relative">
              <label className="absolute -top-5 left-0 z-10 px-2 text-xs font-medium text-gray-600">
                Notas
              </label>
              <div className="relative">
                <Textarea
                  value={formData.notes ?? ""}
                  onChange={(e) => handleInputChange("notes")(e.target.value)}
                  placeholder="Notas adicionales sobre la cita..."
                  className="min-h-[60px] border-gray-200 shadow-md pr-10"
                />
                <div className="absolute right-2 top-2">
                  <PushToTalkWhisperButton
                    onTranscript={(text) => {
                      handleInputChange("notes")(
                        formData.notes ? `${formData.notes} ${text}`.trim() : text
                      );
                    }}
                    language="es"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Confirmation
        return (
          <div className="space-y-6">


            {/* Title - editable, styled as heading */}
            <div className="flex items-center gap-2 sm:gap-3">
              {isEditingTitle ? (
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={titleEditValue}
                    onChange={(e) => setTitleEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleInputChange("title")(titleEditValue);
                        setIsEditingTitle(false);
                      } else if (e.key === "Escape") {
                        setTitleEditValue(formData.title ?? "");
                        setIsEditingTitle(false);
                      }
                    }}
                    className="w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-lg font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-ring sm:flex-1 sm:text-xl"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        handleInputChange("title")(titleEditValue);
                        setIsEditingTitle(false);
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setTitleEditValue(formData.title ?? "");
                        setIsEditingTitle(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="min-w-0 flex-1 break-words text-xl font-semibold text-gray-900 sm:text-2xl">
                    {formData.title ?? "Sin título"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0"
                    onClick={() => {
                      setTitleEditValue(formData.title ?? "");
                      setIsEditingTitle(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            <div className="space-y-4">
              {selectedContact && (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedContact.email}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {formData.startDate} • {formData.startTime} -{" "}
                      {formData.endTime}
                    </span>
                    {formData.endDate !== formData.startDate && (
                      <> (hasta {formData.endDate})</>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {
                      appointmentTypes.find(
                        (t) => t.value === formData.appointmentType,
                      )?.label
                    }
                    {" • "}
                    Duración:{" "}
                    {(() => {
                      const totalMinutes = durationHours * 60 + durationMinutes;
                      const totalDays = Math.floor(totalMinutes / (24 * 60));

                      if (totalDays >= 1 && totalMinutes % (24 * 60) === 0) {
                        // Show as days if it's a whole number of days
                        return totalDays === 1 ? "1 día" : `${totalDays} días`;
                      }

                      // Show as hours and minutes
                      return `${durationHours > 0 ? `${durationHours}h ` : ""}${durationMinutes}min`;
                    })()}
                  </div>
                </div>
              </div>

              {formData.listingId && formData.appointmentType === "Visita" && (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Home className="h-5 w-5 text-muted-foreground" />
                  <div>
                    {selectedListing ? (
                      <>
                        <div className="font-medium">
                          {selectedListing.title ??
                            `${selectedListing.propertyType} en ${selectedListing.city}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Ref: {selectedListing.referenceNumber} •{" "}
                          {Math.floor(
                            parseFloat(selectedListing.price),
                          ).toLocaleString("es-ES")}
                          €
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium">Propiedad seleccionada</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {formData.listingId.toString()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {formData.tripTimeMinutes != null && formData.tripTimeMinutes > 0 && (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Car className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Tiempo de viaje</div>
                    <div className="text-sm text-muted-foreground">
                      {formData.tripTimeMinutes} minutos
                    </div>
                  </div>
                </div>
              )}

              {formData.notes && (
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Notas</div>
                    <div className="text-sm text-muted-foreground">
                      {formData.notes}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Progress Steps */}
      <div className="mb-4 px-4 pt-4 sm:mb-6 sm:px-6">
        <div className="flex items-center justify-center space-x-4 sm:space-x-8">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center space-x-1 sm:space-x-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors sm:h-10 sm:w-10",
                    isActive &&
                      "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-green-500 bg-green-500 text-white",
                    !isActive && !isCompleted && "border-muted bg-background",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <span className="[&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">{step.icon}</span>}
                </div>
                <div
                  className={cn(
                    "hidden text-sm font-medium sm:block",
                    isActive && "text-primary",
                    isCompleted && "text-green-600",
                    !isActive && !isCompleted && "text-muted-foreground",
                  )}
                >
                  {step.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: direction === "forward" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === "forward" ? -20 : 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="pb-4"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex shrink-0 flex-col space-y-3 border-t bg-background px-4 py-3 sm:px-6 sm:py-4">
        {/* Validation Error */}
        {validationError && (
          <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600 sm:p-3">
            {validationError}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            {currentStep > initialStep && (
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={prevStep}>
                <ChevronLeft className="mr-1 h-4 w-4 sm:mr-2" />
                <span className="hidden xs:inline">Anterior</span>
                <span className="xs:hidden">Atrás</span>
              </Button>
            )}
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={onCancel}>
              Cancelar
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 sm:justify-end">
            {currentStep < steps.length - 1 && (
              <Button size="sm" className="flex-1 sm:flex-none" onClick={nextStep}>
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4 sm:ml-2" />
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button
                onClick={handleSubmit}
                disabled={isCreating}
                size="sm"
                className="min-w-[100px] flex-1 sm:min-w-[120px] sm:flex-none"
              >
                {isCreating ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : mode === "edit" ? (
                  "Actualizar"
                ) : (
                  "Crear Cita"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contact Creation Popup */}
      <QuickContactModal
        open={showContactPopup}
        onOpenChange={setShowContactPopup}
        onSuccess={handleContactCreated}
      />
    </div>
  );
}
