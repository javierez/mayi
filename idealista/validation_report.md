# Validation Report: example_vesta.json

**Date:** Generated validation report  
**File:** `example_vesta.json`  
**Schema Version:** v6.00

## Summary

✅ **PASSED** - The file meets all critical requirements and follows the Idealista v6.00 schema rules.

---

## 1. Customer Level Validation ✅

### Required Fields
- ✅ `customerCode`: `"ilc711ae6100f5a3d2c4160086e704e413092b2e600"` 
  - Pattern: `^ilc([a-z]|[0-9]){40}$` ✅ (43 characters, starts with 'ilc')
- ✅ `customerCountry`: `"Spain"` ✅ (Valid enum value)

### Optional Fields
- ✅ `customerSendDate`: `"2025/12/11 01:08:37"` ✅ (Matches date format pattern)

**Status:** ✅ **PASSED**

---

## 2. Data Quality Requirements ✅

According to `instructions.md`, the following are **mandatory** for properties to be published:

### For Each Property:

1. ✅ **Price** (`operationPrice`): All properties have `operationPrice` ✅
2. ✅ **Constructed area or plot area**: All properties have `featuresAreaConstructed` ✅
3. ✅ **Bedrooms value** (Spain): 
   - All housing properties have `featuresBedroomNumber` ✅
   - Exception: Studio or `toRestore` conservation - not applicable here
4. ✅ **Bathrooms value** (housing typologies):
   - All `flat` and `premises_commercial` properties have `featuresBathroomNumber` ✅
5. ✅ **Address requirement** (at least one of):
   - ✅ Street name + postal code: All properties have `addressStreetName` and `addressPostalCode` ✅
   - ✅ Coordinates: All properties have `addressCoordinatesLatitude` and `addressCoordinatesLongitude` ✅

**Status:** ✅ **PASSED** - All mandatory data quality requirements met

---

## 3. Property Level Validation ✅

### Property Structure

All 15 properties in the file have:

1. ✅ `propertyCode`: Present and unique ✅
2. ✅ `propertyReference`: Present ✅
3. ✅ `propertyVisibility`: All set to `"idealista"` ✅
4. ✅ `propertyOperation`: Required fields present ✅
   - `operationType`: Valid values ("rent" or "sale") ✅
   - `operationPrice`: Valid integers (1-999999999) ✅
5. ✅ `propertyAddress`: Present with required fields ✅
6. ✅ `propertyFeatures`: Present and matches property type ✅
7. ✅ `propertyContact`: Present with valid email and phone ✅
8. ✅ `propertyDescriptions`: Present (at least one property has empty array, which is allowed) ✅
9. ✅ `propertyImages`: Present with valid URLs ✅

**Status:** ✅ **PASSED**

---

## 4. Property Features Validation by Type

### Homes (flat) - 11 properties ✅

**Required Fields:**
- ✅ `featuresType`: `"flat"` ✅
- ✅ `featuresAreaConstructed`: All present (60-244 m²) ✅
- ✅ `featuresBathroomNumber`: All present (1-3) ✅
- ✅ `featuresBedroomNumber`: All present (2-6) ✅

**Optional Fields Present:**
- `featuresAreaUsable`, `featuresDuplex`, `featuresLiftAvailable`, `featuresParkingAvailable`, `featuresStorage`, `featuresGarden`, `featuresPool`, `featuresTerrace`, `featuresWardrobes`, `featuresChimney`, `featuresAllowPets`, `featuresConservation`, `featuresOrientationEast`, `featuresBuiltYear`, `featuresEquippedKitchen`, `featuresWindowsLocation`, `featuresHeatingType`, `featuresBalcony`, `featuresCurrentOccupation`

**Status:** ✅ **PASSED** - All required fields present

### Premises (premises_commercial) - 4 properties ✅

**Required Fields:**
- ✅ `featuresType`: `"premises_commercial"` ✅
- ✅ `featuresAreaConstructed`: All present (75-544 m²) ✅

**Optional Fields Present:**
- `featuresAreaUsable`, `featuresBathroomNumber`, `featuresParkingAvailable`, `featuresStorage`, `featuresGarden`, `featuresConservation`, `featuresEquippedKitchen`, `featuresWindowsLocation`, `featuresBuiltYear`

**Note:** Premises don't require `featuresBathroomNumber` but it's present in all cases ✅

**Status:** ✅ **PASSED** - All required fields present

---

## 5. Address Validation ✅

All properties have valid addresses with:

1. ✅ **Street Information:**
   - `addressStreetName`: Present ✅
   - `addressStreetNumber`: Present (or not required) ✅
   - `addressPostalCode`: Present ✅
   - `addressTown`: Present ✅
   - `addressCountry`: `"Spain"` ✅

2. ✅ **Coordinates:**
   - `addressCoordinatesLatitude`: Present (valid range) ✅
   - `addressCoordinatesLongitude`: Present (valid range) ✅
   - `addressCoordinatesPrecision`: `"exact"` or `"moved"` ✅

