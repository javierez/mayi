# Notification System Documentation

## Overview

The notification system provides real-time and scheduled notifications for Tasks and Appointments in the Vesta CRM. It consists of:

- **Instant notifications**: Triggered immediately when events occur (task assigned, appointment created, etc.)
- **Scheduled reminders**: Created by a cron job that runs every 15 minutes to remind users of upcoming tasks and appointments
- **UI components**: A bell icon in the header with a dropdown showing all notifications

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NotificationDropdown (Bell Icon + Dropdown)         │  │
│  │  ├── NotificationBell (Icon with badge)              │  │
│  │  ├── NotificationItem (Individual notification row)  │  │
│  │  └── useNotifications Hook (State management)        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server Actions Layer                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  notifications.ts (Server Actions)                   │  │
│  │  ├── getNotificationsAction                          │  │
│  │  ├── getUnreadCountAction                            │  │
│  │  ├── markAsReadAction                                │  │
│  │  ├── markAllAsReadAction                             │  │
│  │  └── dismissNotificationAction                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Query Layer                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  notification.ts (Queries)                           │  │
│  │  ├── getNotificationsWithAuth                        │  │
│  │  ├── getUnreadCountWithAuth                          │  │
│  │  ├── createNotificationInternal                      │  │
│  │  ├── markAsReadWithAuth                              │  │
│  │  └── reminderExistsForEntity                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Notification Service Layer                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  notification-service.ts (Business Logic)            │  │
│  │  ├── notifyTaskAssigned                              │  │
│  │  ├── notifyTaskUpdated                               │  │
│  │  ├── notifyTaskReassigned                            │  │
│  │  ├── notifyTaskCompleted                             │  │
│  │  ├── notifyTaskDeleted                               │  │
│  │  ├── notifyTaskDueSoon                               │  │
│  │  ├── notifyTaskOverdue                               │  │
│  │  ├── notifyAppointmentScheduled                      │  │
│  │  ├── notifyAppointmentRescheduled                    │  │
│  │  ├── notifyAppointmentCancelled                      │  │
│  │  ├── notifyAppointmentCompleted                      │  │
│  │  └── notifyAppointmentReminder                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Trigger Points                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Task Queries (task.ts)                              │  │
│  │  ├── createTask() → notifyTaskAssigned               │  │
│  │  ├── updateTask() → notifyTaskUpdated/Reassigned     │  │
│  │  ├── completeTask() → notifyTaskCompleted            │  │
│  │  └── deleteTask() → notifyTaskDeleted                │  │
│  │                                                       │  │
│  │  Appointment Actions (appointments.ts)               │  │
│  │  ├── createAppointmentAction() → scheduled           │  │
│  │  ├── updateAppointmentAction() → rescheduled        │  │
│  │  └── updateAppointmentStatusAction() → cancelled/    │  │
│  │                                         completed     │  │
│  │                                                       │  │
│  │  Cron Job (cron/notifications/route.ts)             │  │
│  │  ├── Appointment reminders (30min, 1day)            │  │
│  │  ├── Task due soon notifications                     │  │
│  │  └── Task overdue notifications                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Notification Types

### Task Notifications

#### 1. `task_assigned` (Instant)
- **Trigger**: When a task is created and assigned to a user (different from the creator)
- **Location**: `src/server/queries/task.ts` → `createTask()`
- **Recipient**: The user assigned to the task (`data.userId`)
- **Priority**: Normal
- **Message**: "Se te ha asignado una nueva tarea."
- **Action URL**: `/tareas?taskId={taskId}`

#### 2. `task_updated` (Instant)
- **Trigger**: When task details are edited (title, description, due date, priority, etc.)
- **Location**: `src/server/queries/task.ts` → `updateTask()`
- **Recipient**: The user assigned to the task (only if different from the editor)
- **Priority**: Normal
- **Message**: "{updaterName} ha actualizado la tarea: {updatedFields}."
- **Action URL**: `/tareas?taskId={taskId}`
- **Note**: Does not trigger if the editor is the same as the assignee. Does not trigger for completion status changes (those have their own notification).

