# Ownership Transfer Logic

## Overview

This document describes how ownership transfers work when accepting or revoking offers in the Vesta real estate management system.

**Key Principle:** Ownership changes hands **immediately when an offer is accepted**, not when the listing status changes to "Vendido" or "Alquilado".

## Database Schema

### `listing_contacts` Table

The junction table that manages relationships between listings and contacts:

```sql
listing_contacts:
├─ listing_contact_id (PK)
├─ listing_id (FK → listings)
├─ contact_id (FK → contacts)
├─ contact_type: "buyer" | "owner" | "viewer" | "ex-owner"
├─ offer: integer (offer amount)
├─ offer_accepted: boolean | null (true=accepted, false=rejected, null=pending)
├─ is_active: boolean (false = archived)
└─ updated_at: timestamp
```

## Accepting an Offer

### Location
**File:** `src/server/actions/listing-contacts.ts`
**Function:** `updateOfferStatusAction(listingContactId, true, ...)`

### What Happens

When a user clicks **"Aceptar"** (Accept) on an offer:

1. **Update Offer Status**
   ```sql
   UPDATE listing_contacts
   SET offer_accepted = true,
       updated_at = NOW()
   WHERE listing_contact_id = ?
   ```

2. **Create/Update Deal**
   ```sql
   -- If deal exists:
   UPDATE deals
   SET status = 'Arras Pending',
       updated_at = NOW()
   WHERE listing_contact_id = ?

   -- If deal doesn't exist:
   INSERT INTO deals (listing_id, listing_contact_id, status)
   VALUES (?, ?, 'Arras Pending')
   ```

3. **Promote Buyer to Owner**
   ```sql
   UPDATE listing_contacts
   SET contact_type = 'owner',
       updated_at = NOW()
   WHERE listing_contact_id = ?
   ```

4. **Archive Previous Owner(s) as Ex-Owner(s)**
   ```sql
   UPDATE listing_contacts
   SET contact_type = 'ex-owner',
       updated_at = NOW()
   WHERE listing_id = ?
     AND contact_type = 'owner'
     AND is_active = true
   ```

5. **Archive Losing Buyers**
   ```sql
   UPDATE listing_contacts
   SET is_active = false,
       updated_at = NOW()
   WHERE listing_id = ?
     AND contact_type = 'buyer'
     AND is_active = true
     AND listing_contact_id != ? -- Exclude the winning buyer
   ```

### Database Operations Count
- **2 reads** (verify listing contact, check existing deal)
- **5 writes** (update offer status, create/update deal, promote buyer, archive owner, archive buyers)
- **Total: 7 operations** in a single transaction

---

## Revoking a Decision

### Location
**File:** `src/server/actions/listing-contacts.ts`
**Function:** `updateOfferStatusAction(listingContactId, null, ...)`

### What Happens

When a user clicks **"Revocar Decisión"** (Revoke):

1. **Reset Offer Status**
   ```sql
   UPDATE listing_contacts
   SET offer_accepted = null,
       updated_at = NOW()
   WHERE listing_contact_id = ?
   ```

2. **Delete Associated Deal**
   ```sql
   DELETE FROM deals
   WHERE listing_contact_id = ?
   ```

3. **Demote Owner Back to Buyer**
   ```sql
   UPDATE listing_contacts
   SET contact_type = 'buyer',
       updated_at = NOW()
   WHERE listing_contact_id = ?
   ```

4. **Restore Ex-Owner(s) to Owner(s)**
   ```sql
   UPDATE listing_contacts
   SET contact_type = 'owner',
       updated_at = NOW()
   WHERE listing_id = ?
     AND contact_type = 'ex-owner'
   ```

5. **Reactivate Archived Buyers**
   ```sql
   UPDATE listing_contacts
   SET is_active = true,
       updated_at = NOW()
   WHERE listing_id = ?
     AND contact_type = 'buyer'
     AND is_active = false
   ```

### Database Operations Count
- **1 read** (verify listing contact)
- **5 writes** (reset offer status, delete deal, demote owner, restore owners, reactivate buyers)
- **Total: 6 operations** in a single transaction

---

## Example Flow

### Initial State
```
Listing ID: 123

listing_contacts:
┌─────────────┬──────────────┬─────────┬──────────────┬─────────┐
│ contact_id  │ contactType  │ offer   │ offerAccepted│ isActive│
├─────────────┼──────────────┼─────────┼──────────────┼─────────┤
│ 1 (Carlos)  │ owner        │ NULL    │ NULL         │ true    │
│ 2 (Ana)     │ owner        │ NULL    │ NULL         │ true    │ Co-owner
│ 3 (Juan)    │ buyer        │ 150000  │ NULL         │ true    │
│ 4 (María)   │ buyer        │ 155000  │ NULL         │ true    │
│ 5 (Pedro)   │ buyer        │ 148000  │ NULL         │ true    │
└─────────────┴──────────────┴─────────┴──────────────┴─────────┘

deals: (empty)
```

