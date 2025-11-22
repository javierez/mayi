# Database Schema Technical Analysis

## ✅ What's Good

1. **Multi-tenant Architecture**: Consistent `accountId` across all tables
2. **Soft Deletes**: `isActive` flags instead of hard deletes
3. **Activity Logging**: Separate tables for tracking changes
4. **Polymorphic Relationships**: Flexible linking (documents, tasks, appointments)
5. **JSONB Usage**: Flexible metadata storage where appropriate

## ⚠️ Issues Found

### 1. **Data Redundancy Issues**

#### A. Redundant S3 Keys
**Location:** `property_images`, `documents`

```typescript
// property_images has:
imageKey: varchar("image_key", { length: 2048 })  // Redundant
s3key: varchar("s3key", { length: 2048 })         // Redundant

// documents has:
documentKey: varchar("document_key", { length: 2048 })  // Redundant
s3key: varchar("s3key", { length: 2048 })              // Redundant
```

**Issue:** Two fields storing the same S3 key information
**Impact:** Data inconsistency risk, storage waste
**Recommendation:** Keep only `s3key`, remove `imageKey`/`documentKey`

#### B. Redundant Name Fields in Deals
**Location:** `deals` table

```typescript
notaryId: bigint("notary_id", { mode: "bigint" }),      // FK
notaryName: varchar("notary_name", { length: 255 }),    // Redundant if notaryId exists

bankId: bigint("bank_id", { mode: "bigint" }),         // FK
bankName: varchar("bank_name", { length: 255 }),        // Redundant if bankId exists
```

**Issue:** Storing both ID and name creates redundancy
**Impact:** Data inconsistency if name doesn't match ID
**Recommendation:** 
- If `notaryId`/`bankId` is set, derive name from related table
- Keep name field only for cases where ID is NULL (external notary/bank not in system)

#### C. Redundant Account ID in Listings
**Location:** `listings` table

```typescript
listings.accountId  // Redundant?
properties.accountId // Already exists
```

**Issue:** `listings.accountId` duplicates `properties.accountId`
**Impact:** Minor - but could cause inconsistency
**Recommendation:** **KEEP IT** - This is actually good for:
- Query performance (direct filtering without JOIN)
- Data integrity (can have listings without properties in some edge cases)
- Multi-tenant security (faster account filtering)

### 2. **Missing Indexes**

**Critical Missing Indexes:**

```sql
-- Foreign Keys (should be indexed for JOIN performance)
CREATE INDEX idx_listings_property_id ON listings(property_id);
CREATE INDEX idx_listings_account_id ON listings(account_id);
CREATE INDEX idx_listings_agent_id ON listings(agent_id);
CREATE INDEX idx_listing_contacts_listing_id ON listing_contacts(listing_id);
CREATE INDEX idx_listing_contacts_contact_id ON listing_contacts(contact_id);
CREATE INDEX idx_listing_contacts_contact_type ON listing_contacts(contact_type);
CREATE INDEX idx_properties_account_id ON properties(account_id);
CREATE INDEX idx_properties_neighborhood_id ON properties(neighborhood_id);
CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_account_id ON tasks(account_id); -- If tasks had account_id
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_deals_listing_id ON deals(listing_id);

-- Frequently Filtered Columns
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_listing_type ON listings(listing_type);
CREATE INDEX idx_listings_is_active ON listings(is_active);
CREATE INDEX idx_listings_account_status ON listings(account_id, status);
CREATE INDEX idx_listings_account_type ON listings(account_id, listing_type);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_contacts_is_active ON contacts(is_active);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Composite Indexes for Common Queries
CREATE INDEX idx_listing_contacts_listing_type ON listing_contacts(listing_id, contact_type);
CREATE INDEX idx_listing_contacts_contact_type_active ON listing_contacts(contact_id, contact_type, is_active);
```

**Impact:** Slow queries, especially with large datasets

### 3. **Missing Unique Constraints**

```typescript
// Should be unique:
contacts.nif  // NIF should be unique per account (not globally)
properties.referenceNumber  // Should be unique per account
listings.propertyId + listings.listingType  // Prevent duplicate listings of same type
```

**Recommendation:**
```sql
CREATE UNIQUE INDEX idx_contacts_account_nif ON contacts(account_id, nif) WHERE nif IS NOT NULL;
CREATE UNIQUE INDEX idx_properties_account_reference ON properties(account_id, reference_number) WHERE reference_number IS NOT NULL;
CREATE UNIQUE INDEX idx_listings_property_type ON listings(property_id, listing_type) WHERE listing_type IN ('Sale', 'Rent');
```

### 4. **Missing Foreign Key Constraints**

**Issue:** Drizzle schema doesn't show explicit FK constraints
**Impact:** Data integrity issues, orphaned records
**Recommendation:** Ensure FK constraints exist at database level:

```sql
-- Critical FKs that should exist:
ALTER TABLE listings ADD CONSTRAINT fk_listings_property 
  FOREIGN KEY (property_id) REFERENCES properties(property_id);
  
ALTER TABLE listing_contacts ADD CONSTRAINT fk_listing_contacts_listing 
  FOREIGN KEY (listing_id) REFERENCES listings(listing_id);
  
ALTER TABLE listing_contacts ADD CONSTRAINT fk_listing_contacts_contact 
  FOREIGN KEY (contact_id) REFERENCES contacts(contact_id);
```

### 5. **Nullable Foreign Keys Without Clear Purpose**