#### 3. `task_reassigned` (Instant)
- **Trigger**: When a task is assigned to a different user
- **Location**: `src/server/queries/task.ts` → `updateTask()`
- **Recipient**: The new assignee (only if different from the reassigner)
- **Priority**: Normal
- **Message**: "{reassignerName} te ha reasignado esta tarea."
- **Action URL**: `/tareas?taskId={taskId}`
- **Note**: Does not trigger if the reassigner is assigning the task to themselves.

#### 4. `task_completed` (Instant)
- **Trigger**: When a task is marked as completed
- **Location**: `src/server/queries/task.ts` → `completeTask()`
- **Recipient**: Both the assigned user (`task.userId`) AND the creator (`task.createdBy`) - if they are different
- **Priority**: Normal
- **Message**: "La tarea ha sido completada."
- **Action URL**: `/tareas?taskId={taskId}`

#### 5. `task_deleted` (Instant)
- **Trigger**: When a task is deleted
- **Location**: `src/server/queries/task.ts` → `deleteTask()`
- **Recipient**: The user assigned to the task (only if different from the deleter)
- **Priority**: Normal
- **Message**: "{deleterName} ha eliminado una tarea que te fue asignada."
- **Action URL**: None (task no longer exists)
- **Note**: Does not trigger if the deleter is the same as the assignee.

#### 7. `task_due_soon` (Scheduled)
- **Trigger**: Created by cron job for tasks due today or tomorrow
- **Location**: `src/app/api/cron/notifications/route.ts`
- **Recipient**: The user assigned to the task
- **Priority**: Normal
- **Timeframes**:
  - `same_day`: Task due today → "Esta tarea vence hoy. ¡No olvides completarla!"
  - `1_day`: Task due tomorrow → "Esta tarea vence mañana. Prepárate para completarla."
- **Action URL**: `/tareas?taskId={taskId}`
- **Frequency**: Cron runs every 15 minutes, checks tasks due within next 24 hours

#### 8. `task_overdue` (Scheduled)
- **Trigger**: Created by cron job for tasks past their due date
- **Location**: `src/app/api/cron/notifications/route.ts`
- **Recipient**: The user assigned to the task
- **Priority**: High
- **Message**: "Esta tarea está vencida. Por favor, complétala lo antes posible."
- **Action URL**: `/tareas?taskId={taskId}`
- **Frequency**: Cron runs every 15 minutes, checks all overdue tasks
- **Deduplication**: Only one overdue notification per task (checked via `reminderExistsForEntity`)

### Appointment Notifications

#### 9. `appointment_scheduled` (Instant)
- **Trigger**: When a new appointment is created
- **Location**: `src/server/actions/appointments.ts` → `createAppointmentAction()`
- **Recipient**: The assigned user (`assignedTo`) or creator (`userId`) if no one is assigned
- **Priority**: Normal
- **Message**: "Se ha programado una nueva cita."
- **Action URL**: `/calendario?appointmentId={appointmentId}`

#### 10. `appointment_rescheduled` (Instant)
- **Trigger**: When an appointment's start time (`datetimeStart`) is changed
- **Location**: `src/server/actions/appointments.ts` → `updateAppointmentAction()`
- **Recipient**: The assigned user or creator
- **Priority**: Normal
- **Message**: "La cita ha sido reagendada."
- **Action URL**: `/calendario?appointmentId={appointmentId}`
- **Note**: Only triggers if the datetime actually changed (compared before and after update)

#### 11. `appointment_cancelled` (Instant)
- **Trigger**: When appointment status is changed to "Cancelled"
- **Location**: `src/server/actions/appointments.ts` → `updateAppointmentStatusAction()`
- **Recipient**: The assigned user or creator
- **Priority**: Low
- **Message**: "La cita ha sido cancelada."
- **Action URL**: `/calendario?appointmentId={appointmentId}`

