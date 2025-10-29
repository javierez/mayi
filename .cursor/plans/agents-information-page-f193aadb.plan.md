<!-- f193aadb-6ebd-4402-977f-70f8db09c3f4 2f2b1e7c-c7d3-4f09-b59a-251984e4bf51 -->
# Agents Information Summary Page

## Overview

Build a comprehensive agent information dashboard at `/agents` that displays hierarchical data: contacts (owners) → their listings → listing contacts → tasks/appointments, plus urgent actions.

## Access Control

- **Regular agents (roleId=2)**: See only their own information
- **Account Admins (roleId=3)**: See all agents with dropdown selector (defaults to their own)
- Use existing `getSecureSession()` from `src/lib/dal.ts` and role checking

## File Structure

```
src/app/(dashboard)/agents/page.tsx           # Main page component
src/server/queries/agent-summary.ts           # New query file for agent data
src/components/agents/                        # Agent UI components
 - agent-selector.tsx                        # Dropdown for Account Admins
 - agent-summary-cards.tsx                  # Stats overview cards
 - agent-contacts-section.tsx                # Contacts (owners) list
 - agent-hierarchy-view.tsx                  # Hierarchical data view
 - agent-urgent-actions.tsx                  # Urgent tasks/appointments
```

## Database Queries

Create `src/server/queries/agent-summary.ts` with:

1. **`getAgentSummaryStats(userId, accountId)`** - Returns counts:

                        - Active assigned listings (status != 'Draft' AND isActive = true)
                        - Contact listings count
                        - Deals count
                        - Contacts count
                        - Tasks assigned count
                        - Calendar events count

2. **`getAgentContactsOwners(userId, accountId)`** - Returns contacts that are owners:

                        - Contact info (firstName, lastName, email, phone)
                        - Linked to listings where agent is assigned
                        - Filter: contactType = 'owner' only

3. **`getAgentListingsWithDetails(userId, accountId)`** - Returns listings:

                        - Where agent is assigned (agentId = userId)
                        - Status != 'Draft' AND isActive = true
                        - Include property details, price, status
                        - Include owner contact info via JOIN

4. **`getAgentListingContacts(listingIds, accountId)`** - Returns listing contacts:

                        - For the specified listings
                        - Include contact info and type (buyer/owner/viewer)

5. **`getAgentTasksAndAppointments(userId, accountId)`** - Returns:

                        - Tasks where userId matches AND related to agent's listings
                        - Appointments assigned to agent or related to agent's listings

6. **`getUrgentAgentActions(userId, accountId)`** - Returns:

                        - Tasks due in next 5 working days
                        - Upcoming appointments
                        - Overdue tasks

## UI Components

### Main Page (`page.tsx`)

- Use `"use client"` directive
- Implement role-based rendering:
                - If roleId = 3 (Account Admin): Show agent selector
                - Otherwise: Show current user's info only
- Fetch data using queries above
- Display using summary cards + hierarchy view

### `AgentSelector` Component

- Dropdown showing all agents in account
- Query: `SELECT id, name, firstName, lastName FROM users WHERE accountId = X AND isActive = true`
- Default to current user
- Trigger data refresh when selection changes

### `AgentSummaryCards` Component

- Display 6 stat cards:
                - Active Listings count
                - Contacts count
                - Deals count
                - Tasks count
                - Appointments count
- Use existing Card UI components from `src/components/ui/card.tsx`

### `AgentHierarchyView` Component

- Collapsible/expandable sections:

                1. Contacts (owners only)

                                        - Contact name, email, phone
                                        - Expand → Show their listings

                1. For each listing:

                                        - Listing title, price, status
                                        - Expand → Show listing contacts (buyers/viewers)
                                        - Expand further → Show related tasks
                                        - Expand further → Show related appointments
- Use Accordion component from `src/components/ui/accordion.tsx`
- Follow existing UI patterns from leads/operations pages

### `AgentUrgentActions` Component

- Similar to `WorkQueueCard` from `src/components/dashboard/WorkQueueCard.tsx`
- Show urgent tasks and upcoming appointments
- Click to expand detail

## Implementation Steps

1. **Create query file** (`agent-summary.ts`):

                        - Implement all 6 query functions
                        - Use existing patterns from `src/server/queries/`
                        - Follow accountId filtering pattern
                        - Handle userId filtering for non-Admin users

2. **Create agent components directory**:

                        - Build components following existing UI patterns
                        - Use Lucide icons for consistency
                        - Implement loading states

3. **Create main page** (`page.tsx`):

                        - Implement role checking
                        - Fetch data on mount and agent selection change
                        - Render appropriate view based on role

4. **Add route to navigation** (if needed):

                        - Update dashboard navigation to include "Agentes" link

## Follow Existing Patterns

- UI: Match `src/app/(dashboard)/operaciones/page.tsx`
- Queries: Follow structure from `src/server/queries/operaciones-dashboard.ts`
- Components: Use Card, Accordion, Badge from `src/components/ui/`
- Icons: Use Lucide (existing in codebase)
- Permissions: Use existing auth patterns from `src/lib/dal.ts` and `src/lib/permissions.ts`

### To-dos

- [ ] Create agent-summary.ts query file with 6 query functions (stats, contacts, listings, listing contacts, tasks/appointments, urgent actions)
- [ ] Create AgentSelector component for Account Admins to select which agent to view
- [ ] Create AgentSummaryCards component to display stat cards (listings, contacts, deals, tasks, appointments)
- [ ] Create AgentHierarchyView component with expandable sections for contacts → listings → listing contacts → tasks/appointments
- [ ] Create AgentUrgentActions component for urgent tasks and appointments
- [ ] Create main page.tsx with role-based access control and data fetching logic
- [ ] Add loading states and error handling throughout