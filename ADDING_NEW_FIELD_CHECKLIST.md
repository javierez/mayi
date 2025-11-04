# Complete Checklist: Adding a New Field to Vesta

This guide walks you through all the steps needed to add a new property field to the Vesta platform, from database to UI to Fotocasa integration.

---

## Prerequisites

Before starting, you need to know:
- **Field name** (e.g., `sauna`, `heatingType`)
- **Field type** (boolean, string, number, etc.)
- **Fotocasa FeatureId** (if this field should be exported to Fotocasa)
- **Property types** it applies to (piso, casa, local, garaje, solar)
- **Which card** it belongs to (features, premiumFeatures, additionalCharacteristics, etc.)

---

## Fixing Existing Fields for Fotocasa

If you have a field that exists in the database but is NOT being exported to Fotocasa correctly, use this checklist:

### Diagnostic Checklist

Go through each step in order. Mark where the problem is:

#### Step 1: Field exists in schema.ts?
**File:** `src/server/db/schema.ts`

- [ ] Field is defined in the `properties` table
- [ ] Field has correct type (boolean, varchar, integer, etc.)

**Example:**
```typescript
fireplace: boolean("fireplace"), // ✅ Exists
dishwasher: boolean("dishwasher"), // ❌ Missing - need to add
```

---

#### Step 2: Field is in getListingDetails() query?
**File:** `src/server/queries/listing.ts`

- [ ] Field is selected in the query (either aliased or raw)

**Example:**
```typescript
// In getListingDetails() function
fireplace: properties.fireplace, // ✅ Queried
// dishwasher is missing ❌
```

---

#### Step 3: Field is NOT aliased OR is in legacy fields?
**File:** `src/server/queries/listing.ts`

If field is aliased (e.g., `heating: properties.heatingType`), the raw field MUST also be in legacy fields.

- [ ] If aliased: Raw field exists in legacy section
- [ ] If not aliased: This check passes automatically

**Example:**
```typescript
// WRONG ❌ - only aliased, missing from legacy
heating: properties.heatingType,

// CORRECT ✅ - both aliased AND in legacy
heating: properties.heatingType,
// ... later in legacy fields ...
heatingType: properties.heatingType, // For Fotocasa FeatureId 320
```

---

#### Step 4: Field is in PropertyListing type?
**File:** `src/types/property-listing.ts`

- [ ] Field is declared in `PropertyListing` interface
- [ ] Field is converted in `convertDbListingToPropertyListing()` function

**Example:**
```typescript
// In PropertyListing interface
export interface PropertyListing {
  // ... other fields ...
  fireplace?: boolean; // ✅ Declared
  sauna?: boolean; // ✅ Declared
}

// In convertDbListingToPropertyListing function
return {
  // ... other fields ...
  fireplace: getBoolean(dbListing.fireplace), // ✅ Converted
  sauna: getBoolean(dbListing.sauna), // ✅ Converted
}
```

**Why this matters:**
If a field is missing from the PropertyListing type or the converter function, it won't be accessible in your React components even if it exists in the database!

---

#### Step 5: Field has mapping in fotocasa.tsx?
**File:** `src/server/portals/fotocasa.tsx`

- [ ] Field is mapped in `buildFotocasaPayload()` function
- [ ] Mapping uses correct field name

**Example:**
```typescript
// Fireplace/Chimenea (FeatureId: 311)
if (listing.fireplace !== null) {
  propertyFeatures.push({
    FeatureId: 311,
    BoolValue: listing.fireplace ?? false,
  });
}
```

---

#### Step 6: Field is in ListingDetails interface?
**File:** `src/server/portals/fotocasa.tsx`

- [ ] Field is declared in the `ListingDetails` interface (if not already in base listing type)

**Example:**
```typescript
interface ListingDetails {
  fireplace?: boolean;
  sauna?: boolean;
  // ... other fields
}
```

---

#### Step 7: Correct FeatureId is used?
**File:** `src/server/portals/fotocasa.tsx`

- [ ] FeatureId matches Fotocasa documentation
- [ ] No typos in the FeatureId number

**Example:**
```typescript
FeatureId: 311, // ✅ Correct for fireplace
FeatureId: 295, // ✅ Correct for dishwasher
```