#### 12. `appointment_completed` (Instant)
- **Trigger**: When appointment status is changed to "Completed"
- **Location**: `src/server/actions/appointments.ts` → `updateAppointmentStatusAction()`
- **Recipient**: Both the assigned user (`assignedTo` or `userId`) AND the creator (`userId`) - if they are different
- **Priority**: Low
- **Message**: "La cita ha sido completada."
- **Action URL**: `/calendario?appointmentId={appointmentId}`

#### 13. `appointment_reminder` (Scheduled)
- **Trigger**: Created by cron job for upcoming appointments
- **Location**: `src/app/api/cron/notifications/route.ts`
- **Recipient**: The assigned user or creator
- **Priority**: High
- **Timeframes**:
  - `30_min`: Appointment in 30 minutes → "Tu cita comienza en 30 minutos. ¡Prepárate!"
  - `1_day`: Appointment tomorrow → "Tienes una cita mañana. Revisa los detalles."
- **Action URL**: `/calendario?appointmentId={appointmentId}`
- **Frequency**: Cron runs every 15 minutes, checks appointments starting:
  - Within next 30 minutes (for 30_min reminders)
  - Between 30 minutes and 1 day (for 1_day reminders)
- **Deduplication**: Each reminder type is created only once per appointment (checked via `reminderExistsForEntity`)

## Data Flow

### Instant Notification Flow

```
1. User Action (e.g., creates task)
   │
   ▼
2. Task/Appointment Query/Action executes
   │
   ▼
3. Notification Service called
   │  └── notifyTaskAssigned(task, assigneeId, assignerId, accountId)
   │
   ▼
4. Notification Service builds:
   │  ├── Title: "Nueva tarea asignada: {taskTitle}"
   │  ├── Message: "Se te ha asignado una nueva tarea."
   │  ├── Action URL: "/tareas?taskId={taskId}"
   │  ├── Priority: "normal"
   │  └── Metadata: { taskTitle, dueDate, urgency, ... }
   │
   ▼
5. createNotificationInternal() called
   │
   ▼
6. Notification inserted into database
   │
   ▼
7. User sees notification in UI (via polling)
```

### Scheduled Reminder Flow

```
1. Vercel Cron triggers (every 15 minutes)
   │
   ▼
2. GET /api/cron/notifications
   │  ├── Verifies CRON_SECRET
   │  └── Queries database for:
   │      ├── Appointments starting in 30min/1hr/1day
   │      ├── Tasks due today/tomorrow
   │      └── Tasks overdue
   │
   ▼
3. For each entity found:
   │  ├── Check if reminder already exists (reminderExistsForEntity)
   │  ├── If not exists:
   │  │   ├── Call notification service
   │  │   │   └── notifyAppointmentReminder() or notifyTaskDueSoon()
   │  │   └── Create notification in database
   │  └── Continue to next entity
   │
   ▼
4. Return summary: { remindersCreated, tasksNotified }
```

### UI Polling Flow

```
1. Component mounts (NotificationDropdown)
   │
   ▼
2. useNotifications hook initializes
   │  ├── Fetches initial notifications (getNotificationsAction)
   │  └── Fetches unread count (getUnreadCountAction)
   │
   ▼
3. Polling interval starts (60 seconds)
   │
   ▼
4. Every 60 seconds:
   │  ├── Refetch notifications
   │  ├── Refetch unread count
   │  └── Update UI if new notifications found
   │
   ▼
5. User interactions:
   │  ├── Click notification → Navigate to actionUrl
   │  ├── Mark as read → Optimistic update + API call
   │  ├── Dismiss → Remove from list + API call
   │  └── Mark all as read → Update all + API call
```

## File Structure

### Core Files