### After Accepting María's Offer
```
listing_contacts:
┌─────────────┬──────────────┬─────────┬──────────────┬─────────┐
│ contact_id  │ contactType  │ offer   │ offerAccepted│ isActive│
├─────────────┼──────────────┼─────────┼──────────────┼─────────┤
│ 1 (Carlos)  │ ex-owner     │ NULL    │ NULL         │ true    │ ✓ Changed
│ 2 (Ana)     │ ex-owner     │ NULL    │ NULL         │ true    │ ✓ Changed
│ 3 (Juan)    │ buyer        │ 150000  │ NULL         │ false   │ ✓ Archived
│ 4 (María)   │ owner        │ 155000  │ true         │ true    │ ✓ NEW OWNER
│ 5 (Pedro)   │ buyer        │ 148000  │ NULL         │ false   │ ✓ Archived
└─────────────┴──────────────┴─────────┴──────────────┴─────────┘

deals:
┌─────────┬────────────┬──────────────────┬────────────────┐
│ deal_id │ listing_id │ listing_contact_id│ status         │
├─────────┼────────────┼──────────────────┼────────────────┤
│ 1       │ 123        │ 4 (María)        │ Arras Pending  │ ✓ Created
└─────────┴────────────┴──────────────────┴────────────────┘
```

### After Revoking Decision
```
listing_contacts:
┌─────────────┬──────────────┬─────────┬──────────────┬─────────┐
│ contact_id  │ contactType  │ offer   │ offerAccepted│ isActive│
├─────────────┼──────────────┼─────────┼──────────────┼─────────┤
│ 1 (Carlos)  │ owner        │ NULL    │ NULL         │ true    │ ✓ Restored
│ 2 (Ana)     │ owner        │ NULL    │ NULL         │ true    │ ✓ Restored
│ 3 (Juan)    │ buyer        │ 150000  │ NULL         │ true    │ ✓ Reactivated
│ 4 (María)   │ buyer        │ 155000  │ NULL         │ true    │ ✓ Back to buyer
│ 5 (Pedro)   │ buyer        │ 148000  │ NULL         │ true    │ ✓ Reactivated
└─────────────┴──────────────┴─────────┴──────────────┴─────────┘

deals: (empty) ✓ Deal deleted
```

---

## Multiple Owners Support

The system **fully supports co-ownership scenarios**:

### Common Co-Ownership Scenarios
1. **Married Couples** - Both spouses as owners
2. **Business Partners** - Multiple partners owning commercial property
3. **Inheritance** - Multiple heirs owning inherited property
4. **Family Ownership** - Parents and children co-owning

### How It Works
When an offer is accepted:
- **ALL current owners** with `contactType = "owner"` become `"ex-owner"`
- **The winning buyer** becomes the sole new `"owner"`
- **All ex-owners remain visible** (`isActive = true`) for historical reference

When revoked:
- **ALL ex-owners** revert back to `"owner"`
- **The buyer** reverts back to `"buyer"`

---

## Transaction Safety

All operations are wrapped in a **database transaction** to ensure:

✅ **Atomicity** - Either ALL operations succeed or ALL are rolled back
✅ **Consistency** - No partial updates if something fails
✅ **Isolation** - Other transactions don't see intermediate states
✅ **Reversibility** - Revoking perfectly restores the previous state

```typescript
const result = await db.transaction(async (tx) => {
  // All 5-7 operations here
  // If any fails, entire transaction rolls back
});
```

---

## UI Integration

### Where Offers Are Accepted
**File:** `src/components/contactos/contact-detail-sheet.tsx`
**Lines:** 937-972

The "Aceptar" / "Rechazar" buttons appear when:
- Contact has `badgeType === "offer"` (pending offer)
- User has `permissions.canEditContacts === true`

### Where Decisions Are Revoked
**From "Offer Accepted" state (lines 654-675):**
- Shows "Revocar Decisión" button
- Requires confirmation dialog

**From "Offer Rejected" state (lines 696-717):**
- Shows "Revocar Decisión" button
- Requires confirmation dialog

---

## Benefits of This Approach

✅ **Immediate ownership transfer** when deal is agreed
✅ **Fully reversible** - revoking restores everything
✅ **Supports multiple buyers** competing with offers
✅ **Supports multiple owners** (co-ownership)
✅ **Atomic operations** - all changes in one transaction
✅ **Clear business logic** - offer acceptance = ownership change
✅ **Listing status is independent** of ownership changes
✅ **Complete audit trail** - ex-owners remain visible in history

---

## Implementation Checklist

- [ ] Update schema comment for `contactType` to include `"ex-owner"`
- [ ] Implement ownership transfer in `updateOfferStatusAction` (accept)
- [ ] Implement ownership restoration in `updateOfferStatusAction` (revoke)
- [ ] Test with single owner → single buyer
- [ ] Test with multiple owners → single buyer
- [ ] Test with single owner → multiple buyers (one wins)
- [ ] Test with multiple owners → multiple buyers (one wins)
- [ ] Test revoke functionality restores all states
- [ ] Verify transaction rollback on errors
- [ ] Update UI to display ex-owners in contact lists
- [ ] Add activity logging for ownership changes

---

## Future Enhancements

1. **Activity Logging** - Log ownership transfer events to `listing_contact_activity`
2. **Notifications** - Notify new owner when they become owner
3. **Co-buyer Support** - Allow multiple winning buyers (joint purchase)
4. **Partial Ownership** - Track ownership percentages
5. **Ownership History Timeline** - Visual timeline of ownership changes
6. **Manual Owner Selection** - UI to manually override winning buyer selection