```typescript
listing_contacts.listingId  // Nullable - why?
```

**Issue:** Junction table with nullable FK breaks relationship integrity
**Impact:** Can have contacts without listings, which might be intentional but unclear
**Recommendation:** 
- If intentional (contacts can exist without listings), document it
- If not, make it NOT NULL
- Consider separate table for "standalone" contacts vs "listing contacts"

### 6. **Portal Flags Normalization**

**Location:** `listings` table

```typescript
fotocasa: boolean("fotocasa")
idealista: boolean("idealista")
habitaclia: boolean("habitaclia")
// ... 6 boolean columns
```

**Issue:** Adding new portals requires schema changes
**Recommendation:** Consider normalization:

```typescript
// Option 1: Keep as-is (simpler queries, acceptable for <10 portals)
// Option 2: Normalize to junction table:
export const listingPortals = pgTable("listing_portals", {
  listingId: bigint("listing_id").notNull(),
  portalName: varchar("portal_name", { length: 50 }).notNull(), // 'fotocasa', 'idealista'
  isPublished: boolean("is_published").default(false),
  portalProps: jsonb("portal_props").default({}),
  PRIMARY KEY (listing_id, portal_name)
});
```

**Current approach is fine** if you have <10 portals and they're stable.

### 7. **Missing Check Constraints**

**Location:** Various enum-like fields

```typescript
listings.listingType  // Should be: 'Sale' | 'Rent' | 'Sold' | 'Transfer' | 'RentWithOption' | 'RoomSharing'
listings.status        // Should match listingType
```

**Issue:** No database-level validation
**Impact:** Invalid data can be inserted
**Recommendation:**
```sql
ALTER TABLE listings ADD CONSTRAINT chk_listing_type 
  CHECK (listing_type IN ('Sale', 'Rent', 'Sold', 'Transfer', 'RentWithOption', 'RoomSharing'));

ALTER TABLE listings ADD CONSTRAINT chk_status_type_match 
  CHECK (
    (listing_type = 'Sale' AND status IN ('En Venta', 'Vendido', 'Descartado', 'Draft')) OR
    (listing_type = 'Rent' AND status IN ('En Alquiler', 'Alquilado', 'Descartado', 'Draft'))
  );
```

### 8. **Inconsistent Data Types**

```typescript
listing_contacts.offer: integer("offer")  // Should be decimal for precision
deals.finalPrice: decimal("final_price", { precision: 12, scale: 2 })  // Correct
```

**Issue:** `offer` is integer, but prices elsewhere use decimal
**Impact:** Loss of precision (can't store €1,234.56)
**Recommendation:** Change to `decimal(12, 2)`

### 9. **Missing Composite Primary Keys**

**Location:** `deal_participants`

```typescript
dealParticipants = pgTable("deal_participants", {
  dealId: bigint("deal_id").notNull(),
  contactId: bigint("contact_id").notNull(),
  role: varchar("role").notNull(),
  // No PK defined!
});
```

**Issue:** No primary key, can have duplicate entries
**Impact:** Data integrity issues
**Recommendation:**
```typescript
export const dealParticipants = pgTable("deal_participants", {
  dealId: bigint("deal_id", { mode: "bigint" }).notNull(),
  contactId: bigint("contact_id", { mode: "bigint" }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.dealId, table.contactId, table.role] })
}));
```

## 📊 Summary of Issues

| Issue | Severity | Impact | Fix Priority |
|-------|----------|--------|--------------|
| Missing Indexes | 🔴 High | Slow queries | **URGENT** |
| Redundant S3 keys | 🟡 Medium | Data inconsistency | High |
| Missing Unique Constraints | 🟡 Medium | Data integrity | High |
| Missing FK Constraints | 🟡 Medium | Orphaned records | High |
| Redundant name fields | 🟢 Low | Minor inconsistency | Medium |
| Missing Check Constraints | 🟢 Low | Invalid data possible | Medium |
| offer data type | 🟡 Medium | Precision loss | Medium |
| deal_participants PK | 🟡 Medium | Duplicate entries | Medium |

## 🎯 Recommended Action Plan

### Phase 1: Critical (Do First)
1. ✅ Add indexes on all foreign keys
2. ✅ Add indexes on frequently filtered columns
3. ✅ Add unique constraints where needed
4. ✅ Verify FK constraints exist at database level

### Phase 2: Important (Do Soon)
5. ✅ Remove redundant S3 key fields
6. ✅ Fix `offer` data type to decimal
7. ✅ Add composite PK to `deal_participants`
8. ✅ Add check constraints for enum fields

### Phase 3: Nice to Have (Do Later)
9. ⚠️ Consider normalizing portal flags (only if adding many portals)
10. ⚠️ Document nullable `listingId` in `listing_contacts`
11. ⚠️ Review redundant name fields in deals (keep for flexibility)

## 💡 Design Decisions That Are Actually Good

1. **`listings.accountId` redundancy**: Keep it! Improves query performance
2. **Portal boolean flags**: Fine for <10 stable portals
3. **JSONB for flexible data**: Good use of JSONB for portal props, metadata
4. **Polymorphic relationships**: Smart design for documents/tasks/appointments
5. **Activity logging tables**: Excellent audit trail pattern

## 🔧 Quick Wins

These can be fixed immediately without breaking changes:

1. Add indexes (no code changes needed)
2. Add unique constraints (may need data cleanup first)
3. Fix `offer` data type (requires migration)
4. Add composite PK to `deal_participants` (requires migration)