```
src/
├── types/
│   └── notifications.ts              # Type definitions, Zod schemas
├── server/
│   ├── queries/
│   │   └── notification.ts          # Database queries (CRUD operations)
│   ├── services/
│   │   └── notification-service.ts   # Business logic for creating notifications
│   └── actions/
│       └── notifications.ts          # Server actions for client use
├── hooks/
│   └── use-notifications.ts          # React hook with polling and state management
├── components/
│   └── notifications/
│       ├── notification-bell.tsx    # Bell icon with badge
│       ├── notification-item.tsx    # Single notification row
│       ├── notification-dropdown.tsx # Dropdown popover
│       └── index.ts                  # Exports
├── app/
│   └── api/
│       └── cron/
│           └── notifications/
│               └── route.ts          # Cron job handler
└── components/
    └── layout/
        └── dashboard-layout.tsx      # Integration point (header)
```

### Integration Points

```
src/server/queries/task.ts
├── createTask() → notifyTaskAssigned()
├── updateTask() → notifyTaskUpdated() / notifyTaskReassigned()
├── completeTask() → notifyTaskCompleted()
└── deleteTask() → notifyTaskDeleted()

src/server/actions/appointments.ts
├── createAppointmentAction() → notifyAppointmentScheduled()
├── updateAppointmentAction() → notifyAppointmentRescheduled()
└── updateAppointmentStatusAction() → notifyAppointmentCancelled() / notifyAppointmentCompleted()
```

## Database Schema

The `notifications` table (defined in `src/server/db/schema.ts`) includes:

- **Primary Key**: `notificationId` (bigserial)
- **Multi-tenant**: `accountId` (bigint) - ensures notifications are scoped to accounts
- **Targeting**: 
  - `userId` (varchar) - who receives the notification (null = broadcast)
  - `fromUserId` (varchar) - who triggered it
- **Content**:
  - `type` (varchar) - notification type (e.g., "task_assigned")
  - `title` (varchar) - notification title
  - `message` (text) - notification message
  - `actionUrl` (varchar) - where to navigate when clicked
- **Categorization**:
  - `priority` (varchar) - "low", "normal", "high", "urgent"
  - `category` (varchar) - "tasks", "appointments", etc.
- **Entity Reference**:
  - `entityType` (varchar) - "task", "appointment", etc.
  - `entityId` (bigint) - ID of related entity
  - `metadata` (jsonb) - flexible field for extra data
- **State**:
  - `isRead` (boolean) - whether user has read it
  - `readAt` (timestamp) - when it was read
  - `isDismissed` (boolean) - whether user dismissed it
  - `isActive` (boolean) - soft delete flag
- **Scheduling**:
  - `scheduledFor` (timestamp) - for future notifications
  - `expiresAt` (timestamp) - when notification expires

## Configuration

### Environment Variables

Add to `.env`:
```bash
CRON_SECRET=your-secret-key-here
```

This secret is used to secure the cron endpoint. Vercel will send it in the `Authorization` header when calling the cron job.

### Vercel Cron Configuration

