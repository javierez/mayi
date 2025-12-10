// Types for notification settings - Internal notifications with email/SMS
export interface NotificationOption {
  id: string;
  label: string;
  description: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  additionalUsers?: string[];
}

// Customer notification option with channel selection
export interface CustomerNotificationOption {
  id: string;
  label: string;
  description: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

// Task notification settings for upcoming tasks (with due date in the future)
export interface TaskNotificationSettings {
  weeklyBriefing: NotificationOption;
  dailyBriefing: NotificationOption;
  dueIn1Week: NotificationOption;
  dueIn48h: NotificationOption;
  dueIn24h: NotificationOption;
  dueIn12h: NotificationOption;
  dueIn2h: NotificationOption;
  dueIn1h: NotificationOption;
}

// Overdue task notification settings
export interface OverdueTaskNotificationSettings {
  weeklyDigest: NotificationOption;
  dailyDigest: NotificationOption;
  notifyWhenOverdue: NotificationOption;
}

// Event-based task notifications
export interface TaskEventNotificationSettings {
  taskAssigned: NotificationOption;
  taskCompleted: NotificationOption;
  taskReassigned: NotificationOption;
}

export interface AppointmentNotificationSettings {
  weeklyBriefing: NotificationOption;
  dailyBriefing: NotificationOption;
  notify24h: NotificationOption;
  notify12h: NotificationOption;
  notify1h: NotificationOption;
  notify30min: NotificationOption;
  notifyTravelTime: NotificationOption;
}

// Event-based appointment notifications
export interface AppointmentEventNotificationSettings {
  appointmentScheduled: NotificationOption;
  appointmentRescheduled: NotificationOption;
  appointmentCancelled: NotificationOption;
}

// Quiet hours configuration
export interface QuietHoursSettings {
  enabled: boolean;
  startTime: string; // "22:00"
  endTime: string; // "08:00"
  days: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
}

// Customer appointment reminder settings
export interface CustomerAppointmentNotificationSettings {
  notify24h: CustomerNotificationOption;
  notify12h: CustomerNotificationOption;
  notify1h: CustomerNotificationOption;
  notify30min: CustomerNotificationOption;
  notifyTravelTime: CustomerNotificationOption;
}

// Customer property/listing notification settings
export interface CustomerPropertyNotificationSettings {
  newListing: CustomerNotificationOption;
  priceChange: CustomerNotificationOption;
  statusChange: CustomerNotificationOption;
  newPhotos: CustomerNotificationOption;
}

// Customer document notification settings
export interface CustomerDocumentNotificationSettings {
  documentReady: CustomerNotificationOption;
  signatureRequired: CustomerNotificationOption;
  documentExpiring: CustomerNotificationOption;
}

// Customer deal notification settings
export interface CustomerDealNotificationSettings {
  offerReceived: CustomerNotificationOption;
  offerAccepted: CustomerNotificationOption;
  dealClosed: CustomerNotificationOption;
  paymentReceived: CustomerNotificationOption;
}

export interface MailSettings {
  tasks: {
    critical: TaskNotificationSettings;
    urgent: TaskNotificationSettings;
    other: TaskNotificationSettings;
    overdue: OverdueTaskNotificationSettings;
    events: TaskEventNotificationSettings;
  };
  appointments: {
    visita: AppointmentNotificationSettings;
    firma: AppointmentNotificationSettings;
    reunion: AppointmentNotificationSettings;
    llamada: AppointmentNotificationSettings;
    cierre: AppointmentNotificationSettings;
    viaje: AppointmentNotificationSettings;
    events: AppointmentEventNotificationSettings;
  };
  customers: {
    appointments: {
      visita: CustomerAppointmentNotificationSettings;
      firma: CustomerAppointmentNotificationSettings;
      reunion: CustomerAppointmentNotificationSettings;
      llamada: CustomerAppointmentNotificationSettings;
      cierre: CustomerAppointmentNotificationSettings;
      viaje: CustomerAppointmentNotificationSettings;
    };
    properties: CustomerPropertyNotificationSettings;
    documents: CustomerDocumentNotificationSettings;
    deals: CustomerDealNotificationSettings;
  };
  quietHours: QuietHoursSettings;
}