---

#### Step 8: Correct null check (!== null)?
**File:** `src/server/portals/fotocasa.tsx`

- [ ] Using `!== null` (not `!== undefined`, not truthy check)
- [ ] For boolean fields: checks against `null`, not falsy values

**Example:**
```typescript
// WRONG ❌ - will skip false values
if (listing.fireplace) {
  propertyFeatures.push({ ... });
}

// CORRECT ✅ - checks for null/undefined only
if (listing.fireplace !== null) {
  propertyFeatures.push({
    FeatureId: 311,
    BoolValue: listing.fireplace ?? false,
  });
}
```

---

#### Step 9: Correct value type (BoolValue/DecimalValue/TextValue)?
**File:** `src/server/portals/fotocasa.tsx`

- [ ] Boolean fields use `BoolValue`
- [ ] Number fields use `DecimalValue`
- [ ] Text fields use `TextValue`
- [ ] Nullish coalescing (`??`) used with appropriate default

**Example:**
```typescript
// Boolean
BoolValue: listing.fireplace ?? false, // ✅

// Number
DecimalValue: Number(listing.bedrooms), // ✅

// Text
TextValue: listing.title, // ✅

// WRONG ❌
BoolValue: listing.fireplace || false, // Don't use ||
DecimalValue: listing.bedrooms ? 1 : 0, // Don't convert boolean to number
```

---

### Complete Fix Example: Fireplace

Here's what a complete fix looks like for the `fireplace` field:

```typescript
// 1. ✅ Schema (src/server/db/schema.ts)
fireplace: boolean("fireplace"),

// 2. ✅ Query (src/server/queries/listing.ts)
fireplace: properties.fireplace,

// 3. ✅ Not aliased, so no legacy field needed
// (If it were aliased, we'd need the raw field in legacy section)

// 4. ✅ Fotocasa mapping (src/server/portals/fotocasa.tsx)
// Fireplace/Chimenea (FeatureId: 311)
if (listing.fireplace !== null) {
  propertyFeatures.push({
    FeatureId: 311,
    BoolValue: listing.fireplace ?? false,
  });
}

// 5. ✅ Interface (usually not needed if field is in base type)
// interface ListingDetails {
//   fireplace?: boolean;
// }

// 6. ✅ Correct FeatureId: 311
// 7. ✅ Correct null check: !== null
// 8. ✅ Correct value type: BoolValue with ?? false
```

---

### Files to Check (in order)

When fixing an existing field, check these files in this order:

1. **`src/server/db/schema.ts`** - Database schema definition
2. **`src/server/queries/listing.ts`** - Data fetching (especially `getListingDetails()`)
3. **`src/types/property-listing.ts`** - TypeScript type definitions and converter
4. **`src/server/portals/fotocasa.tsx`** - Fotocasa integration logic

---

### Quick Fixes

**Missing from query:**
```typescript
// Add to getListingDetails() in legacy fields section
yourField: properties.yourField, // For Fotocasa FeatureId XXX
```

**Missing from PropertyListing type:**
```typescript
// Add to PropertyListing interface (src/types/property-listing.ts)
export interface PropertyListing {
  // ... other fields ...
  yourField?: boolean; // or string, number, etc.
}

// Add to convertDbListingToPropertyListing function
return {
  // ... other fields ...
  yourField: getBoolean(dbListing.yourField), // or getNumber/getString
}
```

**Missing from Fotocasa:**
```typescript
// Add to buildFotocasaPayload()
if (listing.yourField !== null) {
  propertyFeatures.push({
    FeatureId: XXX,
    BoolValue: listing.yourField ?? false, // or DecimalValue/TextValue
  });
}
```

**Wrong null check:**
```typescript
// Change from:
if (listing.field) { ... }

// To:
if (listing.field !== null) { ... }
```

**Missing legacy field:**
```typescript
// If field is aliased:
heating: properties.heatingType,

// Add raw field in legacy section:
heatingType: properties.heatingType, // For Fotocasa FeatureId 320
```

---

## Adding New Fields

Use this workflow when adding a brand new field that doesn't exist anywhere yet.

---

## Step 0: Add Field to Database (Manual SQL)

**Important:** In this project, we add fields directly to the database using SQL instead of using `pnpm db:generate` or `pnpm db:push`.

