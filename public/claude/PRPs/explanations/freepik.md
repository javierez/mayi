# Freepik Image Enhancement System

## Overview

The Vesta platform integrates Freepik's Image Upscaler Precision API to enhance property images. This document explains the complete flow from user interaction through API processing, polling, and final image storage.

## System Architecture

The image enhancement system consists of three main components:

1. **Client Hook** (`use-image-enhancement.tsx`) - React hook managing UI state and orchestration
2. **API Client** (`freepik-client.ts`) - Freepik API wrapper with retry logic
3. **API Route** (`route.ts`) - Next.js API endpoint handling requests and authentication

## Complete Enhancement Flow

### Phase 1: Initiation (User Action � API Request)

**User Action:**
User clicks "Enhance" button on a property image

**Hook: `useImageEnhancement.enhance()`**
```typescript
enhance(imageUrl, referenceNumber, currentImageOrder)
```

**Steps:**
1. Sets state to `processing`, progress to 0%
2. Stores original image URL
3. Makes POST request to `/api/properties/[id]/freepik-enhance`

**API Route: POST Handler**
```
/api/properties/[id]/freepik-enhance
```

**Steps:**
1. **Authentication** - Validates user session using `getSecureSession()`
2. **Authorization** - Verifies user owns the property via `getListingHeaderData()`
3. **Image URL Validation:**
   - Validates URL format (must start with http/https)
   - No download/conversion needed - v2 API accepts URLs directly
4. **Freepik API Call** - Calls `freepikClient.enhance(imageUrl)`

**Freepik Client: `enhance()`**
```
POST https://api.freepik.com/v1/ai/image-upscaler-precision-v2
```

**Request Body:**
```json
{
  "image": "https://s3.amazonaws.com/.../property-image.jpg",
  "sharpen": 7,
  "smart_grain": 7,
  "ultra_detail": 30,
  "flavor": "sublime",
  "scale_factor": 2
}
```

**Settings Used:**
- **Balanced Enhancement Preset** (quality + cost-effective)
  - `sharpen: 7` - Balanced sharpening (Range: 0-100 integers)
  - `smart_grain: 7` - Balanced grain enhancement (Range: 0-100 integers)
  - `ultra_detail: 30` - Standard detail enhancement (Range: 0-100 integers)
  - `flavor: "sublime"` - Quality preset (options: sublime, sparkle, illusion)
  - `scale_factor: 2` - 2x upscale (options: 2, 4, 8, 16 - lower is faster/cheaper)

**API Version: v2**
- **Key Difference:** v2 accepts **image URL directly** instead of base64
- **Benefits:** No base64 conversion needed, faster processing, less bandwidth
- **Image URL must be publicly accessible** (S3 URLs work perfectly)

**Freepik Response:**
```json
{
  "data": {
    "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "status": "IN_PROGRESS",
    "generated": []
  }
}
```

**Note:** The initial status is `"IN_PROGRESS"` (not `"CREATED"`). The task starts processing immediately upon creation.

**API Route Response to Client:**
```json
{
  "success": true,
  "taskId": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "status": "IN_PROGRESS",
  "referenceNumber": "REF-123",
  "currentImageOrder": "0",
  "propertyId": "456"
}
```

### Phase 2: Polling (Status Monitoring)

**Hook: Automatic Polling Setup**

After receiving taskId, the hook:
1. Sets up interval polling every 2 seconds
2. Makes initial status check after 500ms
3. Continues polling for up to 60 attempts (2 minutes)

**Polling Request:**
```
GET /api/properties/[id]/freepik-enhance?taskId=uuid&referenceNumber=REF-123&currentImageOrder=0
```

**API Route: GET Handler**

**Steps:**
1. Validates authentication and query parameters
2. Calls `freepikClient.checkStatus(taskId)`

**Freepik Client: `checkStatus()`**
```
GET https://api.freepik.com/v1/ai/image-upscaler-precision/{taskId}
```

**Freepik Status Responses:**

**While Processing:**
```json
{
  "data": {
    "status": "IN_PROGRESS",
    "progress": 45
  }
}
```

**On Completion:**
```json
{
  "data": {
    "status": "COMPLETED",
    "generated": [
      "https://freepik-cdn.com/temporary-url/enhanced-image.jpg"
    ]
  }
}
```

**On Failure:**
```json
{
  "data": {
    "status": "FAILED",
    "error": "Error message"
  }
}
```

**API Route Response:**

**Processing:**
```json
{
  "status": "IN_PROGRESS",
  "progress": 45
}
```

**Success:**
```json
{
  "status": "SUCCESS",
  "enhancedImageUrl": "https://freepik-cdn.com/.../enhanced.jpg",
  "referenceNumber": "REF-123",
  "currentImageOrder": "0"
}
```

**Hook: Status Update Handler**

**If IN_PROGRESS:**
- Updates progress bar (combines real progress + time-based estimation)
- Continues polling
- Timeout after 60 attempts with error message

**If FAILED:**
- Stops polling
- Sets error state
- Shows error toast
- Calls `onError` callback

