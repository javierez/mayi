# Implementation Plan: Notas, Frase & Places with Google Places API

## Summary
Enhance the memoria day detail page to:
1. Ensure Nota/Frase modals open directly to their respective forms (skip type selector)
2. Add Google Places API integration for selecting places (restaurants, beaches, etc.)
3. Display actual place photos in the Pinterest-like layout

---

## Current State Analysis

### Notas/Frase Modals
- **Already implemented**: Clicking "Nota" or "Frase" buttons passes `initialType` to `AddMemoryModal`
- The modal initializes `selectedType` from `initialType` and skips the type selector
- **Should work as-is** - just need to verify

### Places/Location
- **Current**: Simple text inputs for name and address (lines 313-346 in AddMemoryModal.tsx)
- **Need**: Google Places API to search establishments with photos
- **Existing**: `AddressAutocomplete` component at `src/components/propiedades/form/address-autocomplete.tsx`
- **Google Maps API**: Already configured at `src/lib/google-maps-loader.ts` with Places library

---

## Implementation Steps

### Step 1: Verify Nota/Frase Modal Behavior
**File**: `src/components/memoria/AddMemoryModal.tsx`

- Confirm clicking "Nota" opens directly to note form (skips type selector)
- Confirm clicking "Frase" opens directly to quote form
- The code already supports this via `initialType` prop

### Step 2: Create PlaceAutocomplete Component
**New file**: `src/components/memoria/PlaceAutocomplete.tsx`

Based on existing `AddressAutocomplete`, create a specialized component:
```typescript
// Key differences from AddressAutocomplete:
usePlacesAutocomplete({
  requestOptions: {
    types: ["establishment"],  // Instead of ["address"]
    // No country restriction for vacation memories
  },
});
```

After place selection, fetch photos using `PlacesService.getDetails()`:
```typescript
const service = new google.maps.places.PlacesService(document.createElement('div'));
service.getDetails(
  { placeId: place_id, fields: ['name', 'formatted_address', 'geometry', 'photos'] },
  (result, status) => {
    if (status === 'OK' && result?.photos?.[0]) {
      const photoUrl = result.photos[0].getUrl({ maxWidth: 400 });
      // Store this photoUrl in locationData
    }
  }
);
```

### Step 3: Update AddMemoryModal Location Form
**File**: `src/components/memoria/AddMemoryModal.tsx`

Replace `renderLocationForm()` (lines 313-346):
- Use `PlaceAutocomplete` instead of simple Input
- Store selected place data: `name`, `address`, `lat`, `lng`, `placeId`, `photoUrl`
- Show photo preview when place is selected
- Keep optional caption field

### Step 4: Update LocationData Type
**File**: `src/types/memoria.ts`

Current type (around line 47):
```typescript
export interface LocationData {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  googlePlaceId?: string;
}
```

Add `photoUrl`:
```typescript
export interface LocationData {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  googlePlaceId?: string;
  photoUrl?: string;  // NEW: Store place photo URL
}
```

### Step 5: Update MemoryCard Location Display
**File**: `src/components/memoria/DayDetail.tsx`

Modify `getMemoryPreview()` case for `"location"` (lines 716-725):
```typescript
case "location":
  return memory.locationData?.photoUrl ? (
    // Show actual place photo with name overlay
    <div className="relative h-full w-full">
      <Image src={memory.locationData.photoUrl} alt={memory.locationData.name} fill className="object-cover" />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-2">
        <p className="text-xs font-medium text-white">{memory.locationData.name}</p>
      </div>
    </div>
  ) : (
    // Fallback: current icon-based display
    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-3">
      <MapPinned className="mb-2 h-5 w-5 text-slate-500" />
      <p className="line-clamp-2 text-center text-xs font-medium text-gray-700">
        {memory.locationData?.name}
      </p>
    </div>
  );
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/memoria/AddMemoryModal.tsx` | Replace location form with PlaceAutocomplete |
| `src/components/memoria/DayDetail.tsx` | Update MemoryCard to show place photos |
| `src/types/memoria.ts` | Add `photoUrl` to LocationData interface |
| **New**: `src/components/memoria/PlaceAutocomplete.tsx` | Place search component with photo fetching |

---

## Technical Details

### Google Places API Photo Fetching
Using the JavaScript Places library (already loaded via `@googlemaps/js-api-loader`):

```typescript
// Get place details with photos
const service = new google.maps.places.PlacesService(element);
service.getDetails({
  placeId: selectedPlaceId,
  fields: ['name', 'formatted_address', 'geometry', 'photos']
}, (place, status) => {
  if (status === google.maps.places.PlacesServiceStatus.OK && place?.photos) {
    // PlacePhoto.getUrl() returns a URL for the photo
    const photoUrl = place.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 });
  }
});
```

### API Key
Already configured at `env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and used in `src/lib/google-maps-loader.ts`

### Photo URL Persistence
- `PlacePhoto.getUrl()` returns a time-limited URL that may expire
- **Strategy**: Store the URL at time of selection. If photos become unavailable later, gracefully fallback to icon display