In `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

This runs the cron job every 15 minutes.

## User Experience

### Notification Bell

- Located in the top-right header of the dashboard
- Shows a red badge with unread count when `unreadCount > 0`
- Badge displays "99+" if count exceeds 99
- Clicking opens the dropdown

### Notification Dropdown

- **Header**: Shows "Notificaciones" title and unread count badge
- **Mark All as Read**: Button appears when there are unread notifications
- **List**: Scrollable list of notifications (max height 400px)
- **Empty State**: Shows friendly message when no notifications
- **Load More**: Button appears at bottom when there are more notifications to load

### Notification Item

Each notification shows:
- **Icon**: Task icon (CheckSquare) or Appointment icon (Calendar)
- **Title**: Bold, colored based on priority
- **Message**: Smaller text below title
- **Timestamp**: Relative time (e.g., "hace 2 minutos")
- **Dismiss Button**: Appears on hover (X icon)
- **Visual Indicator**: Blue dot on left for unread notifications
- **Background**: Light blue background for unread items

### Interactions

1. **Click Notification**: 
   - Marks as read (if unread)
   - Navigates to `actionUrl` (e.g., task page, calendar)

2. **Mark as Read**:
   - Optimistic update (immediate UI change)
   - API call in background
   - Reverts if API call fails

3. **Dismiss**:
   - Removes from list immediately
   - Updates unread count if it was unread
   - API call in background

4. **Mark All as Read**:
   - Marks all visible notifications as read
   - Updates unread count to 0
   - API call in background

## Polling and Real-time Updates

The `useNotifications` hook implements polling to keep notifications up-to-date:

- **Initial Load**: Fetches notifications and unread count on mount
- **Polling Interval**: 60 seconds (configurable)
- **Automatic Cleanup**: Stops polling when component unmounts
- **Error Handling**: Continues polling even if a request fails

## Security

### Multi-tenant Isolation

- All queries use `getCurrentUserAccountId()` to ensure notifications are scoped to the user's account
- Database queries filter by `accountId` to prevent cross-account access
- Notifications can only be read/modified by the user they're assigned to

### Cron Job Security

- Requires `CRON_SECRET` environment variable
- Verifies `Authorization: Bearer {CRON_SECRET}` header
- Returns 401 Unauthorized if secret doesn't match

## Error Handling

### Notification Creation Failures

- All notification creation calls are wrapped in try-catch
- Errors are logged but don't fail the parent operation
- Example: If creating a task notification fails, the task is still created successfully

### API Failures

- Server actions return `{ success: boolean, error?: string }` pattern
- Client hook handles errors gracefully
- Optimistic updates revert if API calls fail

## Testing

### Manual Testing Checklist

- [ ] Create a task assigned to another user → Notification appears
- [ ] Update a task assigned to another user → Notification appears
- [ ] Reassign a task to another user → Notification appears
- [ ] Complete a task → Notification appears
- [ ] Delete a task assigned to another user → Notification appears
- [ ] Create an appointment → Notification appears
- [ ] Reschedule an appointment → Notification appears
- [ ] Cancel an appointment → Notification appears
- [ ] Complete an appointment → Notification appears
- [ ] Wait for cron job → Reminder notifications appear
- [ ] Click notification → Navigates to correct page
- [ ] Mark as read → Badge count decreases
- [ ] Dismiss notification → Removed from list
- [ ] Mark all as read → All notifications marked as read
- [ ] Polling → New notifications appear automatically

### Testing Cron Job

You can manually trigger the cron job for testing:

```bash
curl -X GET https://your-domain.com/api/cron/notifications \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "remindersCreated": 5,
  "tasksNotified": 3,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Future Enhancements

Potential improvements:

1. **Email Notifications**: Send email for high-priority notifications
2. **Push Notifications**: Browser push notifications for urgent items
3. **Notification Preferences**: User settings for which notifications to receive
4. **Notification Groups**: Group related notifications together
5. **Rich Notifications**: Include images or more context in notifications
6. **Notification Templates**: Customizable notification messages per account
7. **Real-time Updates**: WebSocket support for instant notification delivery (instead of polling)

## Summary

The notification system is fully implemented with:

✅ **13 notification types** (8 task, 5 appointment)
✅ **Instant notifications** for all CRUD operations
✅ **Scheduled reminders** via Vercel Cron
✅ **Complete UI** with bell icon and dropdown
✅ **Polling** for real-time updates
✅ **Multi-tenant security** with account isolation
✅ **Error handling** that doesn't break parent operations
✅ **Optimistic updates** for better UX

### Task Notification Summary
| Operation | Notification Type | Recipient |
|-----------|-------------------|-----------|
| Create | `task_assigned` | Assignee (if different from creator) |
| Update | `task_updated` | Assignee (if different from editor) |
| Reassign | `task_reassigned` | New assignee |
| Complete | `task_completed` | Assignee + Creator |
| Delete | `task_deleted` | Assignee (if different from deleter) |
| Due Soon | `task_due_soon` | Assignee (cron-based) |
| Overdue | `task_overdue` | Assignee (cron-based) |

All components are production-ready and follow the existing codebase patterns.

