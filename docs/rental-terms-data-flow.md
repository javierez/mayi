# End-to-End Data Flow: Rental Terms Card

This document traces the complete lifecycle of a field (e.g., `securityDeposit`) from the database to the UI and back.

---

## Table of Contents

1. [Files Involved](#files-involved)
2. [Data Flow Diagram](#data-flow-diagram)
3. [Step 1: Database Schema](#step-1-database-schema)
4. [Step 2: Server Query - Fetching Data](#step-2-server-query---fetching-data)
5. [Step 3: Type Definitions](#step-3-type-definitions)
6. [Step 4: Type Conversion](#step-4-type-conversion)
7. [Step 5: Server Component (Page)](#step-5-server-component-page)
8. [Step 6: Client Wrapper & Tabs](#step-6-client-wrapper--tabs)
9. [Step 7: Parent Form - State Management](#step-7-parent-form---state-management)
10. [Step 8: Card Component - UI](#step-8-card-component---ui)
11. [Step 9: User Input Handling](#step-9-user-input-handling)
12. [Step 10: Save Module Function](#step-10-save-module-function)
13. [Step 11: Server Query - Updating Data](#step-11-server-query---updating-data)
14. [Complete File Inventory](#complete-file-inventory)

---

## Files Involved

| # | File | Role |
|---|------|------|
| 1 | `src/server/db/schema.ts` | Database schema definition |
| 2 | `src/server/queries/listing.ts` | Fetch & update queries |
| 3 | `src/types/property-listing.ts` | TypeScript interface & conversion |
| 4 | `src/app/(dashboard)/propiedades/[id]/page.tsx` | Server component (page) |
| 5 | `src/components/propiedades/detail/property-tabs.tsx` | Client tabs wrapper |
| 6 | `src/components/propiedades/form/property-characteristics-form.tsx` | Parent form (state management) |
| 7 | `src/components/propiedades/form/cards/rental-terms-card.tsx` | UI card component |
| 8 | `src/types/save-state.ts` | SaveState type |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE                                        │
│  listings table → securityDeposit: decimal("security_deposit", {10,2})      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVER QUERY (FETCH)                                  │
│  getListingDetails() → SELECT securityDeposit FROM listings                 │
│  File: src/server/queries/listing.ts:1862                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TYPE CONVERSION                                       │
│  convertDbListingToPropertyListing() → securityDeposit: getNumber(value)    │
│  File: src/types/property-listing.ts:421                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVER COMPONENT (PAGE)                               │
│  PropertyPage → getListingDetailsWithAuth(listingId)                        │
│  File: src/app/(dashboard)/propiedades/[id]/page.tsx:80                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT WRAPPER                                        │
│  PropertyTabsClientWrapper → convertedListing prop                          │
│  PropertyTabs → passes to PropertyCharacteristicsForm                       │
│  File: src/components/propiedades/detail/property-tabs.tsx:651-652          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PARENT FORM (STATE)                                   │
│  useState: securityDeposit = listing.securityDeposit ?? null                │
│  File: src/components/propiedades/form/property-characteristics-form.tsx    │
│  Lines: 1081-1082                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CARD COMPONENT (UI)                                   │
│  <RentalTermsCard securityDeposit={securityDeposit} ... />                  │
│  File: src/components/propiedades/form/cards/rental-terms-card.tsx          │
│  Renders: <Input value={securityDeposit ?? ""} />                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                            │
│  onChange → handleNumericChange() → setSecurityDeposit(value)               │
│  File: rental-terms-card.tsx:86-93 + 154-156                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SAVE MODULE                                           │
│  saveModule("rentalTerms") → collects { securityDeposit, ... }              │
│  File: property-characteristics-form.tsx:639-649                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVER QUERY (UPDATE)                                 │
│  updateListingWithAuth(listingId, data) → updateListing()                   │
│  File: src/server/queries/listing.ts:90-96, 374-435                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE                                        │
│  db.update(listings).set({ securityDeposit }).where(...)                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Database Schema

**File:** `src/server/db/schema.ts` (lines 513-519)

The rental terms fields are defined in the `listings` table:

```typescript
// listings table definition
export const listings = pgTable("listings", {
  // ... other fields ...

  // Rental Terms (deposit and guarantees)
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }),
  additionalGuarantee: decimal("additional_guarantee", { precision: 10, scale: 2 }),
  bankGuaranteeRequired: boolean("bank_guarantee_required").default(false),
  managementFees: decimal("management_fees", { precision: 10, scale: 2 }),
  nonPaymentInsurance: boolean("non_payment_insurance").default(false),
  nonPaymentInsuranceAmount: decimal("non_payment_insurance_amount", { precision: 10, scale: 2 }),

  // ... other fields ...
});
```

**Key Points:**
- Stored in `listings` table (not `properties`)
- Decimal fields use `precision: 10, scale: 2` for monetary values (up to €99,999,999.99)
- Boolean fields default to `false`
- All fields are nullable (optional)

---

## Step 2: Server Query - Fetching Data

**File:** `src/server/queries/listing.ts`

### Auth Wrapper (line 154-166)

```typescript
export async function getListingDetailsWithAuth(listingId: number) {
  const accountId = await getCurrentUserAccountId();

  try {
    const listingDetails = await getListingDetails(listingId, accountId);
    return listingDetails;
  } catch (error) {
    console.error(`Error in getListingDetailsWithAuth:`, error);
    throw error;
  }
}
```

### Main Query (lines 1813-1868)

```typescript
export async function getListingDetails(listingId: number, accountId: number) {
  const query = db
    .select({
      // ... other fields ...

      // Rental Terms - Deposit & Guarantees
      securityDeposit: listings.securityDeposit,
      additionalGuarantee: listings.additionalGuarantee,
      bankGuaranteeRequired: listings.bankGuaranteeRequired,
      // Rental Terms - Management & Insurance
      managementFees: listings.managementFees,
      nonPaymentInsurance: listings.nonPaymentInsurance,
      nonPaymentInsuranceAmount: listings.nonPaymentInsuranceAmount,

      // ... other fields ...
    })
    .from(listings)
    .leftJoin(properties, eq(listings.propertyId, properties.propertyId))
    .where(
      and(
        eq(listings.listingId, BigInt(listingId)),
        eq(listings.accountId, BigInt(accountId)),
        eq(listings.isActive, true),
      ),
    );

  // ... execute and return ...
}
```

**Key Points:**
- Multi-tenant security: filters by `accountId`
- Joins with `properties` table for additional data
- Returns raw database values (decimals as strings)

---

## Step 3: Type Definitions

**File:** `src/types/property-listing.ts` (lines 205-211)

```typescript
export interface PropertyListing {
  // ... other fields ...

  // Rental Terms (listings table)
  securityDeposit?: number;
  additionalGuarantee?: number;
  bankGuaranteeRequired?: boolean;
  managementFees?: number;
  nonPaymentInsurance?: boolean;
  nonPaymentInsuranceAmount?: number;

  // ... other fields ...
}
```

**Key Points:**
- All fields are optional (`?`)
- Numeric fields typed as `number` (converted from database decimals)
- Boolean fields typed as `boolean`

---

## Step 4: Type Conversion

**File:** `src/types/property-listing.ts` (lines 256-426)

```typescript
export function convertDbListingToPropertyListing(
  dbListing: Record<string, unknown>,
): PropertyListing {
  // Helper functions
  const getNumber = (value: unknown): number | undefined =>
    value ? Number(value) : undefined;
  const getBoolean = (value: unknown): boolean | undefined =>
    value === null || value === undefined ? undefined : Boolean(value);

  return {
    // ... other fields ...

    // Rental Terms
    securityDeposit: getNumber(dbListing.securityDeposit),
    additionalGuarantee: getNumber(dbListing.additionalGuarantee),
    bankGuaranteeRequired: getBoolean(dbListing.bankGuaranteeRequired),
    managementFees: getNumber(dbListing.managementFees),
    nonPaymentInsurance: getBoolean(dbListing.nonPaymentInsurance),
    nonPaymentInsuranceAmount: getNumber(dbListing.nonPaymentInsuranceAmount),

    // ... other fields ...
  };
}
```

**Key Points:**
- Converts database decimals (strings) to JavaScript numbers
- Handles null/undefined gracefully
- Creates a clean typed object for the UI

---

## Step 5: Server Component (Page)

**File:** `src/app/(dashboard)/propiedades/[id]/page.tsx` (lines 70-82, 233-246)

```typescript
export default async function PropertyPage({ params }: PropertyPageProps) {
  const listingId = parseInt(unwrappedParams.id);

  // Fetch data in parallel
  const [
    breadcrumbData,
    headerData,
    tabsData,
    fullListingDetails,  // ← Raw listing data
    hasEditPermission,
  ] = await Promise.all([
    getListingBreadcrumbData(listingId),
    getListingHeaderData(listingId),
    getListingTabsData(listingId),
    getListingDetailsWithAuth(listingId),  // ← Fetches rental terms
    canEditProperties(),
  ]);

  return (
    <PropertyTabsClientWrapper
      listing={tabsData}
      convertedListing={
        isValidRecord(fullListingDetails)
          ? convertDbListingToPropertyListing(fullListingDetails)  // ← Conversion happens here
          : undefined
      }
      canEdit={hasEditPermission}
    />
  );
}
```

**Key Points:**
- Server-side data fetching (no client fetch needed)
- Parallel fetching for performance
- Conversion to `PropertyListing` type before passing to client

---

## Step 6: Client Wrapper & Tabs

**File:** `src/components/propiedades/detail/property-tabs.tsx` (lines 646-673)

```typescript
export function PropertyTabs({
  listing: initialListing,
  convertedListing,  // ← PropertyListing with rental terms
  canEdit = true,
}: PropertyTabsProps) {
  const [tabData, setTabData] = useState({
    convertedListing: convertedListing ?? null,
    // ... other state ...
  });

  return (
    <TabsContent value="general">
      {(tabData.convertedListing ?? convertedListing) ? (
        <PropertyCharacteristicsForm
          listing={tabData.convertedListing ?? convertedListing!}  // ← Passed to form
        />
      ) : null}
    </TabsContent>
  );
}
```

**Key Points:**
- Receives `convertedListing` as prop from server component
- Manages tab state
- Passes listing data to the characteristics form

---

## Step 7: Parent Form - State Management

**File:** `src/components/propiedades/form/property-characteristics-form.tsx`

### State Initialization (lines 1080-1098)

```typescript
export function PropertyCharacteristicsForm({
  listing,  // ← PropertyListing type
}: PropertyCharacteristicsFormProps) {
  // Rental Terms State
  const [securityDeposit, setSecurityDeposit] = useState<number | null>(
    listing.securityDeposit ?? null,
  );
  const [additionalGuarantee, setAdditionalGuarantee] = useState<number | null>(
    listing.additionalGuarantee ?? null,
  );
  const [bankGuaranteeRequired, setBankGuaranteeRequired] = useState(
    listing.bankGuaranteeRequired ?? false,
  );
  const [managementFees, setManagementFees] = useState<number | null>(
    listing.managementFees ?? null,
  );
  const [nonPaymentInsurance, setNonPaymentInsurance] = useState(
    listing.nonPaymentInsurance ?? false,
  );
  const [nonPaymentInsuranceAmount, setNonPaymentInsuranceAmount] = useState<number | null>(
    listing.nonPaymentInsuranceAmount ?? null,
  );
  // ...
}
```

### Rendering the Card (lines 1819-1843)

```typescript
<RentalTermsCard
  securityDeposit={securityDeposit}
  additionalGuarantee={additionalGuarantee}
  bankGuaranteeRequired={bankGuaranteeRequired}
  managementFees={managementFees}
  nonPaymentInsurance={nonPaymentInsurance}
  nonPaymentInsuranceAmount={nonPaymentInsuranceAmount}
  listingType={currentListingType}
  collapsedSections={collapsedSections}
  saveState={moduleStates.rentalTerms?.saveState ?? "idle"}
  canEdit={canEdit}
  onToggleSection={toggleSection}
  onSave={() => saveModule("rentalTerms")}
  onUpdateModule={(hasChanges) => updateModuleState("rentalTerms", hasChanges)}
  setSecurityDeposit={setSecurityDeposit}
  setAdditionalGuarantee={setAdditionalGuarantee}
  setBankGuaranteeRequired={setBankGuaranteeRequired}
  setManagementFees={setManagementFees}
  setNonPaymentInsurance={setNonPaymentInsurance}
  setNonPaymentInsuranceAmount={setNonPaymentInsuranceAmount}
  getCardStyles={getCardStyles}
/>
```

**Key Points:**
- State initialized from `listing` prop using nullish coalescing (`??`)
- Each field has its own `useState` hook
- State setters passed as props to the card component

---

## Step 8: Card Component - UI

**File:** `src/components/propiedades/form/cards/rental-terms-card.tsx`

### Props Interface (lines 27-53)

```typescript
interface RentalTermsCardProps {
  // Deposit & Guarantees
  securityDeposit: number | null;
  additionalGuarantee: number | null;
  bankGuaranteeRequired: boolean;
  // Management & Insurance
  managementFees: number | null;
  nonPaymentInsurance: boolean;
  nonPaymentInsuranceAmount: number | null;
  // Card state
  listingType: string;
  collapsedSections: Record<string, boolean>;
  saveState: SaveState;
  canEdit?: boolean;
  // Callbacks
  onToggleSection: (section: string) => void;
  onSave: () => Promise<void>;
  onUpdateModule: (hasChanges: boolean) => void;
  // Setters
  setSecurityDeposit: (value: number | null) => void;
  setAdditionalGuarantee: (value: number | null) => void;
  setBankGuaranteeRequired: (value: boolean) => void;
  setManagementFees: (value: number | null) => void;
  setNonPaymentInsurance: (value: boolean) => void;
  setNonPaymentInsuranceAmount: (value: number | null) => void;
  getCardStyles: (moduleName: ModuleName) => string;
}
```

### Input Rendering (lines 147-159)

```typescript
<Input
  id="securityDeposit"
  type="number"
  step="0.01"
  min="0"
  placeholder="0"
  value={securityDeposit ?? ""}  // ← Display value or empty string
  onChange={(e) =>
    handleNumericChange(e.target.value, setSecurityDeposit)
  }
  disabled={!canEdit}
  className="h-8"
/>
```

**Key Points:**
- Pure presentational component (receives all data via props)
- Conditional rendering: only shows for rental listings
- Displays `null` values as empty strings

---

## Step 9: User Input Handling

**File:** `src/components/propiedades/form/cards/rental-terms-card.tsx` (lines 86-93)

```typescript
// Helper to handle numeric input changes
const handleNumericChange = (
  value: string,
  setter: (value: number | null) => void,
) => {
  const numValue = value === "" ? null : parseFloat(value);
  setter(numValue);           // ← Updates parent state
  onUpdateModule(true);       // ← Marks module as modified
};
```

**Flow:**
1. User types in input field
2. `onChange` triggers `handleNumericChange`
3. Value is parsed: empty string → `null`, otherwise → `number`
4. Parent state setter is called (e.g., `setSecurityDeposit`)
5. `onUpdateModule(true)` marks the module as having changes

---

## Step 10: Save Module Function

**File:** `src/components/propiedades/form/property-characteristics-form.tsx` (lines 639-660)

```typescript
const saveModule = async (moduleName: ModuleName) => {
  let listingData: Record<string, unknown> = {};
  let propertyData: Record<string, unknown> = {};

  switch (moduleName) {
    // ... other cases ...

    case "rentalTerms":
      // Rental terms go to listings table
      listingData = {
        securityDeposit,
        additionalGuarantee,
        bankGuaranteeRequired,
        managementFees,
        nonPaymentInsurance,
        nonPaymentInsuranceAmount,
      };
      break;
  }

  // Update listing if there's listing data
  if (Object.keys(listingData).length > 0) {
    await updateListingWithAuth(listingId, listingData);
  }

  // Update module state
  setModuleStates((prev) => ({
    ...prev,
    [moduleName]: {
      saveState: "saved",
      hasChanges: false,
      lastSaved: new Date(),
    },
  }));

  toast.success("Cambios guardados correctamente");
};
```

**Key Points:**
- Collects current state values into `listingData` object
- Calls `updateListingWithAuth` to persist changes
- Updates save state for visual feedback
- Shows success toast

---

## Step 11: Server Query - Updating Data

**File:** `src/server/queries/listing.ts`

### Auth Wrapper (lines 90-96)

```typescript
export async function updateListingWithAuth(
  listingId: number,
  data: Parameters<typeof updateListing>[2],
) {
  const accountId = await getCurrentUserAccountId();
  return updateListing(listingId, accountId, data);
}
```

### Main Update Function (lines 374-435)

```typescript
export async function updateListing(
  listingId: number,
  accountId: number,
  data: Omit<Partial<Listing>, "listingId" | "createdAt" | "updatedAt">,
) {
  try {
    // Perform the update
    await db
      .update(listings)
      .set(data)  // ← { securityDeposit, additionalGuarantee, ... }
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
          eq(listings.isActive, true),
        ),
      );

    // Fetch and return updated listing
    const [updatedListing] = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.listingId, BigInt(listingId)),
          eq(listings.accountId, BigInt(accountId)),
        ),
      );

    return updatedListing;
  } catch (error) {
    console.error("Error updating listing:", error);
    throw error;
  }
}
```

**Key Points:**
- Multi-tenant security: verifies `accountId` ownership
- Uses Drizzle ORM's type-safe update
- Returns the updated listing for confirmation

---

## Complete File Inventory

### UI Layer
| File | Purpose | Key Lines |
|------|---------|-----------|
| `src/components/propiedades/form/cards/rental-terms-card.tsx` | Card UI component | 27-53 (props), 86-93 (input handler), 147-159 (input) |
| `src/components/propiedades/form/property-characteristics-form.tsx` | Parent form, state management | 1080-1098 (state), 639-649 (save), 1819-1843 (render) |
| `src/components/propiedades/detail/property-tabs.tsx` | Tab navigation wrapper | 651-652 (passes to form) |

### Page Layer
| File | Purpose | Key Lines |
|------|---------|-----------|
| `src/app/(dashboard)/propiedades/[id]/page.tsx` | Server component page | 80 (fetch), 237 (convert) |

### Type Definitions
| File | Purpose | Key Lines |
|------|---------|-----------|
| `src/types/property-listing.ts` | PropertyListing interface | 205-211 (interface), 421-426 (conversion) |
| `src/types/save-state.ts` | SaveState type | - |

### Server/Database Layer
| File | Purpose | Key Lines |
|------|---------|-----------|
| `src/server/db/schema.ts` | Database schema | 513-519 (rental terms columns) |
| `src/server/queries/listing.ts` | Fetch & update queries | 90-96 (updateWithAuth), 154-166 (getWithAuth), 374-435 (update), 1861-1868 (select fields) |

---

## Adding a New Field Checklist

To add a new rental terms field (e.g., `petDeposit`):

1. **Schema** (`src/server/db/schema.ts`)
   ```typescript
   petDeposit: decimal("pet_deposit", { precision: 10, scale: 2 }),
   ```

2. **Type** (`src/types/property-listing.ts`)
   ```typescript
   // In PropertyListing interface
   petDeposit?: number;

   // In convertDbListingToPropertyListing
   petDeposit: getNumber(dbListing.petDeposit),
   ```

3. **Query SELECT** (`src/server/queries/listing.ts`)
   ```typescript
   // In getListingDetails select
   petDeposit: listings.petDeposit,
   ```

4. **Parent Form State** (`property-characteristics-form.tsx`)
   ```typescript
   const [petDeposit, setPetDeposit] = useState<number | null>(
     listing.petDeposit ?? null,
   );
   ```

5. **Card Props** (`rental-terms-card.tsx`)
   ```typescript
   // In interface
   petDeposit: number | null;
   setPetDeposit: (value: number | null) => void;

   // In JSX - add Input component
   ```

6. **Save Module** (`property-characteristics-form.tsx`)
   ```typescript
   case "rentalTerms":
     listingData = {
       // ... existing fields ...
       petDeposit,
     };
   ```

7. **Field Index** (`src/lib/property-field-index.ts`)
   ```typescript
   {
     label: "Mi Campo",
     keywords: ["campo", "my field", "related terms"],
     sectionKey: "propertyDetails", // or "rentalTerms", "location", etc.
     inputId: "myNewField",
     cardName: "Distribución", // or appropriate card name
   },
   ```

8. **Run Migrations**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

---

## Notes

- **Multi-tenancy**: All queries filter by `accountId` for security
- **Nullish coalescing**: Always use `??` instead of `||` per project guidelines
- **Module-based saving**: Each card saves independently via `saveModule(moduleName)`
- **Visual feedback**: Save states: `idle` → `modified` → `saving` → `saved` → `idle`