3. ✅ **Visibility:**
   - `addressVisibility`: `"full"`, `"street"`, or `"hidden"` ✅

**Status:** ✅ **PASSED**

---

## 6. Operation Validation ✅

All properties have valid operations:

- ✅ `operationType`: Valid enum values ("rent" or "sale") ✅
- ✅ `operationPrice`: Valid integers within range (1-999999999) ✅
  - Range: 590 - 670,000 ✅

**Status:** ✅ **PASSED**

---

## 7. Contact Validation ✅

All properties have valid contact information:

- ✅ `contactEmail`: Valid email format ✅
- ✅ `contactPrimaryPhoneNumber`: Valid format (5-12 digits) ✅
- ✅ `contactPrimaryPhonePrefix`: Valid format (1-3 digits) ✅

**Status:** ✅ **PASSED**

---

## 8. Description Validation ✅

**Status:** ✅ **PASSED**

- Most properties have at least one description with:
  - ✅ `descriptionLanguage`: Valid enum value ("spanish") ✅
  - ✅ `descriptionText`: Present (or empty array allowed) ✅
- One property (1000049) has empty `propertyDescriptions` array - **This is allowed** ✅

**Note:** Empty descriptions are technically allowed by the schema, but may impact listing quality.

---

## 9. Image Validation ✅

All properties have images with:

- ✅ `imageUrl`: Valid HTTPS URLs ✅
- ✅ `imageOrder`: Sequential integers (1-N) ✅
- ✅ `imageLabel`: `"unknown"` (valid enum value) ✅
- ✅ Image count: All properties have 1-17 images (within 200 limit) ✅

**Status:** ✅ **PASSED**

---

## 10. Schema Compliance ✅

### Date Format
- ✅ `customerSendDate`: `"2025/12/11 01:08:37"` matches pattern `^20[0-9][0-9]/[0-9][0-9]/(([0-2][0-9])|(3[0-1])) (([0-1][0-9])|(2[0-4])):([0-5][0-9]):([0-5][0-9])$` ✅

### String Lengths
- ✅ `customerCode`: 43 characters ✅
- ✅ `propertyCode`: All ≤ 50 characters ✅
- ✅ `propertyReference`: All ≤ 50 characters ✅

### Enum Values
- ✅ `customerCountry`: Valid ✅
- ✅ `propertyVisibility`: Valid ✅
- ✅ `operationType`: Valid ✅
- ✅ `featuresType`: Valid ✅
- ✅ `featuresConservation`: Valid ✅
- ✅ `addressVisibility`: Valid ✅
- ✅ `addressCoordinatesPrecision`: Valid ✅
- ✅ `descriptionLanguage`: Valid ✅
- ✅ `imageLabel`: Valid ✅

**Status:** ✅ **PASSED**

---

## 11. Property Type Distribution

| Type | Count | Status |
|------|-------|--------|
| `flat` | 11 | ✅ |
| `premises_commercial` | 4 | ✅ |
| **Total** | **15** | ✅ |

**Status:** ✅ **PASSED**

---

## 12. Potential Issues & Recommendations

### ⚠️ Minor Observations (Not Errors)

1. **Empty Descriptions:**
   - Property `1000049` has empty `propertyDescriptions` array
   - **Impact:** Low - Schema allows it, but may reduce listing quality
   - **Recommendation:** Add at least one description for better listing quality

2. **Image Labels:**
   - All images use `"unknown"` label
   - **Impact:** Low - Valid value, but using specific labels (e.g., "facade", "bedroom", "kitchen") improves listing quality
   - **Recommendation:** Use specific image labels when possible

3. **Date Format:**
   - `customerSendDate` uses future date (2025/12/11)
   - **Impact:** None if this is a test file
   - **Recommendation:** Use current date for production files

### ✅ No Critical Issues Found

---

## Final Verdict

### ✅ **VALIDATION PASSED**

The `example_vesta.json` file:
- ✅ Meets all **mandatory** requirements
- ✅ Follows all **schema rules** (v6.00)
- ✅ Passes all **data quality** checks
- ✅ Has valid **structure and formatting**
- ✅ Contains **valid enum values** throughout
- ✅ Has **proper address and coordinate** information
- ✅ Includes **required features** for each property type

**The file is ready for submission to Idealista.**

---

## Test Coverage

- ✅ Customer level validation
- ✅ Property level validation  
- ✅ Address validation
- ✅ Operation validation
- ✅ Features validation (by property type)
- ✅ Contact validation
- ✅ Description validation
- ✅ Image validation
- ✅ Schema compliance
- ✅ Data quality requirements
- ✅ Enum value validation
- ✅ Format validation (dates, strings, numbers)

---

**Report Generated:** Based on Idealista v6.00 schemas and `instructions.md`