### 0.1 Connect to your database

Use your preferred database client (e.g., TablePlus, DBeaver, psql) to connect to your database.

### 0.2 Run the ALTER TABLE command

Execute the appropriate SQL based on your field type:

**For Boolean fields:**
```sql
ALTER TABLE properties
ADD COLUMN your_field_name BOOLEAN DEFAULT FALSE;
```

**For String/Varchar fields:**
```sql
ALTER TABLE properties
ADD COLUMN your_field_name VARCHAR(50);
```

**For Text fields:**
```sql
ALTER TABLE properties
ADD COLUMN your_field_name TEXT;
```

**For Integer fields:**
```sql
ALTER TABLE properties
ADD COLUMN your_field_name INTEGER;
```

**For Small Integer fields:**
```sql
ALTER TABLE properties
ADD COLUMN your_field_name SMALLINT;
```

**For Decimal fields:**
```sql
ALTER TABLE properties
ADD COLUMN your_field_name DECIMAL(10, 2);
```

**For Timestamp fields:**
```sql
ALTER TABLE properties
ADD COLUMN your_field_name TIMESTAMP;
```

### 0.3 Verify the column was created

```sql
-- Check the column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name = 'your_field_name';

-- Or just select from the table
SELECT your_field_name FROM properties LIMIT 1;
```

### 0.4 Common SQL examples for real fields

**Example: Adding sauna (boolean):**
```sql
ALTER TABLE properties
ADD COLUMN sauna BOOLEAN;
```

**Example: Adding heating_type (varchar):**
```sql
ALTER TABLE properties
ADD COLUMN heating_type VARCHAR(50);
```

**Example: Adding terrace_size (integer):**
```sql
ALTER TABLE properties
ADD COLUMN terrace_size INTEGER;
```

**Example: Adding price (decimal):**
```sql
ALTER TABLE properties
ADD COLUMN price DECIMAL(12, 2);
```

**Note:**
- Use snake_case for database column names (e.g., `heating_type`, not `heatingType`)
- Use camelCase in TypeScript/JavaScript code
- Default values are optional but recommended for booleans (`DEFAULT FALSE`)

---

## Step 1: Database Schema

**File:** `src/server/db/schema.ts`

### 1.1 Add the column to the `properties` table

```typescript
// Find the properties table definition
export const properties = pgTable("properties", {
  // ... existing fields ...

  // Add your new field (use appropriate type)
  yourFieldName: boolean("your_field_name"), // for boolean
  // OR
  yourFieldName: varchar("your_field_name", { length: 50 }), // for string
  // OR
  yourFieldName: integer("your_field_name"), // for integer
  // OR
  yourFieldName: decimal("your_field_name", { precision: 10, scale: 2 }), // for decimal

  // ... rest of fields ...
});
```

**Types to use:**
- `boolean("field_name")` - for true/false
- `varchar("field_name", { length: 50 })` - for short text
- `text("field_name")` - for long text
- `integer("field_name")` - for whole numbers
- `smallint("field_name")` - for small numbers
- `decimal("field_name", { precision: 10, scale: 2 })` - for decimal numbers

**Location:** Place it logically near related fields (e.g., add `sauna` near `jacuzzi`, `fireplace`)

---

## Step 2: Update Drizzle Schema (TypeScript)

After adding the column to the database via SQL (Step 0), update the TypeScript schema to match.

**Important:** This step is about keeping the TypeScript definition in sync with the actual database schema. We already added the field to the database in Step 0.

**Verify:**
- The field name matches exactly what you created in the database (use camelCase in TypeScript, it maps to snake_case in DB)
- The data type matches what you created in the database

---

## Step 3: Query Layer

**File:** `src/server/queries/listing.ts`

### 3.1 Add field to `getListingDetails()` query

Find the function `getListingDetails()` and add your field in the **legacy fields section** (around line 1140+):

```typescript
export async function getListingDetails(listingId: number, accountId: number) {
  try {
    const [listingDetails] = await db
      .select({
        // ... lots of fields ...

        // Legacy fields for backward compatibility
        fireplace: properties.fireplace,
        sauna: properties.sauna, // <-- Add your field here with comment
        gym: properties.gym,
        // ... rest of fields ...
      })
```

