# Idealista Missing Fields Documentation

**Last Updated:** 2024 - Verified against v6.00 schemas
**Schema Source:** `idealista/*.json` files

This document tracks all missing Idealista fields by property type. Cross-referenced against the official Idealista JSON schemas and current Vesta implementation in `src/server/portals/idealista.tsx`.

---

## Table of Contents

1. [Garage](#garage)
2. [Offices](#offices)
3. [Land](#land)
4. [Building](#building)
5. [Room Rental](#room-rental)
6. [Storage](#storage)
7. [Homes (Housing)](#homes-housing) ⚠️ NEW
8. [Premises (Commercial)](#premises-commercial) ⚠️ NEW
9. [Common Italy-Only Fields](#common-italy-only-fields)
10. [Implementation Priority](#implementation-priority)

---

## Garage

**Schema:** `garage.json`
**Required:** `featuresType`, `featuresAreaConstructed`

### Currently Implemented ✅

| Idealista Field | Vesta Field | Status |
|-----------------|-------------|--------|
| `featuresType: "garage"` | propertyType mapping | ✅ Working |
| `featuresAreaConstructed` | squareMeter | ✅ Working |
| `featuresLiftAvailable` | hasElevator | ✅ Working |

### Missing Optional Fields (Spain)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresGarageCapacityType` | enum | unknown / car_compact / car_sedan / motorcycle / car_and_motorcycle / two_cars_and_more | garageCapacityType |
| `featuresParkingAutomaticDoor` | boolean | Has automatic door | parkingAutomaticDoor |
| `featuresParkingPlaceCovered` | boolean | Is covered parking | parkingCovered |
| `featuresSecurityAlarm` | boolean | Has security alarm | securityAlarm |
| `featuresSecurityPersonnel` | boolean | Has security personnel | securityPersonnel |
| `featuresSecuritySystem` | boolean | Has security system | securitySystem |
| `featuresCurrentOccupation` | enum | free / tenanted / bare_ownership / illegally_occupied | occupationStatus (exists but not mapped for garage) |

### Missing Optional Fields (Portugal/Italy only)

| Field | Type | Description |
|-------|------|-------------|
| `featuresParkingType` | enum | unknown / depot / parking_space |

**Total Spain: 7 fields missing (6 new DB fields + 1 mapping)**

---

## Offices

**Schema:** `offices.json`
**Required:** `featuresType`, `featuresAreaConstructed`

### Currently Implemented ✅

| Idealista Field | Vesta Field | Status |
|-----------------|-------------|--------|
| `featuresType: "office"` | propertyType mapping | ✅ Working |
| `featuresAreaConstructed` | squareMeter | ✅ Working |
| `featuresAreaUsable` | usableArea | ✅ Working |
| `featuresBathroomNumber` | bathrooms | ✅ Working |
| `featuresBuiltYear` | yearBuilt | ✅ Working |
| `featuresConditionedAir` | airConditioningType | ✅ Working |
| `featuresConservation` | conservationStatus | ✅ Working |
| Energy certificate fields | Various | ✅ Working |

### Office-Specific Fields (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresOfficeBuilding` | boolean | Is it in an office building | officeBuilding |
| `featuresRoomsSplitted` | enum | unknown / openPlan / withScreens / withWalls | roomsSplitted |
| `featuresSuspendedCeiling` | boolean | False/suspended ceiling | suspendedCeiling |
| `featuresSuspendedFloor` | boolean | Raised floor (for cabling) | suspendedFloor |
| `featuresLiftNumber` | integer 0-9 | Number of lifts (not just boolean) | liftNumber |
| `featuresParkingSpacesNumber` | integer 1-99 | Number of parking spots | parkingSpacesNumber |
| `featuresFloorsBuilding` | integer 1-99 | Total floors in building | buildingFloors (exists, not mapped) |
| `featuresFloorsProperty` | integer 1-99 | Floors within the office | floorsProperty |
| `featuresStorage` | boolean | Storage room available | hasStorageRoom (exists, not mapped for office) |

### Bathroom Fields (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresBathroomInside` | boolean | Bathroom inside the office | bathroomInside |
| `featuresBathroomType` | enum | toilets / fullEquiped / both | bathroomType |

### Climate Fields (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresConditionedAirType` | enum | notAvailable / cold / cold/heat / preInstallation | airConditioningType (needs enum mapping) |
| `featuresHeating` | boolean | Has heating | heating (have heatingType but not boolean) |
| `featuresHotWater` | boolean | Hot water available | hotWater |
| `featuresWindowsDouble` | boolean | Double-pane windows | windowsDouble |

### Building/Access Fields (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresAccessControl` | boolean | Access control system | accessControl |
| `featuresBuildingAdapted` | boolean | Accessible for disabled | buildingAdapted |
| `featuresDoorman` | boolean | Doorman/concierge | doorman (exists, not mapped for office) |

### Security Fields (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresSecurityAlarm` | boolean | Alarm system | securityAlarm |
| `featuresSecurityDoor` | boolean | Security door | securityDoor |
| `featuresSecuritySystem` | boolean | Security system | securitySystem |

### Fire Safety Fields (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresEmergencyExit` | boolean | Emergency exit | emergencyExit |
| `featuresEmergencyLights` | boolean | Emergency lighting | emergencyLights |
| `featuresFireDetectors` | boolean | Fire detectors | fireDetectors |
| `featuresFireDoors` | boolean | Fire doors | fireDoors |
| `featuresExtinguishers` | boolean | Extinguishers | extinguishers |
| `featuresSprinklers` | boolean | Sprinkler system | sprinklers |

### Windows & Orientation (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresWindowsLocation` | enum | interior / exterior | windowsLocation (exists, not mapped for office) |
| `featuresOrientationNorth` | boolean | North facing | orientation (exists, not mapped for office) |
| `featuresOrientationSouth` | boolean | South facing | orientation |
| `featuresOrientationEast` | boolean | East facing | orientation |
| `featuresOrientationWest` | boolean | West facing | orientation |

### Energy Certificate (Missing for New Dev)

| Field | Type | Description |
|-------|------|-------------|
| `featuresEnergyCertificateType` | enum | project / completed (new development only) |

**Total: 35 fields (27 new DB fields + 8 existing need mapping)**

---

## Land

**Schema:** `land.json`
**Required:** `featuresType`, `featuresAreaPlot`

### Currently Implemented ✅

| Idealista Field | Vesta Source | Status |
|-----------------|--------------|--------|
| `featuresType` | propertyType/propertySubtype mapping | ✅ Working |
| `featuresAreaPlot` | plotArea | ✅ Working |

### Area & Building Potential (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresAreaBuildable` | integer (1-99999999) | Buildable area in m² | buildableArea |
| `featuresAreaTradableMinimum` | integer (1-999999) | Minimum tradable area | tradableMinimumArea |
| `featuresFloorsBuildable` | integer (1-99) | Buildable floors | buildableFloors |

### Land Classification (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresClassificationBlocks` | boolean | Certified for high-rise residential | classificationBlocks |
| `featuresClassificationChalet` | boolean | Certified for residential house | classificationChalet |
| `featuresClassificationCommercial` | boolean | Certified for commercial | classificationCommercial |
| `featuresClassificationHotel` | boolean | Certified for hotel | classificationHotel |
| `featuresClassificationIndustrial` | boolean | Certified for industrial | classificationIndustrial |
| `featuresClassificationOffice` | boolean | Certified for office | classificationOffice |
| `featuresClassificationPublic` | boolean | Certified for public (hospitals, schools) | classificationPublic |
| `featuresClassificationOther` | boolean | Other classification | classificationOther |

**Note:** Could potentially map from existing `allowedUse` enum field

### Access & Location (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresAccessType` | enum | urban / road / track / highway / unknown | accessType |
| `featuresNearestLocationKm` | number (0-99) | Distance to nearest town in km | nearestLocationKm |

### Utilities (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresUtilitiesElectricity` | boolean | Electricity available | utilitiesElectricity |
| `featuresUtilitiesWater` | boolean | Water available | utilitiesWater |
| `featuresUtilitiesNaturalGas` | boolean | Natural gas available | utilitiesNaturalGas |
| `featuresUtilitiesSewerage` | boolean | Sewerage available | utilitiesSewerage |
| `featuresUtilitiesRoadAccess` | boolean | Road access available | utilitiesRoadAccess |
| `featuresUtilitiesSidewalk` | boolean | Sidewalk available | utilitiesSidewalk |
| `featuresUtilitiesStreetLighting` | boolean | Street lighting available | utilitiesStreetLighting |

**Note:** `featuresUtilitiesElectricity` could derive from existing `electricityType` field

### Other (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresCurrentOccupation` | enum | free / tenanted / bare_ownership / illegally_occupied | occupationStatus (exists but not mapped for land) |

**Total: 22 fields (19 new + 3 potential mappings from existing fields)**

---

## Building

**Schema:** `building.json`
**Required:** `featuresType`, `featuresAreaConstructed`

### Currently Implemented ✅

| Idealista Field | Vesta Field | Status |
|-----------------|-------------|--------|
| `featuresType: "building"` | propertyType mapping | ✅ Working |
| `featuresAreaConstructed` | squareMeter | ✅ Working |
| `featuresBuiltYear` | yearBuilt | ✅ Working |
| `featuresConservation` | conservationStatus | ✅ Working |
| Energy certificate fields | Various | ✅ Working |
| `featuresGarden` | garden | ✅ Working |

### In DB But NOT Being Exported ⚠️

| Idealista Field | Vesta DB Field | Notes |
|-----------------|----------------|-------|
| `featuresFloorsBuilding` | buildingFloors | Exists in DB, just needs export mapping |
| `featuresSecurityPersonnel` | securityGuard | Exists in DB, just needs export mapping |
| `featuresParkingSpacesNumber` | garageSpaces | Exists in DB, just needs export mapping |

### Missing from Database

| Field | Type | Description | Priority | DB Field Needed |
|-------|------|-------------|----------|-----------------|
| `featuresBuiltProperties` | integer (1-99) | Number of units in building | 🔴 High | builtProperties |
| `featuresLiftNumber` | integer (0-9) | Number of elevators | 🟡 Medium | liftNumber |
| `featuresAreaTradableMinimum` | integer | Min divisible area in m² | 🟡 Medium | tradableMinimumArea |
| `featuresPropertyTenants` | boolean | Building has tenants | 🟡 Medium | hasTenants |
| `featuresClassificationChalet` | boolean | Certified for residential | 🟢 Low | classificationChalet |
| `featuresClassificationCommercial` | boolean | Certified for commercial | 🟢 Low | classificationCommercial |
| `featuresClassificationHotel` | boolean | Certified for hotel | 🟢 Low | classificationHotel |
| `featuresClassificationIndustrial` | boolean | Certified for industrial | 🟢 Low | classificationIndustrial |
| `featuresClassificationOffice` | boolean | Certified for office | 🟢 Low | classificationOffice |
| `featuresClassificationOther` | boolean | Other classification | 🟢 Low | classificationOther |
| `featuresCurrentOccupation` | enum | Occupation status | 🟢 Low | occupationStatus (exists, not mapped for building) |

**Total: 14 fields (3 quick wins + 11 new)**

---

## Room Rental

**Schema:** `room.json`
**Required:** 16 fields! (Most complex type)

### Currently Implemented ✅

| Idealista Field | Vesta Field | Status |
|-----------------|-------------|--------|
| `featuresType` | room_shared_flat / room_shared_chalet | ✅ Working |
| `featuresAreaConstructed` | squareMeter | ✅ Working |
| `featuresRooms` | rooms | ✅ Working |
| `featuresBathroomNumber` | bathrooms | ✅ Working |
| `featuresLiftAvailable` | hasElevator | ✅ Working |
| `featuresAllowPets` | petsAllowed | ✅ Working |
| `featuresConditionedAir` | airConditioningType | ✅ Working |
| `featuresHeatingType` | heatingType | ✅ Working |
| `featuresEquippedKitchen` | furnishedKitchen | ✅ Working |
| `featuresEquippedWithFurniture` | isFurnished | ✅ Working |
| `featuresTerrace` | terrace | ✅ Working |
| `featuresPool` | pool | ✅ Working |
| `featuresGarden` | garden | ✅ Working |
| `featuresDoorman` | doorman | ✅ Working |
| `featuresFloorsInTop` | topFloor | ✅ Working |
| `featuresWindowsLocation` | windowsLocation | ✅ Working |

### Missing REQUIRED Fields ❌ (MUST add)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresTenantNumber` | int (2-99) | Number of tenants in flat | tenantNumber |
| `featuresSmokingAllowed` | boolean | Smoking allowed | smokingAllowed |
| `featuresMinTenantAge` | int (1-99) | Youngest tenant age | minTenantAge |
| `featuresMaxTenantAge` | int (1-99) | Oldest tenant age | maxTenantAge |
| `featuresCouplesAllowed` | boolean | Couples allowed | couplesAllowed |
| `featuresBedType` | enum | single / double / two_beds / none | bedType |
| `featuresMinimalStay` | int (1-6) | Minimum stay in months | minimalStay |
| `featuresWindowView` | enum | street_view / courtyard_view / no_window | windowView |
| `featuresOwnerLiving` | boolean | Owner lives there | ownerLiving |
| `featuresAvailableFrom` | string | yyyy-mm format (current month to +5 months) | availableFrom |

### Missing Optional Fields

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresTenantGender` | enum | female / male / both | tenantGender |
| `featuresInternetAvailable` | boolean | Has internet | internetAvailable |
| `featuresHouseKeeper` | boolean | Housekeeper service | houseKeeper |
| `featuresCupboard` | boolean | Cupboard/wardrobe in room | hasCupboard |
| `featuresPrivateBathroom` | boolean | Room has private bathroom | privateBathroom |
| `featuresGenderPreference` | enum | female / male / no_preference | genderPreference |
| `featuresOccupation` | enum | student / worker / no_preference | occupationPreference |
| `featuresLgtbFriendly` | boolean | LGBTQ+ friendly | lgbtFriendly |
| `featuresChildrenAllowed` | boolean | Children allowed | childrenAllowed |
| `featuresOccupiedNow` | boolean | Currently has tenants | occupiedNow |
| `featuresTenantWorkers` | boolean | Tenants are workers | tenantWorkers |
| `featuresTenantStudents` | boolean | Tenants are students | tenantStudents |
| `featuresMinNewTenantAge` | int (18-99) | Min age for new tenant | minNewTenantAge |
| `featuresMaxNewTenantAge` | int (18-99) | Max age for new tenant | maxNewTenantAge |
| `featuresLifeStyle` | enum | quiet / friendly / animated | lifeStyle |
| `featuresCouplesCosts` | int (1-1000) | Extra cost for couples | couplesCosts |
| `featuresRoomArea` | int (1-100) | Room size in m² | roomArea |
| `featuresHasDesk` | boolean | Room has desk | hasDesk |
| `featuresHasRoomAirConditioning` | boolean | Room has A/C | hasRoomAC |
| `featuresHasWashingMachine` | boolean | Has washing machine | hasWashingMachine |
| `featuresExteriorAccessibility` | boolean | Access adapted for mobility | exteriorAccessibility |
| `featuresInteriorAccessibility` | boolean | Interior adapted for mobility | interiorAccessibility |

**Total: 32 fields (10 REQUIRED + 22 optional) - All need new DB fields**

---

## Storage

**Schema:** `storage.json`
**Required:** `featuresType`, `featuresAreaConstructed`

### Currently Implemented ✅

| Idealista Field | Vesta Field | Status |
|-----------------|-------------|--------|
| `featuresType: "storage"` | trastero mapping | ✅ Works |
| `featuresAreaConstructed` | builtArea | ✅ Works |

### Missing Fields (Spain)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresAccess24h` | boolean | 24 hour access available | access24h |
| `featuresAreaHeight` | number (0-9) | Ceiling height in meters | ceilingHeight |
| `featuresLoadingDock` | boolean | Loading dock available | hasLoadingDock |
| `featuresSecurity24h` | boolean | 24 hour security service | hasSecurity24h |
| `featuresCurrentOccupation` | enum | Occupation status | occupationStatus (exists, needs mapping) |

**Total: 5 fields (4 new + 1 mapping)**

---

## Homes (Housing)

**Schema:** `homes.json`
**Required:** `featuresType`, `featuresAreaConstructed`, `featuresBathroomNumber`, (`featuresRooms` OR `featuresBedroomNumber`)

⚠️ **This section was missing from the original document!**

### Currently Implemented ✅

Most housing fields are already implemented. See `idealista.tsx` for full list.

### Missing Optional Fields

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresRecommendedForChildren` | boolean | Suitable for children (0-12 years) | recommendedForChildren |
| `featuresTenantNumber` | int (1-10) | Number of tenants (housing version) | tenantNumberHousing |

### Missing Italy-Only Fields

| Field | Type | Description |
|-------|------|-------------|
| `featuresGardenType` | enum | private / community (only if garden=true) |
| `featuresParkingSpaceCapacity` | enum | single / double |
| `featuresParkingSpaceArea` | integer | Parking space size in m² |
| `featuresOutdoorParkingSpace` | boolean | Has outdoor parking |
| `featuresOutdoorParkingSpaceType` | enum | covered / uncovered |
| `featuresOutdoorParkingSpaceNumber` | integer | Number of outdoor spots |
| `featuresLowSeasonPrice` | integer | Weekly low season price |
| `featuresHighSeasonPrice` | integer | Weekly high season price |
| `residentOnly` | boolean | Only for residents (Trentino Alto Adige) |

**Total Spain: 2 fields missing**

---

## Premises (Commercial)

**Schema:** `premises.json`
**Required:** `featuresType`, `featuresAreaConstructed`

⚠️ **This section was missing from the original document!**

### Currently Implemented ✅

| Idealista Field | Vesta Field | Status |
|-----------------|-------------|--------|
| `featuresType` | premises / premises_commercial / premises_industrial | ✅ Working |
| `featuresAreaConstructed` | squareMeter | ✅ Working |
| `featuresAreaUsable` | usableArea | ✅ Working |
| `featuresBathroomNumber` | bathrooms | ✅ Working |
| `featuresConditionedAir` | airConditioningType | ✅ Working |
| `featuresConservation` | conservationStatus | ✅ Working |
| `featuresRooms` | rooms | ✅ Working |
| Energy certificate fields | Various | ✅ Working |
| `featuresBuiltYear` | yearBuilt | ✅ Working |

### Missing Premises-Specific Fields

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresBathroomAdapted` | boolean | Bathroom adapted for disabled | bathroomAdapted |
| `featuresFacadeArea` | integer (1-999) | Facade area in meters | facadeArea |
| `featuresFloorsProperty` | integer (1-99) | Floors within the premises | floorsProperty |
| `featuresHeating` | boolean | Has heating (boolean, not type) | heating |
| `featuresLoadingDock` | boolean | Loading dock available | hasLoadingDock |
| `featuresBridgeCrane` | boolean | Bridge crane available | hasBridgeCrane |
| `featuresLocatedAtCorner` | boolean | Located at corner | locatedAtCorner |
| `featuresSmokeExtraction` | boolean | Smoke extraction system | smokeExtraction |
| `featuresUbication` | enum | on_top_floor / shopping / street / mezzanine / belowGround / other / unknown | ubication |
| `featuresWindowsNumber` | integer (1-999) | Number of windows | windowsNumber |
| `featuresStorage` | boolean | Has storage | hasStorageRoom (exists, needs mapping) |
| `featuresParkingAvailable` | boolean | Has parking | hasGarage (exists, needs mapping) |

### Security Fields (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresSecurityAlarm` | boolean | Alarm system | securityAlarm |
| `featuresSecurityDoor` | boolean | Security door | securityDoor |
| `featuresSecuritySystem` | boolean | Security system | securitySystem |

### Transfer/Commercial Activity Fields (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresIsATransfer` | boolean | Is a commercial transfer | isTransfer |
| `featuresCommercialMainActivity` | enum | Main commercial activity (50+ options) | commercialMainActivity |
| `featuresCommercialSecondaryActivity` | enum | Secondary activity | commercialSecondaryActivity |
| `featuresPriceTransfer` | integer | Transfer price | priceTransfer |
| `featuresTransferEndContract` | string | End of rental contract (yyyy-mm) | transferEndContract |

### Investment Fields (Missing)

| Field | Type | Description | DB Field Needed |
|-------|------|-------------|-----------------|
| `featuresThirdPartiesRented` | boolean | Rented to third parties | thirdPartiesRented |
| `featuresRentedYieldPercentage` | number (0-100) | Yield percentage | rentedYieldPercentage |

**Total: 22 fields (20 new + 2 mappings)**

---

## Common Italy-Only Fields

These fields appear across multiple property types but are only applicable for Italy (Casa.it integration):

### Auction Fields (All Types)

| Field | Type | Description |
|-------|------|-------------|
| `featuresAuction` | boolean | Is an auction property |
| `featuresMinAuctionBidIncrement` | number | Minimum bid increment |
| `featuresAuctionDeposit` | integer (1-100) | Deposit percentage |
| `featuresAuctionDate` | date | Auction date |
| `featuresAuctionTribunal` | enum | Italian tribunal (200+ options) |

### Other Italy-Only Fields

| Field | Type | Description | Applies To |
|-------|------|-------------|------------|
| `featuresHiddenPrice` | boolean | Hide price (Trattativa riservata) | All types |
| `featuresGardenType` | enum | private / community | Homes, Premises, Building |
| `residentOnly` | boolean | Residents only | Homes |
| Conservation values: `fully_reformed`, `new_development_in_construction`, `new_development_finished` | enum | Italy-specific conservation states | All types |
| Energy law: `dl-192_2005`, `legge-90_2013` | enum | Energy certificate legislation | All types |

---

## Summary by Property Type

| Property Type | Total Missing | Required | Optional | Quick Wins | New DB Fields |
|---------------|---------------|----------|----------|------------|---------------|
| Garage | 7 | 0 | 7 | 1 | 6 |
| Offices | 35 | 0 | 35 | 8 | 27 |
| Land | 22 | 0 | 22 | 3 | 19 |
| Building | 14 | 0 | 14 | 3 | 11 |
| Room Rental | 32 | **10** | 22 | 0 | 32 |
| Storage | 5 | 0 | 5 | 1 | 4 |
| Homes | 2 | 0 | 2 | 0 | 2 |
| Premises | 22 | 0 | 22 | 2 | 20 |

**Grand Total: 139 fields**
- **Required fields missing: 10** (all room rental)
- **Quick wins (existing DB, need mapping): 18**
- **New DB fields needed: 121**

---

## Implementation Priority

### 🔴 Critical - Required Fields (BLOCKING)

These fields are REQUIRED by Idealista and will cause validation errors:

1. **Room Rental Required Fields (10 fields)**
   - `featuresTenantNumber`
   - `featuresSmokingAllowed`
   - `featuresMinTenantAge` / `featuresMaxTenantAge`
   - `featuresCouplesAllowed`
   - `featuresBedType`
   - `featuresMinimalStay`
   - `featuresWindowView`
   - `featuresOwnerLiving`
   - `featuresAvailableFrom`

### 🟠 High Priority - Quick Wins

These fields exist in the DB but aren't being exported:

1. **Building** (3 fields)
   - `buildingFloors` → `featuresFloorsBuilding`
   - `securityGuard` → `featuresSecurityPersonnel`
   - `garageSpaces` → `featuresParkingSpacesNumber`

2. **Offices** (8 fields)
   - `buildingFloors` → `featuresFloorsBuilding`
   - `hasStorageRoom` → `featuresStorage`
   - `doorman` → `featuresDoorman`
   - `windowsLocation` → `featuresWindowsLocation`
   - `orientation` → `featuresOrientation*`

3. **Premises** (2 fields)
   - `hasStorageRoom` → `featuresStorage`
   - `hasGarage` → `featuresParkingAvailable`

4. **Land** (3 fields)
   - Map `allowedUse` → `featuresClassification*`
   - Map `electricityType` → `featuresUtilitiesElectricity`
   - Map `occupationStatus` → `featuresCurrentOccupation`

5. **Garage/Storage** (2 fields)
   - Map `occupationStatus` → `featuresCurrentOccupation`

### 🟡 Medium Priority - Common Use Cases

1. **Building** `featuresBuiltProperties` - Number of units
2. **Storage** 4 Spain fields
3. **Premises** core commercial fields
4. **Office** core fields (8-10 most used)

### 🟢 Low Priority - Optional/Rare

1. Fire safety fields (offices)
2. Classification fields (land, building)
3. Italy-only fields (all types)
4. Room rental optional fields (after required done)
5. Transfer/commercial activity fields

---

## Database Schema Changes Required

### High Priority Additions

```typescript
// Room rental required fields
tenantNumber: smallint("tenant_number"),
smokingAllowed: boolean("smoking_allowed"),
minTenantAge: smallint("min_tenant_age"),
maxTenantAge: smallint("max_tenant_age"),
couplesAllowed: boolean("couples_allowed"),
bedType: varchar("bed_type", { length: 20 }), // single/double/two_beds/none
minimalStay: smallint("minimal_stay"), // 1-6 months
windowView: varchar("window_view", { length: 20 }), // street_view/courtyard_view/no_window
ownerLiving: boolean("owner_living"),
availableFrom: varchar("available_from", { length: 7 }), // yyyy-mm

// Building
builtProperties: smallint("built_properties"), // 1-99
```

### Medium Priority Additions

```typescript
// Storage
access24h: boolean("access_24h"),
ceilingHeight: decimal("ceiling_height", { precision: 3, scale: 1 }),
hasLoadingDock: boolean("has_loading_dock"),
hasSecurity24h: boolean("has_security_24h"),

// Garage
garageCapacityType: varchar("garage_capacity_type", { length: 30 }),
parkingAutomaticDoor: boolean("parking_automatic_door"),
parkingCovered: boolean("parking_covered"),

// Premises
facadeArea: smallint("facade_area"),
floorsProperty: smallint("floors_property"),
ubication: varchar("ubication", { length: 20 }),
hasBridgeCrane: boolean("has_bridge_crane"),
smokeExtraction: boolean("smoke_extraction"),
```
