# Vesta Database ER Diagram

## Core Entity Relationship Diagram

This diagram focuses on the main tables: **Properties**, **Listings**, **ListingContacts**, and **Contacts**, along with their key relationships.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ACCOUNTS (Multi-tenant)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ account_id (PK)                                                      │   │
│  │ name, shortName, legalName, logo                                    │   │
│  │ plan, subscriptionStatus, status                                     │   │
│  │ portalSettings (JSONB), preferences (JSONB)                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1
                                    │
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   PROPERTIES │         │   LISTINGS    │         │   CONTACTS    │
│              │         │               │         │               │
│ property_id  │◄───1───│ listing_id    │         │ contact_id    │
│ (PK)         │    N    │ (PK)          │         │ (PK)          │
│              │         │               │         │               │
│ account_id   │         │ account_id    │         │ account_id    │
│ (FK)         │         │ (FK)          │         │ (FK)          │
│              │         │               │         │               │
│ property_id  │         │ property_id   │         │ firstName     │
│ (FK) ────────┼─────────►│ (FK)          │         │ lastName      │
│              │         │               │         │ nif            │
│ Basic Info:  │         │ agent_id      │         │ email         │
│ - title      │         │ (FK → users)  │         │ phone         │
│ - description│         │               │         │               │
│ - type       │         │ Listing Info: │         │ org_id        │
│              │         │ - listingType │         │ (FK → orgs)  │
│ Specs:       │         │   (Sale/Rent) │         │               │
│ - bedrooms   │         │ - price       │         │ rating        │
│ - bathrooms  │         │ - status      │         │ source        │
│ - sqm        │         │               │         │               │
│              │         │ Features:     │         │ additionalInfo│
│ Location:    │         │ - isFurnished │         │ (JSONB)       │
│ - street     │         │ - petsAllowed │         │               │
│ - postalCode │         │ - appliances  │         │               │
│ - lat/lng    │         │               │         │               │
│              │         │ Portals:      │         │               │
│ Energy:      │         │ - fotocasa    │         │               │
│ - cert       │         │ - idealista   │         │               │
│ - scale      │         │ - habitaclia  │         │               │
│              │         │               │         │               │
│ Amenities:   │         │ Portal Props:│         │               │
│ - elevator   │         │ - fotocasaProps│       │               │
│ - garage     │         │   (JSONB)     │         │               │
│ - pool       │         │               │         │               │
│              │         │               │         │               │
└──────────────┘         └───────┬───────┘         └───────┬───────┘
                                 │                        │
                                 │                        │
                                 │                        │
                    ┌────────────┴────────────┐           │
                    │                         │           │
                    │                         │           │
                    ▼                         ▼           │
         ┌──────────────────────┐            │           │
         │  LISTING_CONTACTS    │            │           │
         │  (Junction Table)    │            │           │
         │                      │            │           │
         │ listing_contact_id   │            │           │
         │ (PK)                 │            │           │
         │                      │            │           │
         │ listing_id (FK) ─────┼────────────┘           │
         │ contact_id (FK) ─────┼────────────────────────┘
         │                      │
         │ contactType          │
         │ (buyer/owner/viewer) │
         │                      │
         │ prospect_id (FK)     │
         │ source               │
         │ status               │
         │                      │
         │ offer                │
         │ offerAccepted        │
         │                      │
         └──────────────────────┘
                    │
                    │
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│   DEALS   │ │ APPOINT-  │ │   TASKS   │
│           │ │   MENTS   │ │           │
│ deal_id   │ │ appoint-  │ │ task_id   │
│ (PK)      │ │ ment_id   │ │ (PK)      │
│           │ │ (PK)      │ │           │
│ listing_id│ │ listing_id│ │ listing_id│
│ (FK)      │ │ (FK)      │ │ (FK)      │
│           │ │           │ │           │
│ listing_  │ │ listing_  │ │ listing_  │
│ contact_id│ │ contact_id│ │ contact_id│
│ (FK)      │ │ (FK)      │ │ (FK)      │
│           │ │           │ │           │
│ status    │ │ datetime_ │ │ title     │
│ finalPrice│ │ start/end │ │ dueDate   │
│           │ │           │ │ completed │
│ commission│ │ contact_id│ │           │
│ arras     │ │ (FK)      │ │           │
│           │ │           │ │           │
└───────────┘ └───────────┘ └───────────┘
```

## Detailed Relationship Map

### 1. PROPERTIES Table
**Primary Key:** `property_id`
**Foreign Keys:**
- `account_id` → `accounts.account_id` (Multi-tenant)
- `neighborhood_id` → `locations.neighborhood_id` (Optional)

**Relationships:**
- **1:N** with `listings` (One property can have multiple listings - sale, rent, etc.)
- **1:N** with `property_images` (One property has many images)
- **1:N** with `documents` (One property can have many documents)
- **1:N** with `comments` (One property can have many comments)

### 2. LISTINGS Table
**Primary Key:** `listing_id`
**Foreign Keys:**
- `account_id` → `accounts.account_id` (Multi-tenant)
- `property_id` → `properties.property_id` (Required - listing belongs to a property)
- `agent_id` → `users.id` (Required - agent managing the listing)

**Relationships:**
- **N:1** with `properties` (Many listings belong to one property)
- **1:N** with `listing_contacts` (One listing can have many contacts - buyers, owners, viewers)
- **1:N** with `deals` (One listing can have multiple deals - offers, contracts)
- **1:N** with `appointments` (One listing can have many appointments/visits)
- **1:N** with `tasks` (One listing can have many tasks)
- **1:N** with `documents` (One listing can have many documents)
- **1:N** with `comments` (One listing can have many comments)
- **1:N** with `listing_activity` (Activity log for listing changes)

**Key Fields:**
- `listingType`: 'Sale' | 'Rent' | 'Sold' | 'Transfer' | 'RentWithOption' | 'RoomSharing'
- `status`: 'En Venta' | 'En Alquiler' | 'Vendido' | 'Alquilado' | 'Descartado' | 'Draft'
- Portal flags: `fotocasa`, `idealista`, `habitaclia`, etc.
- Portal configs: `fotocasaProps`, `idealistaProps` (JSONB)

### 3. CONTACTS Table
**Primary Key:** `contact_id`
**Foreign Keys:**
- `account_id` → `accounts.account_id` (Multi-tenant)
- `org_id` → `organizations.org_id` (Optional - contact can belong to an organization)

**Relationships:**
- **1:N** with `listing_contacts` (One contact can be associated with many listings)
- **1:N** with `prospects` (One contact can have multiple prospect records)
- **1:N** with `appointments` (One contact can have many appointments)
- **1:N** with `tasks` (One contact can have many tasks)
- **1:N** with `documents` (One contact can have many documents)
- **1:N** with `user_comments` (One contact can have many comments)
- **1:N** with `contact_activity` (Activity log for contact changes)
- **N:1** with `organizations` (Many contacts can belong to one organization)

**Key Fields:**
- Personal info: `firstName`, `lastName`, `nif`, `email`, `phone`
- `rating`: 1-5 scale for contact quality/importance
- `source`: Where contact came from (Website, Walk-In, Referral)
- `additionalInfo`: JSONB for flexible data storage

### 4. LISTING_CONTACTS Table (Junction Table)
**Primary Key:** `listing_contact_id`
**Foreign Keys:**
- `listing_id` → `listings.listing_id` (Nullable - can exist without listing)
- `contact_id` → `contacts.contact_id` (Required)
- `prospect_id` → `prospects.id` (Optional - links to prospect record)

**Purpose:**
- Connects listings with contacts (Many-to-Many relationship)
- Tracks the role/relationship: `contactType` ('buyer', 'owner', 'viewer')
- Stores lead/offer information: `offer`, `offerAccepted`, `status`, `source`
- Replaces the old `leads` table functionality

**Relationships:**
- **N:1** with `listings` (Many listing-contacts belong to one listing)
- **N:1** with `contacts` (Many listing-contacts belong to one contact)
- **N:1** with `prospects` (Optional - can link to prospect record)
- **1:N** with `listing_contact_activity` (Activity log)
- **1:N** with `listing_contact_comments` (Comments on the relationship)
- **1:N** with `deals` (Deals can reference a listing-contact)
- **1:N** with `appointments` (Appointments can reference a listing-contact)
- **1:N** with `tasks` (Tasks can reference a listing-contact)
- **1:N** with `documents` (Documents can reference a listing-contact)

## Supporting Tables

### DEALS Table
- Links to `listings` and optionally `listing_contacts`
- Tracks transaction lifecycle: status, price, commission, arras (deposit)
- Stores financial details: final price, commission, fees, taxes
- Timeline tracking: arras date, deed date, key handover

### APPOINTMENTS Table
- Can link to: `listings`, `listing_contacts`, `contacts`, `deals`, `prospects`, `tasks`
- Tracks visits, meetings, and scheduled activities
- Google Calendar integration fields

### TASKS Table
- Can link to: `listings`, `listing_contacts`, `contacts`, `deals`, `appointments`, `prospects`
- Task management with status workflow
- Due dates and completion tracking

### DOCUMENTS Table
- Polymorphic relationships: can link to properties, listings, contacts, deals, etc.
- S3 storage integration
- Document integrity tracking (hash, timestamp)

### PROSPECTS Table
- Links to `contacts`
- Dual-type system: 'search' (looking for properties) or 'listing' (wanting to list)
- Stores search criteria: price range, location, property type, etc.

## Key Design Patterns

1. **Multi-tenant Architecture**: All main tables have `account_id` for data isolation
2. **Polymorphic Relationships**: Many tables can link to multiple entity types (e.g., `documents`, `tasks`, `appointments`)
3. **Activity Logging**: Separate activity tables track changes (`listing_activity`, `deal_activity`, `contact_activity`)
4. **JSONB Flexibility**: Portal configs, preferences, and metadata stored as JSONB
5. **Soft Deletes**: `isActive` flags instead of hard deletes
6. **Junction Tables**: `listing_contacts` enables many-to-many relationships with additional metadata

## Current Listing Types

The `listings.listingType` field supports:
- `'Sale'` - Property for sale
- `'Rent'` - Property for rent
- `'Sold'` - Property that was sold
- `'Transfer'` - Property transfer
- `'RentWithOption'` - Rent with option to buy
- `'RoomSharing'` - Room sharing/roommate situation

**Note:** The system already has basic rent support through `listingType = 'Rent'`, but a full rent management module would add:
- Rent contracts/leases
- Payment tracking
- Tenant management
- Maintenance requests
- Lease renewals
- Deposit management
- etc.