**Important:**
- Add a comment like `// For Fotocasa FeatureId XXX` if it's exported to Fotocasa
- Keep alphabetical order within sections for maintainability
- If the field is aliased (e.g., `heating: properties.heatingType`), you MUST also add the raw field in the legacy section

---

## Step 4: TypeScript Types

**File:** `src/types/property-listing.ts`

### 4.1 Add field to PropertyListing interface

Find the PropertyListing interface and add your field in the appropriate section:

```typescript
export interface PropertyListing {
  // ... existing fields ...

  // Luxury features
  jacuzzi?: boolean;
  hydromassage?: boolean;
  garden?: boolean;
  pool?: boolean;
  homeAutomation?: boolean;
  musicSystem?: boolean;

  // Additional spaces
  laundryRoom?: boolean;
  coveredClothesline?: boolean;
  fireplace?: boolean;
  sauna?: boolean; // <-- Add your field here
  gym?: boolean;
  // ... rest of fields ...
}
```

**Important:**
- Add the field in the correct section based on its purpose (luxury features, additional spaces, etc.)
- Use optional properties (`?`) to match the database schema
- Keep the order consistent with how fields appear in the database schema

### 4.2 Add field to convertDbListingToPropertyListing function

Find the `convertDbListingToPropertyListing` function and add your field conversion:

```typescript
export function convertDbListingToPropertyListing(
  dbListing: Record<string, unknown>,
): PropertyListing {
  // Helper functions...

  return {
    // ... existing fields ...
    laundryRoom: getBoolean(dbListing.laundryRoom),
    coveredClothesline: getBoolean(dbListing.coveredClothesline),
    fireplace: getBoolean(dbListing.fireplace),
    sauna: getBoolean(dbListing.sauna), // <-- Add your field here
    gym: getBoolean(dbListing.gym),
    // ... rest of fields ...
  };
}
```

**Important:**
- Use the appropriate helper function:
  - `getBoolean(dbListing.fieldName)` for boolean fields
  - `getNumber(dbListing.fieldName)` for number fields
  - `(dbListing.fieldName as string) ?? undefined` for string fields
- Match the exact field name from the database
- Keep the same order as in the interface definition

**Why this step is critical:**
If you skip this step, your field will not be properly typed in TypeScript, and it won't be accessible when the listing data is loaded from the database. This is a common source of bugs where fields appear to exist in the database but don't show up in the UI!

---

## Step 5: UI Card Component

**File:** One of these depending on which card:
- `src/components/propiedades/form/cards/features-card.tsx`
- `src/components/propiedades/form/cards/premium-features-card.tsx`
- `src/components/propiedades/form/cards/additional-characteristics-card.tsx`
- `src/components/propiedades/form/cards/property-details-card.tsx`
- etc.

### 5.1 Add to interface props

```typescript
interface YourCardProps {
  // ... existing props ...
  yourFieldName: boolean; // or string, number, etc.
  setYourFieldName: (value: boolean) => void; // match the type
  // ... rest of props ...
}
```

### 5.2 Add to component parameters

```typescript
export function YourCard({
  // ... existing destructured props ...
  yourFieldName,
  setYourFieldName,
  // ... rest of props ...
}: YourCardProps) {
```

### 5.3 Add UI element (checkbox, input, select, etc.)

**For Boolean (checkbox):**
```typescript
<div className="flex items-center space-x-2">
  <Checkbox
    id="yourFieldName"
    checked={yourFieldName}
    onCheckedChange={(checked) => {
      setYourFieldName(checked as boolean);
      onUpdateModule(true);
    }}
    disabled={!canEdit}
  />
  <Label htmlFor="yourFieldName" className="text-sm">
    Your Label in Spanish
  </Label>
</div>
```

**For String (dropdown/select):**
```typescript
<Select
  value={yourFieldName}
  onValueChange={(value) => {
    setYourFieldName(value);
    onUpdateModule(true);
  }}
  disabled={!canEdit}
>
  <SelectTrigger className="h-7 text-xs">
    <SelectValue placeholder="Seleccionar" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**For Number (input):**
```typescript
<Input
  id="yourFieldName"
  type="number"
  value={yourFieldName}
  onChange={(e) => {
    const value = parseInt(e.target.value) || 0;
    setYourFieldName(value);
    onUpdateModule(true);
  }}
  className="h-7 text-xs"
  min="0"
  disabled={!canEdit}
