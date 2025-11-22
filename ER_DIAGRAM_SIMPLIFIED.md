# Vesta Database - Simplified ER Diagram

## Core Entity Relationships (Main Focus)

```
                    ┌─────────────┐
                    │   ACCOUNTS  │ (Multi-tenant root)
                    │             │
                    │ account_id  │
                    │   (PK)      │
                    └──────┬──────┘
                           │
                           │ 1
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ PROPERTIES   │   │  LISTINGS    │   │  CONTACTS    │
│              │   │              │   │              │
│ property_id  │◄──│ listing_id    │   │ contact_id   │
│   (PK)       │ 1 │   (PK)       │   │   (PK)       │
│              │ N │              │   │              │
│ account_id   │   │ account_id   │   │ account_id   │
│   (FK)       │   │   (FK)       │   │   (FK)       │
│              │   │              │   │              │
│ property_id  │   │ property_id  │   │ firstName    │
│   (FK) ──────┼───►│   (FK)       │   │ lastName     │
│              │   │              │   │ nif          │
│              │   │ agent_id     │   │ email        │
│              │   │   (FK)       │   │ phone        │
│              │   │              │   │              │
│              │   │ listingType  │   │ org_id       │
│              │   │ (Sale/Rent)  │   │   (FK)       │
│              │   │              │   │              │
│              │   │ price        │   │              │
│              │   │ status       │   │              │
│              │   │              │   │              │
└──────────────┘   └──────┬───────┘   └──────┬───────┘
                          │                  │
                          │                  │
                          │                  │
                          │                  │
                    ┌─────┴──────────────────┴─────┐
                    │                             │
                    │                             │
                    ▼                             ▼
         ┌──────────────────────────┐
         │   LISTING_CONTACTS       │
         │   (Junction Table)       │
         │                          │
         │ listing_contact_id (PK)  │
         │                          │
         │ listing_id (FK) ─────────┘
         │ contact_id (FK) ─────────┐
         │                          │
         │ contactType              │
         │ (buyer/owner/viewer)     │
         │                          │
         │ prospect_id (FK)         │
         │ source                   │
         │ status                   │
         │                          │
         │ offer                    │
         │ offerAccepted            │
         │                          │
         └──────────────────────────┘
                    │
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   ┌────────┐ ┌──────────┐ ┌────────┐
   │ DEALS  │ │APPOINT- │ │ TASKS  │
   │        │ │  MENTS  │ │        │
   │deal_id │ │appoint- │ │task_id │
   │        │ │ment_id  │ │        │
   │listing │ │listing_id│ │listing │
   │_id(FK) │ │   (FK)   │ │_id(FK) │
   │        │ │          │ │        │
   │listing │ │listing_  │ │listing_│
   │contact │ │contact_id│ │contact │
   │_id(FK) │ │   (FK)   │ │_id(FK) │
   │        │ │          │ │        │
   │status  │ │datetime_ │ │title   │
   │price   │ │start/end │ │dueDate │
   │        │ │          │ │        │
   └────────┘ └──────────┘ └────────┘
```

## Key Relationships Explained

### 1. PROPERTIES ↔ LISTINGS
- **Relationship:** One-to-Many (1:N)
- **Cardinality:** One property can have multiple listings
- **Example:** A property can be listed for both Sale AND Rent simultaneously
- **Foreign Key:** `listings.property_id` → `properties.property_id`

### 2. LISTINGS ↔ LISTING_CONTACTS
- **Relationship:** One-to-Many (1:N)
- **Cardinality:** One listing can have multiple contacts (buyers, owners, viewers)
- **Foreign Key:** `listing_contacts.listing_id` → `listings.listing_id`

### 3. CONTACTS ↔ LISTING_CONTACTS
- **Relationship:** One-to-Many (1:N)
- **Cardinality:** One contact can be associated with multiple listings
- **Foreign Key:** `listing_contacts.contact_id` → `contacts.contact_id`

### 4. LISTING_CONTACTS (Junction Table)
- **Purpose:** Many-to-Many relationship between Listings and Contacts
- **Additional Data Stored:**
  - `contactType`: Role (buyer, owner, viewer)
  - `offer`: Offer amount
  - `offerAccepted`: Whether offer was accepted
  - `status`: Lead/contact status
  - `source`: Where the lead came from
  - `prospect_id`: Link to prospect record

## Current Listing Types

The `listings.listingType` field currently supports:
- `'Sale'` - Property for sale
- `'Rent'` - Property for rent ⚠️ **Basic rent support exists**
- `'Sold'` - Property that was sold
- `'Transfer'` - Property transfer
- `'RentWithOption'` - Rent with option to buy
- `'RoomSharing'` - Room sharing

## Supporting Tables Connected to Core

### DEALS
- Links: `listing_id` (required), `listing_contact_id` (optional)
- Purpose: Track transaction lifecycle (offers, contracts, closings)
- Key for: Sales transactions

### APPOINTMENTS
- Links: `listing_id`, `listing_contact_id`, `contact_id`
- Purpose: Schedule visits, meetings, viewings
- Key for: Both sales and rentals

### TASKS
- Links: `listing_id`, `listing_contact_id`, `contact_id`
- Purpose: Task management for listings and contacts
- Key for: Workflow management

### DOCUMENTS
- Links: `property_id`, `listing_id`, `contact_id`, `deal_id`
- Purpose: Document storage (contracts, IDs, deeds, etc.)
- Key for: Both sales and rentals

## Design Patterns Used

1. **Multi-tenant:** All tables have `account_id` for data isolation
2. **Polymorphic Links:** Many tables can link to multiple entity types
3. **Junction Tables:** Enable many-to-many with additional metadata
4. **Activity Logging:** Separate tables track changes
5. **Soft Deletes:** `isActive` flags instead of hard deletes

## What's Missing for Full Rent Management

The current schema has basic rent support (`listingType = 'Rent'`), but a full rent management module would need:

### New Tables Needed:
1. **RENT_CONTRACTS** (Leases)
   - Link to: `listing_id`, `listing_contact_id` (tenant), `contact_id` (landlord)
   - Fields: start date, end date, monthly rent, deposit, terms

2. **RENT_PAYMENTS**
   - Link to: `rent_contract_id`
   - Fields: amount, due date, paid date, payment method, status

3. **RENT_MAINTENANCE_REQUESTS**
   - Link to: `rent_contract_id`, `property_id`
   - Fields: issue description, priority, status, resolution

4. **RENT_DEPOSITS**
   - Link to: `rent_contract_id`
   - Fields: amount, status (held/returned/forfeited), return date

### Enhanced Existing Tables:
- **LISTINGS**: Already has `listingType = 'Rent'` ✅
- **LISTING_CONTACTS**: Can use `contactType = 'tenant'` or `'landlord'` ✅
- **DEALS**: Could be extended for rental deals or create separate rent-specific deals
- **APPOINTMENTS**: Already supports rental viewings ✅
- **TASKS**: Already supports rental-related tasks ✅

## Next Steps for Rent Module Design

1. **Analyze current rent listings** - How are they currently being used?
2. **Design rent contracts table** - Core of rent management
3. **Design payment tracking** - Monthly rent, deposits, fees
4. **Design maintenance system** - Requests, work orders, tracking
5. **Integrate with existing** - Use `listing_contacts` for tenant/landlord relationships
6. **Extend deals or create rent_deals** - Track rental transactions separately