**If SUCCESS:**
- Stops polling
- Sets status to `success`, progress to 100%
- Stores enhanced image URL and metadata
- Calls `onComparisonReady()` callback
- Shows success toast: "�Mejora completada! Usa el slider para comparar."
- **Important:** Does NOT save to S3 or database yet

### Phase 3: User Review (Image Comparison)

**At this point:**
- Original image URL is stored in `originalImageUrl`
- Enhanced image URL (Freepik's temporary CDN) is stored in `enhancedImageUrl`
- Metadata stored in `enhancementMetadata`:
  ```typescript
  {
    referenceNumber: string,
    currentImageOrder: string
  }
  ```

**User sees:**
- Side-by-side comparison slider
- Original image on left
- Enhanced image on right
- Options: "Save" or "Cancel"

### Phase 4: Saving Enhanced Image (User Confirms)

**User Action:**
User clicks "Save Enhanced Image" button

**Hook: `saveEnhanced()`**

**Validation:**
- Checks if `enhancedImageUrl` exists
- Checks if `enhancementMetadata` exists
- Shows error toast if either is missing

**Steps:**
1. Sets status to `processing` (loading state)
2. Makes POST request to `/api/properties/[id]/save-enhanced`

**Request Body:**
```json
{
  "enhancedImageUrl": "https://freepik-cdn.com/.../enhanced.jpg",
  "referenceNumber": "REF-123",
  "currentImageOrder": "0"
}
```

**Save Enhanced API Route:**
```
POST /api/properties/[id]/save-enhanced
```

**Steps:**
1. **Authentication & Authorization** (same as before)
2. **Download Enhanced Image** - Fetches from Freepik's temporary URL
3. **Upload to S3** - Stores in Vesta's permanent storage
4. **Generate Filename:**
   ```
   enhanced/{propertyId}/{referenceNumber}-{currentImageOrder}-enhanced.jpg
   ```
5. **Database Record Creation:**
   - Creates new `propertyImage` record
   - Links to property
   - Sets `isEnhanced: true` flag
   - Stores S3 URL
   - Records metadata (reference number, order, enhancement date)
6. **Optional:** Updates original image's `enhancedVersionId` foreign key

**Response:**
```json
{
  "success": true,
  "propertyImage": {
    "id": "789",
    "propertyId": "456",
    "imageUrl": "https://s3.amazonaws.com/.../enhanced-image.jpg",
    "orderIndex": 0,
    "isEnhanced": true,
    "enhancedAt": "2025-11-10T...",
    ...
  },
  "message": "Enhanced image saved successfully"
}
```

**Hook: Save Success Handler**

**Steps:**
1. Updates `enhancedPropertyImage` with saved database record
2. Sets status to `success`
3. Calls `onSuccess(propertyImage)` callback
4. Shows success toast: "�Imagen mejorada guardada correctamente!"

**Parent Component Response:**
- Refreshes property image gallery
- Shows new enhanced image
- May replace original or add as new image (implementation dependent)

## Error Handling

### Network Errors

**Retry Logic (Freepik Client):**
- 3 automatic retries with exponential backoff
- Waits: 1s, 2s, 4s between retries
- Handles rate limiting (429 status)

**Timeout Handling (Hook):**
- Max 60 polling attempts (2 minutes)
- Shows timeout error if exceeded
- User can retry manually

### Validation Errors

**Image Size:**
- Max 10MB enforced
- Returns specific error with actual size
- Error format: "Image too large (12.5MB). Maximum size is 10MB"

**Missing Parameters:**
- All required fields validated
- Returns 400 Bad Request with specific message

**Authentication:**
- Session validation on every request
- Returns 401 Unauthorized if session invalid

**Authorization:**
- Property ownership verified
- Returns 404 if property not found or user doesn't own it

### API Errors

**Freepik API Failures:**
- Captures error response details
- Logs full error context
- Returns user-friendly messages:
  - "Failed to download image. Please check the image URL."
  - "Enhancement service temporarily unavailable. Please try again."

**S3 Upload Failures:**
- Handled in save-enhanced route
- Transaction rollback if database creation fails
- User can retry save operation

## State Management

### Hook States

```typescript
status: "idle" | "processing" | "success" | "error"
progress: number (0-100)
error: string | null
enhancedPropertyImage: PropertyImage | null // Final saved image
originalImageUrl: string | null
enhancedImageUrl: string | null // Temporary Freepik URL
enhancementMetadata: { referenceNumber, currentImageOrder } | null
```

### State Transitions

```
idle � processing (enhance() called)
  � success (enhancement complete, comparison ready)
  � processing (saveEnhanced() called)
    � success (saved to S3 & DB)
    � error (save failed)
  � error (enhancement failed)
  � idle (cancelled)

idle � reset() � idle (cleanup)
```

## Cleanup & Memory Management

**Mount/Unmount Tracking:**
- Uses `isMounted` state to prevent state updates after unmount
- All async operations check `isMounted` before updating state

**Polling Cleanup:**
- `useEffect` cleanup function clears interval on unmount
- `clearPolling()` helper ensures no memory leaks

**Cancel Operation:**
- `cancel()` stops polling and resets to idle
- No API cancellation (Freepik task continues server-side)

**Full Reset:**
- `reset()` clears all state including URLs and metadata
- Useful when starting fresh enhancement

## Cost Optimization

**Balanced Enhancement Preset:**
- Optimizes for quality while remaining cost-effective
- Settings defined in `~/types/freepik.ts`:
  ```typescript
  export const LIGHT_ENHANCEMENT_SETTINGS = {
    sharpen: 7,           // Integer 0-100
    smartGrain: 7,        // Integer 0-100
    ultraDetail: 30,      // Integer 0-100
    flavor: "sublime",    // Quality preset
    scaleFactor: 2,       // 2x upscale (most cost-effective)
  }
  ```

**Why These Settings:**
- Provides noticeable quality improvement for property listings
- 2x scale factor is faster and cheaper than 4x/8x/16x
- Sublime flavor balances quality and processing time
- Parameters based on Freepik's recommended example values
- **Important:** All numeric parameters must be integers (decimals will cause validation errors)

## Security Considerations

**API Key Protection:**
- Stored in environment variable `FREEPIK_API_KEY`
- Never exposed to client
- Only used in server-side API routes and client

**Image Validation:**
- Size limit prevents abuse
- URL validation ensures legitimate image sources
- Base64 encoding verified before API call

**User Authorization:**
- Session validated on every request
- Property ownership verified before enhancement
- No cross-user enhancement possible

**Temporary URLs:**
- Freepik URLs expire (typically 24 hours)
- Must save to S3 for permanent storage
- Original images remain accessible even if enhancement fails

## Performance Characteristics

**Typical Enhancement Time:**
- Light preset: 15-45 seconds
- Depends on image size and Freepik server load

**Polling Frequency:**
- 2-second intervals
- Initial check after 500ms
- Average 10-20 poll requests per enhancement

**Image Size Handling:**
- Base64 encoding increases size by ~33%
- 10MB max original = ~13.3MB base64
- Client handles conversion, not user's browser

**Progress Indication:**
- Combines real API progress + time-based estimation
- Starts at 0%, reaches 90% through polling
- Jumps to 100% on completion
- Ensures progress bar always moves forward

## Integration Points

**Parent Components:**
- Must provide `propertyId`
- Should implement `onSuccess` callback to refresh image list
- Should implement `onComparisonReady` to show comparison UI
- Optional `onError` for custom error handling

**Database Schema:**
- `propertyImages` table must have:
  - `isEnhanced` boolean column
  - `enhancedAt` timestamp column
  - Optional: `enhancedVersionId` foreign key
  - Optional: `originalVersionId` foreign key

**S3 Configuration:**
- Bucket must have proper CORS settings
- Upload permissions required
- Public read access for enhanced images
- Organized in `/enhanced/{propertyId}/` folders

## Monitoring & Debugging

**Console Logging:**
- Freepik client logs request details (with API key truncated)
- API routes log errors with context
- Hook logs major state transitions in development

**Error Context:**
- All errors include descriptive messages
- API errors include status codes
- Image size errors include actual size

**Success Tracking:**
- Toast notifications for user feedback
- Callbacks allow parent component tracking
- Database records include enhancement timestamp

## Future Enhancements

**Potential Improvements:**
1. **Batch Processing** - Enhance multiple images in parallel
2. **Quality Presets** - Let users choose enhancement intensity
3. **Before/After Analytics** - Track enhancement effectiveness
4. **Automatic Enhancement** - AI decides which images need enhancement
5. **Undo Functionality** - Revert to original after saving
6. **Enhancement History** - Track all enhancement attempts
7. **Cost Tracking** - Monitor API usage and costs per property

## API Reference Summary

### Freepik API

**Base URL:** `https://api.freepik.com/v1/ai/image-upscaler-precision`

**Authentication:** `x-freepik-api-key` header

**Endpoints:**
- `POST /` - Start enhancement
- `GET /{taskId}` - Check status

**Rate Limits:** Handled with exponential backoff

### Vesta API

**Endpoints:**
- `POST /api/properties/[id]/freepik-enhance` - Start enhancement
- `GET /api/properties/[id]/freepik-enhance?taskId={id}&referenceNumber={ref}&currentImageOrder={order}` - Poll status
- `POST /api/properties/[id]/save-enhanced` - Save enhanced image to S3 and database

**Authentication:** Session-based via `getSecureSession()`

## Troubleshooting

**"Image too large" Error:**
- Compress image before enhancement
- Use image optimization tools
- Max size: 10MB

**"Enhancement timed out" Error:**
- Freepik servers may be overloaded
- Retry after a few minutes
- Check Freepik API status

**"Failed to download image" Error:**
- Image URL may be invalid or expired
- Check CORS configuration
- Ensure image is publicly accessible

**"Enhancement service unavailable" Error:**
- Freepik API may be down
- Check API key validity
- Verify environment variables

**Enhancement completes but save fails:**
- Check S3 configuration
- Verify database connection
- Ensure proper permissions
- Retry save operation (enhanced URL may still be valid)