/>
```

---

## Step 6: Parent Form Component

**File:** `src/components/propiedades/form/property-characteristics-form.tsx`

### 6.1 Add state variable

Find where states are declared (around line 700-800) and add:

```typescript
const [yourFieldName, setYourFieldName] = useState(listing.yourFieldName ?? defaultValue);
```

**Default values:**
- Boolean: `false`
- String: `""`
- Number: `0`
- Select with options: `""` or first option value

### 6.2 Pass props to card component

Find where the card is rendered (search for `<YourCard`) and add the props:

```typescript
<YourCard
  // ... existing props ...
  yourFieldName={yourFieldName}
  setYourFieldName={setYourFieldName}
  // ... rest of props ...
/>
```

### 6.3 Add to save function

Find the `saveModule` function and the appropriate `case` statement for your card:

```typescript
case "premiumFeatures": // or "features", "additionalCharacteristics", etc.
  propertyData = {
    // ... existing fields ...
    yourFieldName,
    // ... rest of fields ...
  };
  break;
```

**Important:** The case name matches the card's module name, e.g.:
- `"features"` → FeaturesCard
- `"premiumFeatures"` → PremiumFeaturesCard
- `"additionalCharacteristics"` → AdditionalCharacteristicsCard
- `"propertyDetails"` → PropertyDetailsCard

---

## Step 7: Fotocasa Integration (Optional)

**File:** `src/server/portals/fotocasa.tsx`

Only do this step if the field should be exported to Fotocasa.

### 7.1 Add to ListingDetails interface (if needed)

```typescript
interface ListingDetails {
  // ... existing fields ...
  yourFieldName?: boolean; // or string, number, etc.
  // ... rest of fields ...
}
```

### 7.2 Add field mapping in `buildFotocasaPayload()`

Find the section where PropertyFeatures are built (around line 470-900) and add:

**For Boolean fields:**
```typescript
// Your Field Label (FeatureId: XXX)
if (listing.yourFieldName !== null) {
  propertyFeatures.push({
    FeatureId: XXX, // Replace with actual Fotocasa FeatureId
    BoolValue: listing.yourFieldName ?? false,
  });
}
```

**For Decimal/Number fields:**
```typescript
// Your Field Label (FeatureId: XXX)
if (listing.yourFieldName !== null) {
  propertyFeatures.push({
    FeatureId: XXX, // Replace with actual Fotocasa FeatureId
    DecimalValue: Number(listing.yourFieldName),
  });
}
```

**For Text fields:**
```typescript
// Your Field Label (FeatureId: XXX)
if (listing.yourFieldName) {
  propertyFeatures.push({
    FeatureId: XXX, // Replace with actual Fotocasa FeatureId
    TextValue: listing.yourFieldName,
  });
}
```

**For Mapped/Enum fields (like heatingType):**
```typescript
// Your Field Label (FeatureId: XXX)
const yourFieldMapping: Record<string, number> = {
  "option1": 1,
  "option2": 2,
  "option3": 3,
};

