// Shared type for urgent actions between server and client
export interface UrgentAction {
  type: "task" | "appointment";
  id: string | bigint;
  title: string;
  description?: string;
  dueDate?: string | Date;
  dueTime?: string | null; // Time portion for accurate remaining time calculation
  datetimeStart?: string | Date;
  datetimeEnd?: string | Date;
  status: string;
  entityName?: string;
  entityContactId?: string | bigint;
  listingTitle?: string;
  listingId?: string | bigint;
  propertyTitle?: string;
  contactId?: string | bigint;
  contactFirstName?: string;
  contactLastName?: string;
  propertyAddress?: string;
  daysUntilDue?: number;
  isOverdue?: boolean;
  urgency?: number;
  category?: string;
  completed?: boolean;
  userId?: string;
  userName?: string;
  userFirstName?: string;
  userLastName?: string;
}
