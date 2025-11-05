# Visit Document PDF Generation Architecture

## Table of Contents
1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [File Structure](#file-structure)
4. [Authentication Bypass Strategy](#authentication-bypass-strategy)
5. [Complete Data Flow](#complete-data-flow)
6. [Component Hierarchy](#component-hierarchy)
7. [API Route Details](#api-route-details)
8. [Template Pages](#template-pages)
9. [Document Component](#document-component)
10. [Error Handling](#error-handling)
11. [Debugging Guide](#debugging-guide)
12. [Comparison with Nota-Encargo](#comparison-with-nota-encargo)

---

## Overview

The visit document PDF generation system uses **Puppeteer** to render HTML templates into PDF files. It follows a pattern similar to the `nota-encargo` system but with some key differences:

**Key Features:**
- Server-side PDF generation using Puppeteer (headless Chrome)
- Authentication bypass via query parameter data passing
- Two template routes: one for PDF generation (no auth), one for preview (with auth)
- Client-side document rendering with dynamic branding
- Mobile-responsive viewing with A4 page scaling
- Automatic page breaks for multi-page documents

**Two Main Use Cases:**
1. **Preview**: User clicks "Vista Previa" → Opens template page with authentication
2. **PDF Download**: User clicks "PDF" → Server generates PDF via Puppeteer → Downloads automatically

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────┐
                              │                 │
                              ▼                 ▼
                    ┌─────────────────┐  ┌──────────────────┐
                    │  Preview Button │  │   PDF Button     │
                    │  (Client-side)  │  │  (Client-side)   │
                    └─────────────────┘  └──────────────────┘
                              │                 │
                              │                 │
                              ▼                 ▼
          ┌───────────────────────────┐  ┌─────────────────────────────┐
          │  /templates/visita/[id]   │  │  /api/visita/generate-pdf   │
          │  (Client Component)      │  │  (Server API Route)         │
          └───────────────────────────┘  └─────────────────────────────┘
                              │                 │
                              │                 │
                    ┌─────────▼─────────┐       │
                    │  Fetch via       │       │
                    │  Server Action   │       │
                    │  (with auth)     │       │
                    └─────────┬─────────┘       │
                              │                 │
                              │                 │
                              ▼                 ▼
          ┌───────────────────────────┐  ┌─────────────────────────────┐
          │  getVisitDocumentDataAction│  │  1. Fetch data (with auth)  │
          │  (Server Action)          │  │  2. Serialize to JSON       │
          └───────────────────────────┘  │  3. Launch Puppeteer         │
                              │           │  4. Navigate to template │
                              │           │  5. Wait for render          │
                              │           │  6. Generate PDF             │
                              │           │  7. Return PDF buffer        │
                              │           └─────────────────────────────┘
                              │                           │
                              │                           │
                              ▼                           ▼
          ┌───────────────────────────┐  ┌─────────────────────────────┐
          │  VisitDocument Component  │  │  /templates/visita?data=... │
          │  (Renders with branding)  │  │  (No auth required)         │
          └───────────────────────────┘  └─────────────────────────────┘
                                                      │
                                                      │
                                                      ▼
                                          ┌─────────────────────────────┐
                                          │  Puppeteer renders HTML     │
                                          │  to PDF buffer              │
                                          └─────────────────────────────┘
                                                      │
                                                      │
                                                      ▼
                                          ┌─────────────────────────────┐
                                          │  PDF Download to User       │
                                          └─────────────────────────────┘
```

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── visita/
│   │       └── generate-pdf/
│   │           └── route.ts                    # PDF generation API endpoint
│   │
│   └── templates/
│       └── visita/
│           ├── page.tsx                        # Template for PDF generation (query params)
│           └── [appointment_id]/
│               └── page.tsx                    # Template for preview (with auth)
│
├── components/
│   ├── documents/
│   │   └── visit-document.tsx                  # Main document component
│   │
│   └── visits/
│       └── visit-form.tsx                      # Form with PDF/Preview buttons
│
└── server/
    └── actions/
        └── visits.ts                           # getVisitDocumentDataAction
```

---

## Authentication Bypass Strategy

### Problem
Puppeteer runs headless Chrome from the server, which doesn't have access to user cookies/sessions. When Puppeteer navigates to a protected route, it gets redirected to the login page.

### Solution
**Two-Phase Data Passing:**

1. **Phase 1 (Server-side with Auth)**: API route fetches data using authenticated server actions
2. **Phase 2 (Template without Auth)**: Data is passed via URL query parameters to a public template route

### Implementation Details

#### Middleware Configuration
```typescript
// src/middleware.ts
const publicPaths = [
  "/templates",  // ← All template routes are public
  // ...
];
```

#### Data Serialization
```typescript
// In API route (has auth)
const visitData = await getVisitDocumentDataAction(appointmentId);

// Convert Date objects to ISO strings for JSON
const serializedData = {
  ...visitData,
  appointment: {
    ...visitData.appointment,
    datetimeStart: visitData.appointment.datetimeStart.toISOString(),
    datetimeEnd: visitData.appointment.datetimeEnd.toISOString(),
  },
};

// Pass via URL query parameter
templateUrl.searchParams.set("data", JSON.stringify(serializedData));
```

#### Template Deserialization
```typescript
// In template page (no auth needed)
const dataParam = searchParams.get("data");
const parsedData = JSON.parse(dataParam);

// Convert ISO strings back to Date objects
const dataWithDates = {
  ...parsedData,
  appointment: {
    ...parsedData.appointment,
    datetimeStart: new Date(parsedData.appointment.datetimeStart),
    datetimeEnd: new Date(parsedData.appointment.datetimeEnd),
  },
};
```

**Why This Works:**
- `/templates/*` routes are public (bypass middleware)
- Data is embedded in URL (no database queries needed)
- Puppeteer can access the page without authentication
- Sensitive data is only accessible if you have the exact URL

---

## Complete Data Flow

### Flow 1: Preview (User-Initiated)

```
1. User clicks "Vista Previa" button
   └─> visit-form.tsx: onClick handler

2. Opens new window/tab
   └─> window.open(`/templates/visita/${appointmentId}`, "_blank")

3. Template page loads
   └─> /templates/visita/[appointment_id]/page.tsx

4. useEffect detects appointment_id in params
   └─> Calls getVisitDocumentDataAction(appointmentId)

5. Server action executes (has auth context)
   └─> Queries database:
       - getAppointmentWithDetails(appointmentId)
       - getVisitSignatures(appointmentId)
       - Formats dates and location

6. Returns data to client
   └─> Sets state: setData(result.data)

7. VisitDocument component renders
   └─> Fetches branding (logos, agent info) via client-side actions
   └─> Displays document with all data

8. User can print or view
   └─> Browser print dialog (Ctrl+P / Cmd+P)
```

### Flow 2: PDF Generation (Server-Initiated)

```
1. User clicks "PDF" button
   └─> visit-form.tsx: handleGeneratePdf()

2. Client sends POST request
   └─> fetch("/api/visita/generate-pdf", {
         method: "POST",
         body: JSON.stringify({ appointmentId })
       })

3. API route receives request (has auth from cookies)
   └─> /api/visita/generate-pdf/route.ts

4. API route fetches data server-side
   └─> getVisitDocumentDataAction(appointmentId)
   └─> This works because API route has access to cookies/session

5. Serializes data for URL
   └─> Converts Date objects to ISO strings
   └─> JSON.stringify(serializedData)

6. Launches Puppeteer browser
   └─> puppeteer.launch({ headless: true, ...args })

7. Creates new page
   └─> browser.newPage()

8. Sets viewport to A4 dimensions
   └─> page.setViewport({ width: 794, height: 1123 })

9. Navigates to template with data in URL
   └─> page.goto(`/templates/visita?data=${encodedData}`)
   └─> This URL is public (no auth needed)

10. Template page loads (/templates/visita/page.tsx)
    └─> Reads data from query parameter
    └─> Parses JSON and converts dates
    └─> Renders VisitDocument component

11. Puppeteer waits for rendering
    └─> page.waitForSelector(".visit-document")
    └─> page.waitForFunction(() => images.every(img => img.complete))
    └─> page.waitForFunction(() => window.visitDocumentReady === true)

12. Generates PDF
    └─> page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "5mm", ... }
        })

13. Converts buffer to Uint8Array
    └─> new Uint8Array(pdfBuffer)

14. Returns PDF as HTTP response
    └─> new NextResponse(pdfUint8Array, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="visita-${id}.pdf"`
          }
        })

15. Client receives PDF blob
    └─> response.blob()

16. Creates download link and triggers download
    └─> Creates <a> element with blob URL
    └─> link.click()
    └─> Browser downloads PDF file
```

---

## Component Hierarchy

### Preview Flow Component Tree

```
VisitForm (Client Component)
├── Button "Vista Previa"
│   └─> onClick: window.open("/templates/visita/[id]")
│
└── [New Window/Tab]
    └── VisitTemplatePage ([appointment_id]/page.tsx)
        ├── useEffect: Fetch data via getVisitDocumentDataAction
        ├── VisitDocument (Client Component)
        │   ├── useEffect: Fetch branding data
        │   │   ├── getBrandAsset
        │   │   ├── getAgentNameAction
        │   │   └── getOfficeInfoAction
        │   └── Render document sections:
        │       ├── Header (logos, agency info)
        │       ├── Visit Details
        │       ├── Notes
        │       ├── GDPR Section
        │       └── Signatures
        └── Styled-jsx: Print styles
```

### PDF Generation Flow Component Tree

```
VisitForm (Client Component)
├── Button "PDF"
│   └─> onClick: handleGeneratePdf()
│       └─> fetch("/api/visita/generate-pdf")
│
└── [Server API Route]
    └── POST /api/visita/generate-pdf/route.ts
        ├── Fetch data: getVisitDocumentDataAction
        ├── Launch Puppeteer
        └── Navigate to: /templates/visita?data=...
            └── VisitTemplatePage (page.tsx)
                ├── Read data from query params
                └── VisitDocument (same as above)
                    └── Puppeteer captures rendered HTML
                        └── Converts to PDF buffer
                            └── Returns as HTTP response
```

---

## API Route Details

### File: `src/app/api/visita/generate-pdf/route.ts`

#### Step-by-Step Execution

```typescript
export async function POST(request: NextRequest) {
  // 1. Parse request body
  const { appointmentId } = await request.json();
  
  // 2. Validate input
  if (!appointmentId) {
    return NextResponse.json({ error: "Missing appointment ID" }, { status: 400 });
  }
  
  // 3. Fetch visit data (HAS AUTH CONTEXT)
  const visitDataResult = await getVisitDocumentDataAction(BigInt(appointmentId));
  
  // 4. Serialize for URL (Dates → ISO strings)
  const serializedData = {
    ...visitData,
    appointment: {
      ...visitData.appointment,
      datetimeStart: visitData.appointment.datetimeStart.toISOString(),
      datetimeEnd: visitData.appointment.datetimeEnd.toISOString(),
    },
  };
  
  // 5. Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      // ... optimization flags
    ],
  });
  
  // 6. Create page and set viewport
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123 });
  
  // 7. Build template URL with data
  const templateUrl = new URL("/templates/visita", baseUrl);
  templateUrl.searchParams.set("data", JSON.stringify(serializedData));
  
  // 8. Navigate to template
  await page.goto(templateUrl.toString(), {
    waitUntil: "networkidle0",
    timeout: 30000,
  });
  
  // 9. Wait for document to render
  await page.waitForSelector(".visit-document", { timeout: 10000 });
  
  // 10. Wait for images to load
  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll("img"));
    return images.every((img) => img.complete);
  }, { timeout: 10000 });
  
  // 11. Wait for ready signal
  await page.waitForFunction(() => {
    return (window as any).visitDocumentReady === true;
  }, { timeout: 15000 });
  
  // 12. Generate PDF
  const pdfBuffer = await page.pdf({
    format: "A4",
    landscape: false,
    printBackground: true,
    margin: { top: "5mm", right: "0mm", bottom: "10mm", left: "0mm" },
    preferCSSPageSize: true,
  });
  
  // 13. Cleanup
  await browser.close();
  
  // 14. Convert to Uint8Array (NextResponse requirement)
  const pdfUint8Array = new Uint8Array(pdfBuffer);
  
  // 15. Return PDF
  return new NextResponse(pdfUint8Array, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="visita-${appointmentId}-${Date.now()}.pdf"`,
    },
  });
}
```

#### Key Points

- **Authentication**: API route has access to cookies via `request.cookies`, so `getVisitDocumentDataAction` works
- **Timeout Values**: 
  - Navigation: 30 seconds
  - Selector wait: 10 seconds
  - Image loading: 10 seconds
  - Ready signal: 15 seconds
- **Viewport**: 794×1123 pixels = A4 at 96 DPI
- **PDF Settings**: 
  - Format: A4 portrait
  - Margins: 5mm top, 10mm bottom, 0mm sides
  - Background: Enabled (for logos/colors)

---

## Template Pages

### File 1: `/templates/visita/page.tsx` (PDF Generation)

**Purpose**: Template for Puppeteer PDF generation (no authentication required)

**Key Features:**
- Reads data from query parameter `?data=...`
- Client component (uses `useSearchParams`)
- Sets `window.visitDocumentReady = true` signal for Puppeteer
- Mobile scaling for responsive viewing
- Print styles via styled-jsx

**Data Flow:**
```typescript
useEffect(() => {
  const dataParam = searchParams.get("data");
  const parsedData = JSON.parse(dataParam);
  
  // Convert ISO strings back to Date objects
  const dataWithDates = {
    ...parsedData,
    appointment: {
      ...parsedData.appointment,
      datetimeStart: new Date(parsedData.appointment.datetimeStart),
      datetimeEnd: new Date(parsedData.appointment.datetimeEnd),
    },
  };
  
  setData(dataWithDates);
}, [searchParams]);
```

**Ready Signal:**
```typescript
useEffect(() => {
  if (data) {
    (window as any).visitDocumentReady = true;
  }
}, [data]);
```

### File 2: `/templates/visita/[appointment_id]/page.tsx` (Preview)

**Purpose**: Template for user preview (requires authentication)

**Key Features:**
- Supports TWO modes:
  1. Query param mode: `?data=...` (for PDF generation)
  2. Route param mode: `[appointment_id]` (for preview)
- Fetches data via server action when using route param
- Same rendering logic as PDF template

**Data Loading Logic:**
```typescript
useEffect(() => {
  // Mode 1: Query params (PDF generation)
  const dataParam = searchParams.get("data");
  if (dataParam) {
    // Parse and use data from URL
    return;
  }
  
  // Mode 2: Route params (Preview)
  if (appointment_id) {
    // Fetch via server action
    const result = await getVisitDocumentDataAction(BigInt(appointmentId));
    setData(result.data);
  }
}, [searchParams, appointment_id]);
```

---

## Document Component

### File: `src/components/documents/visit-document.tsx`

**Purpose**: Renders the actual visit document with branding

**Component Structure:**

```typescript
export function VisitDocument({ data }: Props) {
  // State for branding data
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string>(...);
  const [collegiateNumber, setCollegiateNumber] = useState<string>("");
  const [accountType, setAccountType] = useState<string | null>(null);
  const [taxId, setTaxId] = useState<string>("");
  const [offices, setOffices] = useState<Array<...>>([]);
  const [website, setWebsite] = useState<string>("");
  
  // Fetch branding data on mount
  useEffect(() => {
    const fetchBrandData = async () => {
      // Only runs if user is authenticated (has session)
      if (session?.user?.id) {
        const userAccountId = await getCurrentUserAccountIdAction();
        
        // Fetch logo
        const brandAsset = await getBrandAsset(accountIdStr);
        if (brandAsset?.logoTransparentUrl) {
          setBrandLogo(brandAsset.logoTransparentUrl);
        }
        
        // Fetch agent info
        const agentNameResult = await getAgentNameAction(BigInt(userAccountId));
        // ... update state
        
        // Fetch office info
        const officeInfoResult = await getOfficeInfoAction(BigInt(userAccountId));
        // ... update state
      }
    };
    
    void fetchBrandData();
  }, [session?.user?.id]);
  
  // Render document sections
  return (
    <div className="visit-document ...">
      {/* Header with logos */}
      {/* Agency info */}
      {/* Visit details */}
      {/* Notes */}
      {/* GDPR section */}
      {/* Signatures */}
    </div>
  );
}
```

**Important Notes:**

1. **Branding Fetching**: Only happens when `session?.user?.id` exists
   - For PDF generation: Puppeteer runs without session, so branding won't load
   - **Solution**: Logo should be passed in the data parameter, or fetched server-side

2. **Agent Name Logic**: 
   - If `accountType === "person"`: Use fetched agent name
   - If `accountType === "company"`: Use agent name from appointment data

3. **Signature Display**: 
   - Shows images if URLs are provided
   - Shows placeholder lines if no signatures

---

## Error Handling

### API Route Error Handling

```typescript
try {
  // ... PDF generation logic
} catch (error) {
  console.error("❌ Visit PDF generation failed:", error);
  return NextResponse.json(
    {
      error: "Failed to generate PDF",
      details: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 },
  );
}
```

### Client-Side Error Handling

```typescript
const handleGeneratePdf = async () => {
  try {
    const response = await fetch("/api/visita/generate-pdf", ...);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error ?? "Error al generar el PDF");
    }
    
    // ... download logic
  } catch (error) {
    toast.error(`Error: ${error.message}`);
  }
};
```

### Common Error Scenarios

1. **"Visit document container not found"**
   - **Cause**: Template page didn't render or wrong selector
   - **Debug**: Check Puppeteer logs, verify `.visit-document` class exists
   - **Fix**: Increase timeout or check template rendering

2. **"No authenticated user session found"**
   - **Cause**: API route trying to fetch data without auth
   - **Debug**: Check if cookies are being passed to API route
   - **Fix**: Ensure API route has access to request cookies

3. **"Image loading timeout"**
   - **Cause**: External images (logos, signatures) taking too long
   - **Debug**: Check network tab, verify image URLs are accessible
   - **Fix**: Increase timeout or use local images

4. **"Failed to parse visit data"**
   - **Cause**: Invalid JSON in query parameter
   - **Debug**: Check URL encoding, verify data structure
   - **Fix**: Ensure proper JSON serialization/deserialization

---

## Debugging Guide

### 1. Enable Puppeteer Debugging

Add to API route:
```typescript
const browser = await puppeteer.launch({
  headless: true,
  // Add this for debugging
  devtools: false, // Set to true to see browser
  args: [
    // ... existing args
    '--remote-debugging-port=9222', // Enable remote debugging
  ],
});
```

### 2. Log Template URL

```typescript
console.log("📄 Template URL:", templateUrl.toString());
// Manually visit this URL in browser to see what Puppeteer sees
```

### 3. Capture Screenshot Before PDF

```typescript
// Before page.pdf()
await page.screenshot({
  path: `debug-${Date.now()}.png`,
  fullPage: true,
});
```

### 4. Check Ready Signal

```typescript
// In template page
useEffect(() => {
  if (data) {
    console.log("✅ Visit document ready, setting signal");
    (window as any).visitDocumentReady = true;
  }
}, [data]);

// In API route
const ready = await page.evaluate(() => {
  return (window as any).visitDocumentReady;
});
console.log("Ready signal:", ready);
```

### 5. Inspect Page Content

```typescript
// Get page HTML
const html = await page.content();
console.log("Page HTML length:", html.length);

// Check for specific elements
const hasDocument = await page.evaluate(() => {
  return !!document.querySelector('.visit-document');
});
console.log("Has .visit-document:", hasDocument);
```

### 6. Check Image Loading

```typescript
// Wait and check images
const imageStatus = await page.evaluate(() => {
  const images = Array.from(document.querySelectorAll("img"));
  return images.map(img => ({
    src: img.src,
    complete: img.complete,
    naturalWidth: img.naturalWidth,
  }));
});
console.log("Image status:", imageStatus);
```

### 7. Monitor Network Requests

```typescript
page.on('request', request => {
  console.log('→', request.method(), request.url());
});

page.on('response', response => {
  console.log('←', response.status(), response.url());
});
```

### 8. Test Template Page Directly

1. Generate the URL with data:
   ```typescript
   const testUrl = `/templates/visita?data=${encodeURIComponent(JSON.stringify(testData))}`;
   console.log("Test URL:", testUrl);
   ```

2. Open in browser to verify rendering

3. Check browser console for errors

### 9. Verify Data Structure

```typescript
// In API route, before serialization
console.log("Visit data structure:", JSON.stringify(visitData, null, 2));

// In template page, after parsing
console.log("Parsed data structure:", JSON.stringify(parsedData, null, 2));
```

### 10. Check PDF Generation Settings

```typescript
// Log PDF settings
console.log("PDF settings:", {
  format: "A4",
  landscape: false,
  printBackground: true,
  margin: { top: "5mm", bottom: "10mm", right: "0mm", left: "0mm" },
});

// Check actual PDF size
const pdfBuffer = await page.pdf(...);
console.log("PDF buffer size:", pdfBuffer.length, "bytes");
```

---

## Comparison with Nota-Encargo

### Similarities

| Feature | Nota-Encargo | Visit Document |
|---------|--------------|----------------|
| PDF Generation | Puppeteer | Puppeteer |
| Template Route | `/templates/nota-encargo` | `/templates/visita` |
| Data Passing | Query params | Query params |
| Authentication | Bypassed via query params | Bypassed via query params |
| Ready Signal | `window.notaEncargoReady` | `window.visitDocumentReady` |
| A4 Format | Yes | Yes |
| Print Styles | styled-jsx | styled-jsx |

### Differences

| Aspect | Nota-Encargo | Visit Document |
|--------|--------------|----------------|
| Data Source | Pre-formatted data passed from client | Fetched server-side in API route |
| Preview Route | None (only PDF) | `/templates/visita/[id]` (with auth) |
| Branding | Logo passed in data | Fetched client-side (may not work in PDF) |
| Dynamic Data | Minimal | Appointment details, signatures |
| Date Handling | String dates | Date objects converted to/from ISO |

### Key Architectural Difference

**Nota-Encargo:**
- Client prepares all data → Sends to API → API adds logo → Passes to template
- Simpler flow, but client needs to know all data structure

**Visit Document:**
- Client sends appointment ID → API fetches data → Passes to template
- More secure, server handles data fetching
- But branding may not load in PDF (no session in Puppeteer)

---

## Troubleshooting Checklist

### PDF Generation Fails

- [ ] Check API route logs for errors
- [ ] Verify appointment ID is valid
- [ ] Check if `getVisitDocumentDataAction` succeeds
- [ ] Verify template URL is accessible
- [ ] Check Puppeteer can launch (headless Chrome installed)
- [ ] Verify `.visit-document` selector exists
- [ ] Check image URLs are accessible
- [ ] Verify ready signal is set

### PDF is Empty/Blank

- [ ] Check if template page renders correctly
- [ ] Verify data is being passed correctly
- [ ] Check for JavaScript errors in template
- [ ] Verify CSS is loading
- [ ] Check PDF generation settings (margins, format)

### PDF Missing Logos/Branding

- [ ] Check if branding URLs are accessible
- [ ] Verify images load in browser preview
- [ ] Check Puppeteer image loading timeout
- [ ] Consider passing logo URLs in data parameter
- [ ] Check CORS settings for image URLs

### Preview Page Doesn't Load

- [ ] Verify user is authenticated
- [ ] Check `getVisitDocumentDataAction` permissions
- [ ] Verify appointment belongs to user
- [ ] Check browser console for errors
- [ ] Verify route params are correct

### Date/Time Issues

- [ ] Verify Date objects are serialized to ISO strings
- [ ] Check timezone handling
- [ ] Verify date parsing in template
- [ ] Check date format in document display

---

## Performance Considerations

### Puppeteer Optimization

1. **Browser Reuse**: Consider reusing browser instance (not implemented)
2. **Timeout Values**: Balance between reliability and speed
3. **Image Loading**: External images can slow down generation
4. **Viewport Size**: A4 dimensions (794×1123) are optimal for PDF

### Data Serialization

- Large JSON in URL: Consider URL length limits (usually 2KB-8KB)
- If data is too large, consider:
  - Using POST to template (not recommended)
  - Storing data temporarily and passing ID
  - Compressing JSON

### Caching

- Template pages could be cached (currently not implemented)
- Branding data could be cached (currently fetched each time)

---

## Security Considerations

1. **URL Data Exposure**: Data in URL query parameters is visible
   - **Mitigation**: URLs are temporary, PDF generation is fast
   - **Future**: Consider temporary tokens instead

2. **Authentication**: API route must verify user owns the appointment
   - **Current**: `getVisitDocumentDataAction` checks permissions
   - **Verify**: Ensure proper access control in server actions

3. **Rate Limiting**: No rate limiting on PDF generation
   - **Consider**: Add rate limiting to prevent abuse

4. **File Size**: Large PDFs could cause memory issues
   - **Current**: A4 format limits size
   - **Monitor**: PDF buffer size

---

## Future Improvements

1. **Branding in PDF**: Pass logo URLs in data parameter instead of fetching
2. **Browser Pooling**: Reuse Puppeteer browser instances
3. **Caching**: Cache rendered templates
4. **Streaming**: Stream PDF generation for large documents
5. **Error Recovery**: Retry logic for transient failures
6. **Progress Tracking**: WebSocket updates for long-running generations
7. **Batch Generation**: Generate multiple PDFs in parallel

---

## What Happens When Puppeteer Launches?

### Technical Deep Dive

When you call `puppeteer.launch()`, here's exactly what happens:

#### 1. Browser Binary Detection

Puppeteer automatically downloads and manages a **Chromium** browser binary (Chrome's open-source version). On first install, it downloads:
- **Chromium browser** (~170MB) to `node_modules/.cache/puppeteer/chromium/`
- Platform-specific version (Linux, macOS, Windows)
- Includes all Chrome rendering engine, V8 JavaScript engine, Blink layout engine

#### 2. Process Creation

```typescript
const browser = await puppeteer.launch({
  headless: true,  // ← Key setting
  args: [...],     // ← Chrome command-line flags
});
```

**What actually happens:**
1. Puppeteer spawns a new **Chromium process** (not a visible window)
2. Launches Chromium with special flags via command line:
   ```bash
   /path/to/chromium \
     --headless \
     --no-sandbox \
     --disable-setuid-sandbox \
     --disable-dev-shm-usage \
     --remote-debugging-port=0 \
     ...
   ```
3. Chromium starts a **remote debugging server** (usually on random port)
4. Puppeteer connects to this server via **Chrome DevTools Protocol (CDP)**
5. Returns a `Browser` object that controls the Chromium instance

#### 3. Headless Mode Explained

**`headless: true`** means:
- **No GUI**: No visible browser window (runs in background)
- **Same Engine**: Still uses full Chromium rendering engine
- **Faster**: No need to render UI, slightly faster
- **Server-Friendly**: Can run on servers without display

**`headless: false`** (for debugging):
- Opens actual browser window you can see
- Useful for debugging: `headless: false, devtools: true`

#### 4. Chrome DevTools Protocol (CDP)

Puppeteer communicates with Chromium via **CDP** - the same protocol Chrome DevTools uses:

```
┌─────────────┐                    ┌──────────────┐
│   Node.js   │                    │   Chromium    │
│  (Puppeteer)│◄─── CDP (WebSocket)──►│   Process     │
│             │                    │              │
└─────────────┘                    └──────────────┘
     │                                     │
     │  Commands:                          │
     │  - navigate(url)                    │
     │  - waitForSelector()                │
     │  - evaluate()                       │
     │  - pdf()                            │
     │                                     │
     │  Events:                             │
     │  ◄── DOMContentLoaded               │
     │  ◄── load                           │
     │  ◄── networkIdle                    │
```

**Example CDP Messages:**
```json
// Puppeteer sends:
{
  "method": "Page.navigate",
  "params": { "url": "http://localhost:3000/templates/visita?data=..." }
}

// Chromium responds:
{
  "result": { "frameId": "123.1" }
}

// Chromium sends event:
{
  "method": "Page.frameNavigated",
  "params": { "frame": { "id": "123.1", "url": "..." } }
}
```

#### 5. Page Creation

```typescript
const page = await browser.newPage();
```

**What happens:**
1. Puppeteer sends CDP command: `Target.createTarget({ url: "about:blank" })`
2. Chromium creates a new **tab/page** (like opening a new tab in Chrome)
3. Returns a `Page` object representing that tab
4. You can create multiple pages: `const page2 = await browser.newPage()`

#### 6. Navigation

```typescript
await page.goto("http://localhost:3000/templates/visita?data=...");
```

**What happens:**
1. Puppeteer sends: `Page.navigate({ url: "..." })`
2. Chromium:
   - Parses URL
   - Makes HTTP request (like normal browser)
   - Receives HTML response
   - Parses HTML
   - Downloads CSS, JS, images
   - Executes JavaScript
   - Renders page
3. Puppeteer waits for events:
   - `DOMContentLoaded` - HTML parsed
   - `load` - All resources loaded
   - `networkIdle0` - No network requests for 500ms

#### 7. PDF Generation

```typescript
const pdfBuffer = await page.pdf({ format: "A4", ... });
```

**What happens:**
1. Puppeteer sends: `Page.printToPDF({ ... })`
2. Chromium:
   - Applies print CSS (`@media print`)
   - Renders page to print layout (A4 dimensions)
   - Converts to PDF using Chromium's built-in PDF renderer
   - Returns PDF binary data
3. Puppeteer receives PDF buffer
4. We convert to `Uint8Array` for Next.js response

#### 8. Browser Cleanup

```typescript
await browser.close();
```

**What happens:**
1. Puppeteer sends: `Browser.close()` or `Target.closeTarget()`
2. Chromium process terminates
3. All resources freed (memory, network connections)

### Visual Representation

```
┌─────────────────────────────────────────────────────────┐
│                    Node.js Process                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Your API Route (Next.js)                  │  │
│  │  const browser = await puppeteer.launch()         │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                                 │
│                         │ spawns & controls via CDP      │
│                         ▼                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Chromium Process (separate)                │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Remote Debugging Server (CDP)              │  │  │
│  │  │  Port: Random (e.g., 9222)                 │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Rendering Engine (Blink)                   │  │  │
│  │  │  - HTML Parser                               │  │  │
│  │  │  - CSS Engine                                │  │  │
│  │  │  - JavaScript Engine (V8)                    │  │  │
│  │  │  - Layout Engine                             │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Page/Tab (invisible, headless)             │  │  │
│  │  │  - DOM Tree                                 │  │  │
│  │  │  - Render Tree                              │  │  │
│  │  │  - Network Requests                         │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Command-Line Flags Explained

```typescript
args: [
  "--no-sandbox",                    // Disable Chrome sandbox (needed in Docker/servers)
  "--disable-setuid-sandbox",        // Disable setuid sandbox (security workaround)
  "--disable-dev-shm-usage",         // Use /tmp instead of /dev/shm (Docker memory issues)
  "--disable-accelerated-2d-canvas", // Disable GPU acceleration (server environments)
  "--disable-gpu",                   // Disable GPU (not needed in headless)
  "--window-size=1920,1080",         // Set window size (affects viewport)
  "--disable-blink-features=AutomationControlled", // Hide automation detection
]
```

### Process Lifecycle

```
1. API Request Received
   └─> Node.js process

2. puppeteer.launch()
   └─> Spawn Chromium process (separate OS process)
   └─> Chromium starts, opens CDP server
   └─> Puppeteer connects via WebSocket
   └─> Returns Browser object

3. browser.newPage()
   └─> Creates new tab in Chromium
   └─> Returns Page object

4. page.goto(url)
   └─> Chromium navigates to URL
   └─> Loads HTML, CSS, JS
   └─> Renders page (invisible)
   └─> Waits for network idle

5. page.pdf()
   └─> Chromium renders to print layout
   └─> Converts to PDF
   └─> Returns PDF buffer

6. browser.close()
   └─> Terminates Chromium process
   └─> Frees all resources
```

### Resource Usage

**Memory:**
- Chromium process: ~100-200MB per instance
- Each page: ~50-100MB additional
- Total per PDF: ~150-300MB

**CPU:**
- Initial launch: High (loading Chromium)
- Navigation: Medium (parsing, rendering)
- PDF generation: Medium (layout calculation)

**Time:**
- Browser launch: ~1-2 seconds
- Page navigation: ~2-5 seconds (depends on page complexity)
- PDF generation: ~0.5-1 second
- **Total: ~4-8 seconds per PDF**

### Debugging: See What Puppeteer Sees

You can make Puppeteer visible for debugging:

```typescript
const browser = await puppeteer.launch({
  headless: false,        // ← See the browser window
  devtools: true,         // ← Open DevTools automatically
  slowMo: 250,           // ← Slow down operations (250ms delay)
  args: [
    '--remote-debugging-port=9222', // Enable remote debugging
  ],
});
```

Then you can:
1. See the browser window open
2. Watch it navigate and render
3. Use Chrome DevTools in another browser: `chrome://inspect`
4. Inspect the page, check console, network, etc.

### Key Takeaways

1. **Real Chrome**: Puppeteer uses actual Chromium (not a simulation)
2. **Separate Process**: Chromium runs in a separate OS process
3. **CDP Communication**: Puppeteer controls Chromium via Chrome DevTools Protocol
4. **Headless = Invisible**: Runs in background, no GUI needed
5. **Full Rendering**: Uses complete browser engine (HTML, CSS, JS all work)
6. **Resource Intensive**: Each browser instance uses significant memory/CPU
7. **Temporary**: Browser is created, used, then destroyed per request

---

## Summary

The visit document PDF generation system uses a **server-side Puppeteer** approach with **authentication bypass via query parameters**. The architecture separates concerns:

- **API Route**: Handles authentication and data fetching
- **Template Page**: Handles rendering (no auth needed)
- **Document Component**: Handles branding and display

This pattern allows Puppeteer to generate PDFs without authentication while maintaining security through server-side data fetching.

**Puppeteer Launch Summary:**
- Spawns a real Chromium browser process
- Controls it via Chrome DevTools Protocol (CDP)
- Runs headless (no visible window)
- Renders pages exactly like a real browser
- Converts rendered pages to PDF
- Terminates browser when done

---

## Vercel Deployment Changes

### Problem
Puppeteer doesn't work out-of-the-box on Vercel's serverless functions because:
- Serverless functions have size limits (~50MB uncompressed)
- Full Chromium binary (~170MB) exceeds these limits
- Serverless functions have different execution constraints

### Solution
Implemented **environment-aware Puppeteer configuration** that automatically detects the deployment environment and uses the appropriate setup:

**For Vercel (Serverless):**
- Uses `puppeteer-core` (lightweight, no bundled Chromium)
- Uses `@sparticuz/chromium-min` (serverless-optimized Chromium binary)
- Automatically configured with correct args and executable path

**For Local Development:**
- Uses regular `puppeteer` (includes full Chromium binary)
- Uses standard launch configuration

### Files Changed

#### 1. `package.json`
Added new dependencies:
```json
{
  "dependencies": {
    "puppeteer": "^24.16.0",           // For local dev
    "puppeteer-core": "^24.16.0",      // For Vercel
    "@sparticuz/chromium-min": "^131.0.0"  // Serverless Chromium
  }
}
```

#### 2. `next.config.js`
Added external packages configuration:
```javascript
experimental: {
  serverComponentsExternalPackages: [
    "@sparticuz/chromium-min",
    "puppeteer-core",
  ],
}
```

#### 3. `src/lib/puppeteer-utils.ts` (NEW)
Created shared utility function that detects environment:
```typescript
export async function getPuppeteerConfig(): Promise<PuppeteerConfig> {
  const isServerless = process.env.VERCEL === "1" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  if (isServerless) {
    // Use puppeteer-core + @sparticuz/chromium-min
  } else {
    // Use regular puppeteer
  }
}
```

#### 4. Updated API Routes
All three PDF generation routes now use the shared utility:
- `src/app/api/visita/generate-pdf/route.ts`
- `src/app/api/nota-encargo/generate-pdf/route.ts`
- `src/app/api/puppet/generate-pdf/route.ts`

**Before:**
```typescript
import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ /* hardcoded args */ });
```

**After:**
```typescript
import { getPuppeteerConfig } from "~/lib/puppeteer-utils";
const { puppeteer, launchOptions } = await getPuppeteerConfig();
const browser = await puppeteer.launch(launchOptions);
```

### How It Works

1. **Environment Detection**: Checks for `process.env.VERCEL === "1"` or AWS Lambda environment variables
2. **Dynamic Import**: Loads appropriate Puppeteer package based on environment
3. **Automatic Configuration**: 
   - Vercel: Uses pre-configured Chromium args and executable path
   - Local: Uses standard Puppeteer with full Chromium binary
4. **Transparent**: Same API usage across all routes, no code changes needed in route handlers

### Benefits

✅ **Works on Vercel**: PDF generation now works in serverless environment  
✅ **Works Locally**: Maintains full functionality for local development  
✅ **No Code Changes**: Existing route handlers work unchanged  
✅ **Centralized**: Single utility function for all PDF routes  
✅ **Maintainable**: Easy to update configuration in one place  

### Deployment Steps

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Deploy to Vercel:
   ```bash
   vercel deploy
   ```

3. No additional configuration needed - environment detection is automatic!

### Testing

- **Local**: Should use regular `puppeteer` (full Chromium)
- **Vercel**: Should use `puppeteer-core` + `@sparticuz/chromium-min`

Check logs for environment indicator:
```
🌐 Using Puppeteer: Vercel (serverless)  // On Vercel
🌐 Using Puppeteer: Local                 // Local dev
```

### Notes

- The `@sparticuz/chromium-min` package is specifically optimized for serverless environments
- It's a stripped-down version of Chromium (~50MB vs ~170MB)
- All functionality remains the same for PDF generation
- Function timeout limits on Vercel (10s free, 60s pro) still apply