if (listing.yourFieldName) {
  let mappedId: number | undefined;

  // Try parsing as number first (if stored as ID)
  if (!isNaN(Number(listing.yourFieldName))) {
    mappedId = Number(listing.yourFieldName);
  } else {
    // Map string to ID
    const key = String(listing.yourFieldName).toLowerCase();
    mappedId = yourFieldMapping[key];
  }

  // Only add if valid
  if (mappedId && mappedId >= 1 && mappedId <= 10) { // Adjust range
    propertyFeatures.push({
      FeatureId: XXX,
      DecimalValue: mappedId,
    });
  }
}
```

**Location guidelines:**
- Boolean amenities: Add near similar features (line 520-780)
- Conservation/condition fields: Around line 905-928
- Energy fields: Around line 930-974
- Heating/utilities: Around line 976-1027

---

## Step 8: Testing Checklist

### 8.1 Database
- [ ] Column exists in properties table
- [ ] Column has correct type
- [ ] Default value is appropriate (if set)

### 8.2 UI
- [ ] Field appears in correct card
- [ ] Field is editable (not disabled)
- [ ] Field has correct label in Spanish
- [ ] Field respects property type restrictions (if applicable)
- [ ] Field updates local state on change
- [ ] Save indicator shows "modified" when changed

### 8.3 Data Flow
- [ ] Field value loads from database correctly
- [ ] Field value saves to database correctly
- [ ] Field value persists after page refresh
- [ ] Multiple properties can have different values

### 8.4 Fotocasa (if applicable)
- [ ] Field is included in payload build
- [ ] Field maps to correct FeatureId
- [ ] Field uses correct value type (BoolValue/DecimalValue/TextValue)
- [ ] Field handles null/undefined correctly
- [ ] Field appears in Fotocasa logs (check fotocasa_logs table)

---

## Complete Example: Adding "Sauna" Field

Here's a complete example showing all files that need to be modified:

### 0. Database (Manual SQL)
```sql
-- Add column directly to database
ALTER TABLE properties
ADD COLUMN sauna BOOLEAN;

-- Verify it was created
SELECT sauna FROM properties LIMIT 1;
```

### 1. Database Schema (TypeScript)
```typescript
// src/server/db/schema.ts (line 319)
fireplace: boolean("fireplace"),
sauna: boolean("sauna"), // ✅ Added
```

### 2. Query
```typescript
// src/server/queries/listing.ts (line 1215)
fireplace: properties.fireplace,
sauna: properties.sauna, // For Fotocasa FeatureId 277 // ✅ Added
gym: properties.gym,
```

### 3. TypeScript Types
```typescript
// src/types/property-listing.ts

// In PropertyListing interface (line 133)
export interface PropertyListing {
  // ... other fields ...
  laundryRoom?: boolean;
  coveredClothesline?: boolean;
  fireplace?: boolean;
  sauna?: boolean; // ✅ Added
  gym?: boolean;
}

// In convertDbListingToPropertyListing function (line 288)
return {
  // ... other fields ...
  laundryRoom: getBoolean(dbListing.laundryRoom),
  coveredClothesline: getBoolean(dbListing.coveredClothesline),
  fireplace: getBoolean(dbListing.fireplace),
  sauna: getBoolean(dbListing.sauna), // ✅ Added
  gym: getBoolean(dbListing.gym),
}
```

### 4. Card Component
```typescript
// src/components/propiedades/form/cards/premium-features-card.tsx

// Props (line 27)
fireplace: boolean;
sauna: boolean; // ✅ Added
gym: boolean;

// Setter (line 55)
setFireplace: (value: boolean) => void;
setSauna: (value: boolean) => void; // ✅ Added
setGym: (value: boolean) => void;

// Destructured params (line 82)
fireplace,
sauna, // ✅ Added
gym,

// Destructured setters (line 110)
setFireplace,
setSauna, // ✅ Added
setGym,

// UI (lines 295-308)
<div className="flex items-center space-x-2">
  <Checkbox
    id="sauna"
    checked={sauna}
    onCheckedChange={(checked) => {
      setSauna(checked as boolean);
      onUpdateModule(true);
    }}
    disabled={!canEdit}
  />
  <Label htmlFor="sauna" className="text-sm">
    Sauna
  </Label>
</div>
```

### 5. Parent Form
```typescript
// src/components/propiedades/form/property-characteristics-form.tsx

// State (line 796)
const [sauna, setSauna] = useState(listing.sauna ?? false); // ✅ Added

// Pass to card (line 1673)
sauna={sauna} // ✅ Added
setSauna={setSauna} // ✅ Added (line 1703)

// Save function (line 504)
case "premiumFeatures":
  propertyData = {
    // ... other fields ...
    fireplace,
    sauna, // ✅ Added
    gym,
    // ... other fields ...
  };
```

### 6. Fotocasa Integration
```typescript
// src/server/portals/fotocasa.tsx (lines 821-830)

// Sauna (FeatureId: 277)
if (
  "sauna" in listing &&
  typeof (listing as Record<string, unknown>).sauna === "boolean"
) {
  propertyFeatures.push({
    FeatureId: 277,
    BoolValue: (listing as Record<string, unknown>).sauna as boolean,
  });
}
```

---

## Common Pitfalls

### ❌ Mistake 1: Forgetting Legacy Fields
**Problem:** Field is queried with an alias but not in legacy fields
```typescript
// ❌ Wrong - only aliased
heating: properties.heatingType, // Form uses heating, DB has heatingType

// ✅ Correct - both aliased AND in legacy
heating: properties.heatingType,
// ... later in legacy fields section ...
heatingType: properties.heatingType, // For Fotocasa FeatureId 320
```

### ❌ Mistake 2: Wrong Null Check
**Problem:** Using `listing.field` instead of `listing.field !== null`
```typescript
// ❌ Wrong - will skip false values
if (listing.yourBoolean) {
  propertyFeatures.push({ ... });
}

// ✅ Correct - checks for null/undefined only
if (listing.yourBoolean !== null) {
  propertyFeatures.push({
    FeatureId: XXX,
    BoolValue: listing.yourBoolean ?? false,
  });
}
```

### ❌ Mistake 3: Wrong Value Type in Fotocasa
```typescript
// ❌ Wrong - using DecimalValue for boolean
propertyFeatures.push({
  FeatureId: 277,
  DecimalValue: listing.sauna ? 1 : 0, // ❌
});

// ✅ Correct - using BoolValue
propertyFeatures.push({
  FeatureId: 277,
  BoolValue: listing.sauna ?? false, // ✅
});
```

### ❌ Mistake 4: Not Using Nullish Coalescing
```typescript
// ❌ Wrong - using || (logical OR)
const [field, setField] = useState(listing.field || defaultValue);

// ✅ Correct - using ?? (nullish coalescing)
const [field, setField] = useState(listing.field ?? defaultValue);
```

### ❌ Mistake 5: Forgetting onUpdateModule
```typescript
// ❌ Wrong - doesn't trigger save indicator
onCheckedChange={(checked) => {
  setYourField(checked as boolean);
}}

// ✅ Correct - triggers save indicator
onCheckedChange={(checked) => {
  setYourField(checked as boolean);
  onUpdateModule(true);
}}
```

---

## Fotocasa FeatureId Reference

Common FeatureIds you might need:

| Feature | FeatureId | Type | Description |
|---------|-----------|------|-------------|
| Surface | 1 | Decimal | Property surface area |
| Title | 2 | Text | Property title |
| Description | 3 | Text | Property description |
| Bedrooms | 11 | Decimal | Number of bedrooms |
| Bathrooms | 12 | Decimal | Number of bathrooms |
| Elevator | 22 | Boolean | Has elevator |
| Parking | 23 | Boolean | Has parking/garage |
| Storage Room | 24 | Boolean | Has storage room |
| Private Pool | 25 | Boolean | Has private pool |
| Terrace | 27 | Boolean | Has terrace |
| Orientation | 28 | Decimal | Property orientation (1-8) |
| Heating | 29 | Boolean | Has heating |
| Furnished | 30 | Boolean | Is furnished |
| Terrace Size | 62 | Decimal | Terrace surface (m²) |
| Land Area | 69 | Decimal | Land area for plots (m²) |
| Home Automation | 142 | Boolean | Has smart home |
| Public Transport | 176 | Boolean | Near public transport |
| Year Built | 231 | Boolean | Construction year |
| Alarm | 235 | Boolean | Has alarm |
| Conservation | 249 | Decimal | Conservation status (1-6) |
| Air Conditioning | 254 | Boolean | Has AC |
| Laundry Room | 257 | Boolean | Has laundry room |
| Built-in Wardrobes | 258 | Boolean | Has built-in wardrobes |
| Appliances | 259 | Boolean | Appliances included |
| Suite Bathroom | 260 | Boolean | Has suite bathroom |
| Jacuzzi | 274 | Boolean | Has jacuzzi |
| Sauna | 277 | Boolean | Has sauna |
| Internet | 286 | Boolean | Has internet |
| Microwave | 287 | Boolean | Has microwave |
| Oven | 288 | Boolean | Has oven |
| Parquet | 290 | Boolean | Has parquet flooring |
| TV | 291 | Boolean | Has TV |
| Fridge | 292 | Boolean | Has fridge |
| Washing Machine | 293 | Boolean | Has washing machine |
| Security Door | 294 | Boolean | Has security door |
| Dishwasher | 295 | Boolean | Has dishwasher |
| Balcony | 297 | Boolean | Has balcony |
| Garden | 298 | Boolean | Has private garden |
| Community Pool | 300 | Boolean | Has community pool |
| Sports Area | 302 | Boolean | Has sports facilities |
| Children Area | 303 | Boolean | Has children's area |
| Gym | 309 | Boolean | Has gym |
| Tennis Court | 310 | Boolean | Has tennis court |
| Fireplace | 311 | Boolean | Has fireplace |
| Pets Allowed | 313 | Boolean | Pets allowed |
| Equipped Kitchen | 314 | Boolean | Kitchen equipped |
| Heating Type | 320 | Decimal | Type of heating (1-6) |
| Hot Water | 321 | Decimal | Hot water type (1-6) |
| Energy Consumption | 323 | Decimal | Energy consumption scale (1-7) |
| Emissions | 324 | Decimal | Emissions scale (1-7) |
| Energy Value | 325 | Decimal | Energy consumption value |
| Emissions Value | 326 | Decimal | Emissions value |
| Certificate Status | 327 | Decimal | Energy certificate status (1-3) |

**Heating/Hot Water Types (320/321):**
1. Gas natural
2. Eléctrico
3. Gasóleo
4. Butano
5. Propano
6. Solar

**Conservation Status (249):**
1. Bueno (Good)
2. Muy bueno (Pretty good)
3. Como nuevo (Almost new)
4. A reformar (Needs renovation)
6. Reformado (Renovated)

---

## Quick Reference Commands

```bash
# Generate and apply database migrations
pnpm db:generate
pnpm db:push

# Open database studio
pnpm db:studio

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Check specific file types
pnpm typecheck | grep "your-file-name"

# Test the application
pnpm dev
```

---

## Verification Script

Use this checklist to verify your implementation:

```markdown
## Field: [YOUR_FIELD_NAME]

### Database ✅
- [ ] Column exists in `properties` table (via manual SQL)
- [ ] Column has correct data type
- [ ] Column was verified with SELECT query

### Database Schema (TypeScript) ✅
- [ ] Field added to `properties` table in `schema.ts`
- [ ] Field type matches database column type

### Query Layer ✅
- [ ] Field is in `getListingDetails()` query
- [ ] Field is in legacy fields section (if used in Fotocasa)
- [ ] Field has comment with FeatureId (if applicable)

### TypeScript Types ✅
- [ ] Field added to `PropertyListing` interface
- [ ] Field added to `convertDbListingToPropertyListing()` function
- [ ] Correct helper function used (getBoolean/getNumber/getString)

### UI Card Component ✅
- [ ] Field added to interface props
- [ ] Field added to component parameters
- [ ] Setter function added to interface
- [ ] Setter function added to parameters
- [ ] UI element added (checkbox/input/select)
- [ ] `onUpdateModule(true)` called on change

### Parent Form Component ✅
- [ ] State variable declared
- [ ] Default value is appropriate
- [ ] Props passed to card component
- [ ] Setter passed to card component
- [ ] Field added to `propertyData` in save function

### Fotocasa Integration ✅
- [ ] Field added to `ListingDetails` interface (if needed)
- [ ] Field mapped in `buildFotocasaPayload()`
- [ ] Correct FeatureId used
- [ ] Correct value type (BoolValue/DecimalValue/TextValue)
- [ ] Null check is correct (`!== null`, not truthy)
- [ ] Nullish coalescing used (`??`, not `||`)

### Testing ✅
- [ ] Field loads correctly from database
- [ ] Field saves correctly to database
- [ ] Field appears in UI
- [ ] Field can be edited
- [ ] Save indicator works
- [ ] Fotocasa payload includes field (if applicable)
- [ ] Value persists after refresh
```

---

## Support

If you encounter issues:
1. Check the console for TypeScript errors
2. Verify database column exists
3. Check network tab for API calls
4. Review `fotocasa_logs` table for Fotocasa integration
5. Check server logs for detailed error messages

---

## Document Version
- **Version:** 1.0
- **Last Updated:** 2025-01-04
- **Based on:** Vesta Codebase (Next.js 15 + Drizzle ORM)
