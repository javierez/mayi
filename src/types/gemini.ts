import type { PropertyImage } from "~/lib/data";

export interface GeminiRenovationRequest {
  imageUrl: string;
  propertyId: bigint;
  referenceNumber: string;
  imageOrder: number;
  renovationType?: RenovationType;
}

export interface TokenUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface GeminiRenovationResponse {
  success: boolean;
  renovatedImageBase64?: string;
  error?: string;
  tokenUsage?: TokenUsage;
}

export interface GeminiTaskStatus {
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  renovatedImageBase64?: string;
  error?: string;
}

// Renovation types for different room prompts - 8 specific room types
export type RenovationType =
  | "living_room"
  | "bedroom"
  | "bathroom"
  | "entrance_hall"
  | "terrace"
  | "balcony"
  | "kitchen"
  | "dining_room";

// Room detection interface
export interface RoomDetectionResponse {
  success: boolean;
  roomType?: RenovationType;
  confidence?: number; // 0-1 score
  error?: string;
}

// Room detection request
export interface RoomDetectionRequest {
  imageBase64: string;
}

// NOTE: Old RENOVATION_PROMPTS removed - we use ROOM_ASSEMBLY_PROMPTS instead (see line 323)

// Room detection prompt for Gemini
export const ROOM_DETECTION_PROMPT = `
Analyze this image and identify the type of room. You must respond with EXACTLY one of these room types:
- living_room
- bedroom
- bathroom
- entrance_hall
- terrace
- balcony
- kitchen
- dining_room

Based on the furniture, fixtures, and architectural elements visible in the image, determine which room type this is.

Key indicators:
- KITCHEN: Cabinets, countertops, stove, refrigerator, sink
- BATHROOM: Toilet, shower/bathtub, sink/vanity, bathroom fixtures
- BEDROOM: Bed, nightstands, dressers, bedroom furniture
- LIVING_ROOM: Sofas, coffee tables, TV area, living/sitting furniture
- DINING_ROOM: Dining table, dining chairs, dedicated eating area
- ENTRANCE_HALL: Entry area, coat storage, console tables, foyer space
- TERRACE: Outdoor covered area, often with outdoor furniture
- BALCONY: Small outdoor area attached to building, usually with railings

Respond with only the room type (e.g., "kitchen" or "living_room"). If unclear, choose the most likely room type based on dominant features.
`;

// Prompt for removing all objects from bedroom (first pass for bedrooms)
export const BEDROOM_OBJECT_REMOVAL_PROMPT = `Bedroom Object Removal — Structural Preservation

MANDATORY STRUCTURAL PRESERVATION: Keep wall positions EXACTLY as shown — do not move, resize, or reposition walls. Keep floor boundaries and floor plan layout IDENTICAL — floor area shape and dimensions must match the original. CRITICAL: Corner pixels (wall-wall and floor-wall intersections) must remain in the SAME exact pixel positions. Keep door and window openings at EXACT positions — same size, same location, same shape. Keep ceiling height UNCHANGED. Keep camera perspective IDENTICAL — same viewing angle, same position, same spatial relationships.

REMOVE ALL OBJECTS: Remove all furniture (beds, nightstands, dressers, wardrobes, chairs, tables), all decor (art, photos, plants, rugs, curtains, lamps), all personal items, and all movable objects. Leave only the empty room structure: walls, floor, ceiling, doors, and fixed architectural elements. CRITICAL: Only preserve windows that already exist in the original image — do NOT create windows if the original has none.

Keep the room completely empty but preserve all structural geometry exactly as shown. Only remove objects, do not modify the room structure, dimensions, or perspective. Do NOT add windows if the original image has no windows.

Camera: wide-angle shot with soft professional lighting. Style: photorealistic, 4K. Exclude: all furniture, all decor, all objects, people, text overlays, clutter, windows (if original has none).`;

// Prompt for blurring all faces in the image
export const BLUR_FACES_PROMPT = `Investigate the entire picture carefully and blur every face you find for privacy protection.

Search the whole image including:
- People in the room
- Faces in photographs or pictures on walls
- Faces in artwork, posters, or decorative items
- Any other faces visible anywhere in the image

Apply a smooth, natural blur to the ENTIRE FACE (not just eyes) - blur the complete face area including eyes, nose, mouth, cheeks, chin, and all facial features. Make the entire face unrecognizable while keeping everything else in the image exactly as shown.`;

// Prompt for removing all clutter and non-furniture items
export const REMOVE_CLUTTER_PROMPT = `Remove ALL items from this image EXCEPT furniture and structural elements.

KEEP ONLY:
- Furniture (sofas, chairs, tables, beds, cabinets, desks, etc.)
- Structural elements (walls, floors, ceilings, doors, windows, built-in fixtures)
- Permanent fixtures (lighting, rugs, carpets, curtains, blinds)

REMOVE EVERYTHING ELSE:
- ALL items on top of tables, desks, surfaces, and furniture (decorative objects, papers, books, electronics, dishes, etc.)
- Personal items (clothing, bags, shoes, accessories)
- Decorative objects and knick-knacks
- Boxes, containers, storage items
- Papers, documents, books (unless part of furniture like bookshelves)
- Electronics and cables (unless built-in)
- Food items, dishes, kitchenware (unless permanent fixtures)
- Toys, games, trash, temporary items
- Any other movable or temporary items

CRITICAL:
- Remove ALL items on top of tables, desks, and any surfaces
- Keep furniture surfaces clean and empty
- Keep room structure, walls, floors, and geometry exactly as shown
- Seamlessly fill removed areas with background (floor/wall/surface)
- Do NOT leave empty spaces or holes
- Do NOT add new items or modify furniture
- Do NOT change camera angle or room dimensions
- Only remove clutter and fill spaces naturally`;

// Prompt for enhancing lighting in real estate photos
export const ENHANCE_LIGHTING_PROMPT = `You are a professional real estate photographer using advanced HDR and exposure blending techniques. Transform this image to create a DRAMATICALLY brighter, naturally lit space that looks like it was photographed at noon on a bright, sunny day.

CRITICAL VISUAL TRANSFORMATION REQUIRED:
The enhanced image must be VISIBLY and DRAMATICALLY brighter than the original. The difference should be immediately obvious - like comparing a photo taken at dusk versus midday.

STEP 1: WINDOW LIGHT MAXIMIZATION (Highest Priority - Do This First):
- CRITICAL ANTI-FLARE REQUIREMENT: Windows must look REALISTIC and NATURAL - NO lens flares, NO glare artifacts, NO unrealistic bright spots
- If windows exist: Increase window brightness naturally - make them bright but REALISTIC, like real windows on a sunny day
- Windows should appear bright but maintain realistic appearance - like actual windows with natural daylight coming through
- Apply natural brightness: Make windows bright enough to illuminate the room, but keep them looking like REAL windows, not artificial light sources
- Use HDR-like processing: Blend exposures to brighten windows while preserving realistic detail and appearance
- Windows should be the primary light source but must look NATURAL and REALISTIC
- ABSOLUTELY FORBIDDEN: NO lens flares, NO glare artifacts, NO unrealistic bright spots, NO overexposed white areas on windows
- Remove ALL flares: Eliminate any lens flare effects, glare patterns, or unrealistic bright artifacts on or around windows
- Keep windows realistic: Windows should look like actual windows with daylight - bright but natural, not artificial or glowing unnaturally
- Prevent unrealistic brightness: Avoid making windows appear as pure white light sources - maintain realistic window appearance
- Natural light only: Light should come THROUGH windows naturally, not create flares or unrealistic effects ON the windows

STEP 2: NATURAL LIGHT DISTRIBUTION (Fill Every Corner):
- Use tone mapping to make natural light from windows reach EVERY dark corner
- Create visible light falloff: Bright near windows, gradually spreading but still bright throughout
- Simulate light bouncing: Make walls, floors, and ceilings reflect and amplify natural light
- Apply exposure blending: Combine bright window exposure with properly exposed interior
- Every surface should appear illuminated by natural light - no dark zones remaining
- Use fill light technique: Simulate natural light bouncing to eliminate all shadows

STEP 3: EXPOSURE ENHANCEMENT (Professional HDR Technique):
- Increase overall exposure by 50-70% using exposure blending and tone mapping
- Lift shadows aggressively: Use shadow recovery to brighten dark areas by 60-80%
- Preserve highlights: Keep window areas bright but maintain detail in bright surfaces - AVOID overexposure and blown highlights
- Apply global brightness boost: Make the entire image 2-3 stops brighter overall
- Use graduated exposure: Brightest at windows, gradually decreasing but still bright everywhere
- Result should look like professional HDR photography with perfect exposure balance
- CRITICAL: Prevent glare and harsh reflections (destellos) - maintain controlled brightness without harsh white spots
- Avoid lens flare artifacts: Remove or minimize any lens flare effects that create distracting bright spots

STEP 4: SHADOW ELIMINATION (Natural Light Fill):
- Eliminate ALL harsh shadows using natural light fill technique
- Fill shadows with simulated bounced natural light from windows
- Reduce shadow density by 80-90% - shadows should be barely visible, just subtle depth cues
- Use shadow lifting: Brighten all shadow areas to match midtone brightness
- Dark corners must become bright - fill them with visible natural light
- Maintain only subtle, soft shadows for depth - no dark, harsh shadows

STEP 5: COLOR AND ATMOSPHERE (Daylight Quality):
- Apply daylight white balance: Use 5500K-6500K color temperature throughout
- Make colors vibrant and fresh: Enhance saturation slightly to compensate for brightness increase
- Create bright, airy atmosphere: Space should feel like a bright, sunny day
- Natural light should have crisp, clean, energizing quality
- Avoid warm tones - prioritize cool, bright daylight tones
- Make the space feel fresh, open, and naturally illuminated

STEP 6: VISUAL IMPACT ENHANCEMENTS:
- Create natural light rays: Add subtle, realistic light rays streaming through windows - but keep them NATURAL, not dramatic flares
- Enhance light reflections: Make surfaces reflect natural light visibly (floors, furniture, walls) - but keep reflections soft and natural
- Create light gradients: Brightest at windows, gradually spreading but maintaining brightness
- Add atmospheric brightness: Make the air itself appear brighter, as if filled with daylight
- Enhance contrast in bright areas: Make well-lit areas pop with natural brightness
- ABSOLUTELY CRITICAL: ELIMINATE ALL FLARES - Remove ALL lens flares, glare artifacts, and unrealistic bright spots, especially on windows
- Windows must look REALISTIC: No flares, no glare patterns, no unrealistic bright effects - windows should look like real windows
- Prevent overexposed areas: Avoid pure white, blown-out highlights that lose detail and create glare
- Soften reflections: Make reflections on glass, mirrors, and shiny surfaces natural and pleasant, not harsh or distracting
- NO artificial effects: Do not add any lens flare effects, glare patterns, or unrealistic bright artifacts - keep everything natural

SECONDARY ENHANCEMENTS (Minimal, Only If Needed):
- Existing artificial lights: Keep them subtle and secondary - natural light must dominate
- Add fixtures ONLY in windowless areas: Minimal, realistic fixtures that don't compete with natural light
- All artificial lighting should be barely noticeable compared to natural light

ABSOLUTE PRESERVATION (Do NOT Change):
- EXACT positions: All objects, furniture, walls, decor stay in identical positions
- NO color changes: Wall colors, furniture colors, flooring colors remain EXACTLY as shown
- NO structural changes: Room dimensions, camera angle, perspective stay identical
- NO architectural changes: Do not add/remove windows, doors, or structural elements
- ONLY modify: Lighting intensity, exposure, brightness, shadows, and natural light amplification

TECHNICAL PHOTOGRAPHY REQUIREMENTS:
- Apply professional HDR technique: Multiple exposure blending for perfect brightness
- Use tone mapping: Compress dynamic range while maximizing brightness
- Apply shadow recovery: Aggressively lift all dark areas
- Use highlight preservation: Keep bright areas bright but maintain detail - AVOID overexposure and glare
- ABSOLUTELY CRITICAL: ELIMINATE ALL FLARES - Remove ALL lens flares, glare artifacts, and unrealistic bright spots
- Windows must be realistic: No flares, no glare patterns, no unrealistic effects - windows should look like real windows
- Prevent glare and harsh reflections (destellos): Remove or soften any bright, distracting white spots
- Control highlight clipping: Maintain detail in bright areas without creating harsh glare or blown highlights
- Remove flare effects: Actively remove any lens flare artifacts, glare patterns, or unrealistic bright spots, especially on windows
- Result must look like professional real estate photography with perfect natural lighting
- Image should appear as if photographed with professional HDR equipment at midday
- NO harsh glare, NO lens flares, NO overexposed white spots - brightness must be controlled and natural
- Windows must look REALISTIC - like actual windows with natural daylight, not artificial light sources with flares

VISUAL OUTCOME REQUIREMENTS:
The enhanced image must show DRAMATIC VISUAL IMPROVEMENT:
✓ Windows appear bright and natural-looking (realistic brightness increase)
✓ Natural light rays streaming through windows (subtle and realistic, NOT flares)
✓ Overall image 50-70% brighter than original
✓ All shadows dramatically reduced or eliminated (80-90% reduction)
✓ Every corner bright and well-lit by natural light
✓ Space feels like bright, sunny day at noon
✓ Professional HDR photography appearance
✓ Natural light is the obvious, dominant illumination source
✓ ABSOLUTELY NO lens flares, NO glare artifacts, NO unrealistic bright spots on windows
✓ Windows look REALISTIC - like actual windows with natural daylight, not artificial light sources
✓ NO harsh reflections on glass or shiny surfaces - all reflections are soft and pleasant

Return an image that is DRAMATICALLY brighter with maximized natural lighting. Windows should be bright enough to illuminate the room but MUST look REALISTIC - like actual windows with natural daylight coming through. ABSOLUTELY CRITICAL: Remove ALL lens flares, glare artifacts, and unrealistic bright spots on windows. Windows must look like real windows, not artificial light sources with flares. The space should look like professional HDR photography taken at midday - bright, airy, and naturally sunlit. The difference from the original must be immediately and dramatically visible, but windows must remain realistic and natural-looking with NO flares or unrealistic effects.`;

// Style instruction sets for different aesthetics - condensed narrative format
export const RENOVATION_STYLES = {
  default: `Scandinavian Nordic aesthetic: pure white walls (Benjamin Moore Simply White), soft off-whites, light pine or birch accent walls, white-painted trim. Light oak or ash hardwood floors in natural matte finish, white/light gray ceramic tiles, natural jute or wool rugs. Furniture in light gray linen or white cotton, light wood tables (oak, birch), Windsor or wishbone chairs, natural textiles. Simple pendant lights in white/wood/brass, ceramic table lamps with linen shades, tripod floor lamps. Transform all wall colors completely - no wall remains the same as original.`,

  mediterranean: `Mediterranean coastal aesthetic: warm white and cream walls, soft terracotta or sage green accents, lime plaster or stucco textures, natural limestone or travertine stone accents, arched openings with decorative moldings. Terracotta or earth-tone ceramic tiles, distressed oak or chestnut hardwood, tumbled marble or slate stone floors, Persian or kilim rugs in warm earth tones. Furniture in warm linen/cotton fabrics, dark wood tables (walnut, mahogany) with carved details, wrought iron bases, rich upholstery. Wrought iron chandeliers with candle-style bulbs, ceramic pendant lights, lantern-style fixtures, warm ambient lighting. Transform all wall colors completely - no wall remains the same as original.`,

  industrial: `Modern industrial aesthetic: exposed red or painted charcoal brick walls, charcoal gray or deep black paint, concrete or metal panel accents, reclaimed wood accent walls, minimal metal trim with exposed structural elements. Polished or stained concrete floors in gray tones, reclaimed or distressed dark wood, steel plate accents, minimal leather or canvas rugs with geometric patterns. Leather upholstery in brown/black/charcoal, reclaimed wood tables with steel pipe or beam bases, metal chairs, vintage industrial pieces. Edison bulb pendant lights with metal shades, track lighting systems, exposed conduit wiring, tripod floor lamps with metal shades, adjustable task lighting. Transform all wall colors completely - no wall remains the same as original.`,

  transitional: `Transitional contemporary aesthetic: soft neutral walls (greige, warm gray, cream, soft beige), navy blue or sage green accent walls, smooth painted surfaces with classic crown molding, traditional trim profiles in white or matching colors. Medium-toned oak, maple, or hickory hardwood in satin finish, neutral stone-look or wood-look porcelain tiles, traditional carpet patterns in updated colors, contemporary traditional rugs. Traditional silhouettes in updated fabrics, wood tables with classic shapes and cleaner lines, mixed materials, quality woods with mixed metals, linen and cotton fabrics. Updated traditional chandeliers in mixed metals, classic pendant shapes with contemporary finishes, ceramic or metal table lamps with drum or empire shades, layered lighting with dimmer controls. Transform all wall colors completely - no wall remains the same as original.`,
} as const;

export type RenovationStyle = keyof typeof RENOVATION_STYLES;

// NOTE: getRenovationPromptWithStyle removed - we use getAssemblyRenovationPrompt instead (see line 519)

// Settings for Gemini API calls
// Lower temperature improves structural preservation accuracy
// Migrated to Gemini 3 Pro Image Preview (2025-11-21) for enhanced capabilities
export const GEMINI_RENOVATION_SETTINGS = {
  model: "gemini-3-pro-image-preview",
  maxOutputTokens: 8192,
  temperature: 0.95, // Very low temperature for strict structural preservation
} as const;

// Comparison slider state for renovation results
export interface RenovationComparisonState {
  isVisible: boolean;
  originalImage: string;
  renovatedImage: string;
  sliderPosition: number; // 0-100 percentage
}

// Renovation status type for UI components
export type RenovationStatus = "idle" | "processing" | "success" | "error";

// Renovated image data structure
export interface RenovatedImageData {
  originalImageUrl: string;
  renovatedImageUrl: string;
  originalImageId: bigint;
  renovatedPropertyImage?: PropertyImage;
  renovationType?: RenovationType;
}

// Renovation review request
export interface RenovationReviewRequest {
  originalImageBase64: string;
  renovatedImageBase64: string;
  reviewText: string;
}

// Renovation review response
export interface RenovationReviewResponse {
  success: boolean;
  reviewedImageBase64?: string;
  error?: string;
  tokenUsage?: TokenUsage;
}

// Room Assembly Prompt Structure
export interface RoomAssemblyPrompt {
  prompt_name: string;
  base_style: string;
  room_description: string;
  camera_setup: string;
  assembled_elements: string[];
  negative_prompts: string[];
}

// Room assembly prompts organized by style, then by room type
export const ROOM_ASSEMBLY_PROMPTS: Record<
  RenovationStyle,
  Record<RenovationType, RoomAssemblyPrompt>
> = {
  // SCANDINAVIAN STYLE - All 8 room types
  default: {
    living_room: {
      prompt_name: "Scandinavian Living Room",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A large sunlit Scandinavian living room with white walls and light wood floors.",
      camera_setup: "Marketing-quality, wide-angle shot with natural lighting.",
      assembled_elements: [
        "white/beige sofa with white cushions",
        "light wood coffee table",
        "light wood side tables",
        "white table lamps",
        "white/beige floor lamps",
        "light wood TV stand/entertainment unit",
        "light wood bookshelf with white backing",
        "beige/white armchairs",
        "white/cream area rug",
        "white/cream curtains",
        "white/beige throw pillows",
        "beige throw blankets",
        "minimalist white-framed art",
        "simple white/beige decorative objects",
        "potted green plants",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    bedroom: {
      prompt_name: "Scandinavian Bedroom",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A large sunlit Scandinavian bedroom with white walls and light wood floors.",
      camera_setup: "Marketing-quality, wide-angle shot with natural lighting.",
      assembled_elements: [
        "bed with white duvet",
        "beige throw blanket",
        "light wood bedside tables",
        "white bedside lamps",
        "light wood wardrobe",
        "light wood shelves",
        "white/light wood mirror",
        "minimalist white-framed art",
        "white/cream area rug",
        "white/cream curtains",
        "potted green plants",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    kitchen: {
      prompt_name: "Scandinavian Kitchen",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A large sunlit Scandinavian kitchen with white walls and light wood floors.",
      camera_setup: "Marketing-quality, wide-angle shot with natural lighting.",
      assembled_elements: [
        "white Shaker-style kitchen cabinets with finger pulls only (no knobs or handles) - minimal white or brushed brass finger pulls",
        "white quartz or light wood countertops",
        "white subway tile backsplash",
        "light wood kitchen island",
        "white/beige bar stools",
        "white pendant lights",
        "white under-cabinet lighting",
        "white or stainless steel appliances (fridge, stove, oven)",
        "white sink with brushed brass or chrome faucet",
        "white/beige decorative bowls",
        "potted green herbs",
        "light wood cutting boards",
        "white/clear storage containers",
        "white/cream window treatments",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    bathroom: {
      prompt_name: "Scandinavian Bathroom",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A large sunlit Scandinavian bathroom with white walls and light wood floors.",
      camera_setup: "Marketing-quality, wide-angle shot with natural lighting.",
      assembled_elements: [
        "white vanity cabinet with light wood accents",
        "white/light wood bathroom mirror",
        "white vanity lighting",
        "white toilet",
        "white shower/bathtub",
        "white shower curtain or glass door",
        "white towel racks",
        "white/beige bath towels",
        "white/cream bath mat",
        "white/beige storage baskets",
        "white/clear decorative containers",
        "potted green plants",
        "white wall-mounted shelves",
        "minimalist white-framed artwork",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    dining_room: {
      prompt_name: "Scandinavian Dining Room",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A large sunlit Scandinavian dining room with white walls and light wood floors.",
      camera_setup: "Marketing-quality, wide-angle shot with natural lighting.",
      assembled_elements: [
        "light wood dining table",
        "white/beige upholstered dining chairs",
        "white or brass pendant light",
        "light wood sideboard/buffet",
        "white display cabinet",
        "white/cream area rug",
        "white/cream curtains",
        "minimalist white-framed wall art",
        "white/beige decorative centerpiece",
        "white/beige table runner",
        "white dinnerware display",
        "light wood wine storage",
        "potted green plants",
        "white/light wood mirrors",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    entrance_hall: {
      prompt_name: "Scandinavian Entrance Hall",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A large sunlit Scandinavian entrance hall with white walls and light wood floors.",
      camera_setup: "Marketing-quality, wide-angle shot with natural lighting.",
      assembled_elements: [
        "light wood console table",
        "white/light wood entry mirror",
        "white coat rack or wall hooks",
        "light wood shoe storage bench",
        "white umbrella stand",
        "white table lamp",
        "white/beige decorative bowl or tray",
        "minimalist white-framed wall art",
        "white/cream area rug or runner",
        "potted green plants",
        "white key holder",
        "white/beige storage baskets",
        "white ceiling light fixture",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    terrace: {
      prompt_name: "Scandinavian Terrace",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A large sunlit Scandinavian outdoor terrace with natural lighting and clean, open space.",
      camera_setup: "Marketing-quality, wide-angle shot with natural lighting.",
      assembled_elements: [
        "light wood outdoor dining table",
        "white/beige outdoor chairs",
        "white/beige outdoor sofa or seating",
        "white/beige outdoor cushions",
        "white/beige umbrella or shade structure",
        "white/cream outdoor rug",
        "white/beige planters with green plants",
        "white outdoor lighting",
        "light wood side tables",
        "white/beige outdoor storage",
        "white decorative lanterns",
        "white/beige outdoor textiles",
        "simple white/beige garden accessories",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    balcony: {
      prompt_name: "Scandinavian Balcony",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A cozy compact Scandinavian balcony with natural lighting and space-efficient design.",
      camera_setup: "Marketing-quality, wide-angle shot with natural lighting.",
      assembled_elements: [
        "light wood compact outdoor table",
        "white/beige folding chairs",
        "white/beige small outdoor cushions",
        "white vertical planters",
        "hanging green plants",
        "white outdoor lighting string",
        "white compact storage",
        "white/cream outdoor rug",
        "simple white/beige decorative elements",
        "white/beige privacy screen",
        "white wall-mounted shelves",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },
  },

  // MEDITERRANEAN STYLE - All 8 room types
  mediterranean: {
    living_room: {
      prompt_name: "Mediterranean Living Room",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A warm inviting Mediterranean living room with terracotta or cream walls and natural stone or tile floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with warm natural lighting.",
      assembled_elements: [
        "comfortable sofa in warm earth tones (terracotta, cream, sage)",
        "dark wood coffee table (walnut or mahogany)",
        "wrought iron and wood side tables",
        "ceramic table lamps in earth tones",
        "wrought iron floor lamps",
        "dark wood TV stand or entertainment unit",
        "dark wood bookshelf",
        "upholstered armchairs in rich fabrics",
        "Persian or kilim area rug",
        "warm-toned curtains (linen or cotton)",
        "decorative throw pillows in earth tones",
        "textured throw blankets",
        "rustic framed artwork",
        "ceramic decorative objects",
        "potted plants (olive trees, succulents)",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    bedroom: {
      prompt_name: "Mediterranean Bedroom",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A warm inviting Mediterranean bedroom with terracotta or cream walls and natural stone or tile floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with warm natural lighting.",
      assembled_elements: [
        "bed with warm-toned bedding (cream, terracotta, sage)",
        "textured throw blanket in earth tones",
        "dark wood bedside tables",
        "ceramic or wrought iron bedside lamps",
        "dark wood wardrobe or armoire",
        "dark wood shelves",
        "wrought iron or carved wood mirror",
        "rustic framed artwork",
        "Persian or natural fiber area rug",
        "warm-toned curtains",
        "potted plants",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    kitchen: {
      prompt_name: "Mediterranean Kitchen",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A warm inviting Mediterranean kitchen with terracotta or cream walls and natural stone or tile floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with warm natural lighting.",
      assembled_elements: [
        "dark wood or warm-painted kitchen cabinets with finger pulls only (no knobs or handles) - bronze or copper finger pulls",
        "granite or butcher block countertops in warm tones",
        "ceramic tile backsplash in earth tones or decorative patterns",
        "dark wood kitchen island",
        "wrought iron bar stools with cushions",
        "wrought iron or ceramic pendant lights",
        "under-cabinet lighting with warm tones",
        "copper or bronze appliances (or stainless with warm undertones)",
        "farmhouse sink with bronze or copper faucet",
        "ceramic decorative bowls",
        "potted herbs",
        "wooden cutting boards",
        "ceramic storage containers",
        "warm-toned window treatments",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    bathroom: {
      prompt_name: "Mediterranean Bathroom",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A warm inviting Mediterranean bathroom with textured plaster walls and natural stone or tile floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with warm natural lighting.",
      assembled_elements: [
        "dark wood or warm-painted vanity cabinet",
        "carved wood or wrought iron bathroom mirror",
        "warm-toned vanity lighting",
        "ceramic toilet",
        "stone or tiled shower/bathtub",
        "textured shower curtain or decorative glass door",
        "wrought iron towel racks",
        "warm-toned bath towels",
        "natural fiber bath mat",
        "woven storage baskets",
        "ceramic decorative containers",
        "potted plants",
        "wood or wrought iron wall-mounted shelves",
        "rustic framed artwork",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    dining_room: {
      prompt_name: "Mediterranean Dining Room",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A warm inviting Mediterranean dining room with terracotta or cream walls and natural stone or tile floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with warm natural lighting.",
      assembled_elements: [
        "dark wood dining table (walnut, mahogany)",
        "upholstered or wrought iron dining chairs",
        "wrought iron chandelier or ceramic pendant light",
        "dark wood sideboard or buffet",
        "dark wood display cabinet",
        "Persian or natural fiber area rug",
        "warm-toned curtains",
        "rustic framed wall art",
        "ceramic decorative centerpiece",
        "table runner in earth tones",
        "ceramic dinnerware display",
        "dark wood wine storage",
        "potted plants",
        "carved wood or wrought iron mirrors",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    entrance_hall: {
      prompt_name: "Mediterranean Entrance Hall",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A warm inviting Mediterranean entrance hall with terracotta or cream walls and natural stone or tile floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with warm natural lighting.",
      assembled_elements: [
        "dark wood or wrought iron console table",
        "carved wood or wrought iron entry mirror",
        "wrought iron coat rack or wall hooks",
        "dark wood or upholstered storage bench",
        "ceramic umbrella stand",
        "ceramic or wrought iron table lamp",
        "ceramic decorative bowl or tray",
        "rustic framed wall art",
        "Persian or natural fiber area rug or runner",
        "potted plants (olive trees, succulents)",
        "wrought iron key holder",
        "woven storage baskets",
        "wrought iron or ceramic ceiling light fixture",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    terrace: {
      prompt_name: "Mediterranean Terrace",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A warm inviting Mediterranean outdoor terrace with natural stone or terracotta tile floors and warm ambient lighting.",
      camera_setup:
        "Marketing-quality, wide-angle shot with warm natural lighting.",
      assembled_elements: [
        "dark wood or wrought iron outdoor dining table",
        "wrought iron outdoor chairs with cushions",
        "wrought iron outdoor sofa with warm-toned cushions",
        "warm earth-tone outdoor cushions",
        "canvas or fabric umbrella in warm tones",
        "natural fiber outdoor rug",
        "terracotta or ceramic planters with Mediterranean plants",
        "wrought iron lanterns or outdoor lighting",
        "dark wood or wrought iron side tables",
        "outdoor storage with warm finishes",
        "decorative lanterns",
        "warm-toned outdoor textiles",
        "ceramic garden accessories",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    balcony: {
      prompt_name: "Mediterranean Balcony",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A cozy compact Mediterranean balcony with warm colors and space-efficient design.",
      camera_setup:
        "Marketing-quality, wide-angle shot with warm natural lighting.",
      assembled_elements: [
        "small dark wood or wrought iron outdoor table",
        "wrought iron folding chairs with cushions",
        "warm earth-tone outdoor cushions",
        "terracotta vertical planters",
        "hanging plants (trailing vines, flowers)",
        "wrought iron outdoor lighting string or lanterns",
        "compact wrought iron storage",
        "natural fiber outdoor rug",
        "ceramic decorative elements",
        "canvas or fabric privacy screen in warm tones",
        "wrought iron wall-mounted shelves",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },
  },

  // INDUSTRIAL STYLE - All 8 room types
  industrial: {
    living_room: {
      prompt_name: "Industrial Living Room",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A modern industrial living room with exposed brick or concrete walls and polished concrete or reclaimed wood floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with dramatic lighting.",
      assembled_elements: [
        "leather sofa in brown, black, or charcoal",
        "reclaimed wood coffee table with steel pipe or beam base",
        "metal and wood side tables",
        "industrial metal table lamps with exposed bulbs",
        "tripod metal floor lamps",
        "reclaimed wood and steel TV stand",
        "pipe shelving with reclaimed wood",
        "leather or metal armchairs",
        "leather or canvas area rug with geometric patterns",
        "minimal window treatments or metal blinds",
        "leather throw pillows",
        "canvas or leather throws",
        "industrial-style framed art or metal wall decor",
        "metal or concrete decorative objects",
        "minimal plants in concrete or metal planters",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    bedroom: {
      prompt_name: "Industrial Bedroom",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A modern industrial bedroom with exposed brick or concrete walls and polished concrete or reclaimed wood floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with dramatic lighting.",
      assembled_elements: [
        "bed with dark gray or black bedding",
        "leather or canvas throw blanket",
        "reclaimed wood and metal bedside tables",
        "industrial metal bedside lamps",
        "reclaimed wood wardrobe or metal locker-style storage",
        "pipe shelving with reclaimed wood",
        "industrial metal or reclaimed wood mirror",
        "industrial-style framed art",
        "leather or canvas area rug",
        "minimal window treatments or metal blinds",
        "minimal plants in concrete or metal planters",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    kitchen: {
      prompt_name: "Industrial Kitchen",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A modern industrial kitchen with exposed brick or concrete walls and polished concrete floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with dramatic lighting.",
      assembled_elements: [
        "dark stained wood or metal-front kitchen cabinets with finger pulls only (no knobs or handles) - black metal or steel finger pulls",
        "concrete, butcher block, or steel countertops",
        "subway tile, metal panel, or exposed brick backsplash",
        "reclaimed wood and steel kitchen island",
        "metal or leather bar stools",
        "Edison bulb pendant lights with metal shades",
        "track lighting or exposed conduit lighting",
        "stainless steel or black steel appliances",
        "farmhouse or industrial sink with black faucet",
        "metal or concrete decorative bowls",
        "minimal herbs in metal containers",
        "reclaimed wood cutting boards",
        "glass or metal storage containers",
        "minimal or industrial window treatments",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    bathroom: {
      prompt_name: "Industrial Bathroom",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A modern industrial bathroom with exposed brick or concrete walls and concrete or dark tile floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with dramatic lighting.",
      assembled_elements: [
        "reclaimed wood or concrete vanity cabinet",
        "industrial metal or reclaimed wood bathroom mirror",
        "exposed bulb or metal vanity lighting",
        "modern toilet",
        "concrete or dark tiled shower/bathtub",
        "frameless glass shower door or industrial-style curtain",
        "black iron or pipe towel racks",
        "dark gray or black bath towels",
        "concrete or dark bath mat",
        "metal or wire storage baskets",
        "glass or metal decorative containers",
        "minimal plants in concrete or metal planters",
        "pipe shelving with reclaimed wood",
        "industrial-style framed artwork",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    dining_room: {
      prompt_name: "Industrial Dining Room",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A modern industrial dining room with exposed brick or concrete walls and polished concrete or reclaimed wood floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with dramatic lighting.",
      assembled_elements: [
        "reclaimed wood dining table with steel pipe or beam base",
        "metal chairs or leather upholstered seating",
        "Edison bulb chandelier or metal pendant lights",
        "reclaimed wood and steel sideboard",
        "metal and glass display cabinet",
        "leather or canvas area rug with geometric patterns",
        "minimal window treatments or metal blinds",
        "industrial-style framed wall art or metal wall decor",
        "metal or concrete decorative centerpiece",
        "canvas or leather table runner",
        "metal or concrete dinnerware display",
        "reclaimed wood and metal wine storage",
        "minimal plants in concrete or metal planters",
        "industrial metal mirrors",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    entrance_hall: {
      prompt_name: "Industrial Entrance Hall",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A modern industrial entrance hall with exposed brick or concrete walls and polished concrete or reclaimed wood floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with dramatic lighting.",
      assembled_elements: [
        "reclaimed wood and steel console table",
        "industrial metal or reclaimed wood entry mirror",
        "pipe coat rack or metal wall hooks",
        "reclaimed wood or leather storage bench",
        "metal umbrella stand",
        "industrial metal table lamp with exposed bulb",
        "metal or concrete decorative bowl or tray",
        "industrial-style framed wall art",
        "leather or canvas area rug or runner",
        "minimal plants in concrete or metal planters",
        "metal key holder",
        "wire or metal storage baskets",
        "exposed bulb or industrial ceiling light fixture",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    terrace: {
      prompt_name: "Industrial Terrace",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A modern industrial outdoor terrace with concrete or steel grating floors and exposed structural elements.",
      camera_setup:
        "Marketing-quality, wide-angle shot with dramatic lighting.",
      assembled_elements: [
        "reclaimed wood or metal outdoor dining table",
        "metal outdoor chairs with dark cushions",
        "metal outdoor sofa with leather or canvas cushions",
        "dark gray or black outdoor cushions",
        "metal or canvas umbrella in dark tones",
        "outdoor rug in dark tones or geometric patterns",
        "concrete or metal planters with industrial-style plants",
        "exposed bulb string lights or metal lanterns",
        "metal or reclaimed wood side tables",
        "metal outdoor storage",
        "metal decorative lanterns",
        "canvas or leather outdoor textiles",
        "metal garden accessories",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    balcony: {
      prompt_name: "Industrial Balcony",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A cozy compact industrial balcony with concrete or metal grating floors and exposed elements.",
      camera_setup:
        "Marketing-quality, wide-angle shot with dramatic lighting.",
      assembled_elements: [
        "small metal or reclaimed wood outdoor table",
        "metal folding chairs with dark cushions",
        "dark gray or black outdoor cushions",
        "metal vertical planters",
        "hanging plants in metal containers",
        "exposed bulb outdoor lighting string",
        "compact metal storage",
        "dark outdoor rug or rubber mat",
        "metal decorative elements",
        "metal mesh or canvas privacy screen",
        "pipe or metal wall-mounted shelves",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },
  },

  // TRANSITIONAL STYLE - All 8 room types
  transitional: {
    living_room: {
      prompt_name: "Transitional Living Room",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "An elegant transitional living room with soft neutral walls (greige, warm gray, cream) and medium-toned hardwood floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with balanced natural lighting.",
      assembled_elements: [
        "comfortable sofa in updated neutrals (greige, taupe, soft blue)",
        "wood coffee table with classic shape but clean lines",
        "mixed material side tables (wood and metal)",
        "ceramic or metal table lamps with drum shades",
        "updated traditional floor lamps",
        "wood TV stand with traditional details",
        "built-in bookshelf with traditional molding",
        "upholstered armchairs in linen or cotton",
        "traditional patterned area rug in contemporary colors",
        "layered window treatments (shears and panels)",
        "textured throw pillows in neutral tones",
        "quality fabric throws",
        "traditional-style framed art",
        "mixed metal decorative objects",
        "potted plants in ceramic containers",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    bedroom: {
      prompt_name: "Transitional Bedroom",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "An elegant transitional bedroom with soft neutral walls (greige, warm gray, cream) and medium-toned hardwood floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with balanced natural lighting.",
      assembled_elements: [
        "bed with neutral bedding in quality fabrics",
        "textured throw blanket",
        "wood bedside tables with traditional details",
        "ceramic or metal bedside lamps",
        "wood wardrobe with traditional styling",
        "built-in shelves with traditional details",
        "framed mirror with traditional but updated design",
        "traditional-style framed artwork",
        "traditional patterned area rug in contemporary colors",
        "layered window treatments",
        "potted plants in ceramic containers",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    kitchen: {
      prompt_name: "Transitional Kitchen",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "An elegant transitional kitchen with soft neutral walls and medium-toned hardwood or stone-look tile floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with balanced natural lighting.",
      assembled_elements: [
        "Shaker or raised panel kitchen cabinets in painted or stained finishes with finger pulls only (no knobs or handles) - brass, bronze, or mixed metal finger pulls",
        "quartz or granite countertops in neutral tones with subtle veining",
        "subway tile, natural stone, or ceramic backsplash in classic patterns",
        "wood kitchen island with traditional details",
        "upholstered bar stools",
        "updated traditional pendant lights (brass, bronze, or mixed metals)",
        "under-cabinet lighting",
        "stainless steel or panel-ready appliances",
        "farmhouse or undermount sink with traditional faucet in mixed metals",
        "ceramic decorative bowls",
        "potted herbs in ceramic containers",
        "wood cutting boards",
        "ceramic or glass storage containers",
        "layered window treatments",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    bathroom: {
      prompt_name: "Transitional Bathroom",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "An elegant transitional bathroom with soft neutral walls and stone-look or classic tile floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with balanced natural lighting.",
      assembled_elements: [
        "painted or stained wood vanity cabinet with traditional details",
        "framed bathroom mirror with traditional styling",
        "updated traditional vanity lighting (sconces or bar lights)",
        "modern toilet with classic lines",
        "tiled shower/bathtub with classic patterns",
        "frameless glass shower door or classic shower curtain",
        "mixed metal towel racks (brass, bronze, chrome)",
        "neutral-toned quality bath towels",
        "plush bath mat",
        "woven or ceramic storage baskets",
        "ceramic decorative containers",
        "potted plants in ceramic containers",
        "wood or painted wall-mounted shelves",
        "traditional-style framed artwork",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    dining_room: {
      prompt_name: "Transitional Dining Room",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "An elegant transitional dining room with soft neutral walls (greige, warm gray, cream) and medium-toned hardwood floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with balanced natural lighting.",
      assembled_elements: [
        "wood dining table with classic shape but clean lines",
        "upholstered dining chairs in neutral fabrics",
        "updated traditional chandelier in mixed metals",
        "wood sideboard with traditional details",
        "wood or glass-front display cabinet",
        "traditional patterned area rug in contemporary colors",
        "layered window treatments",
        "traditional-style framed wall art",
        "ceramic or glass decorative centerpiece",
        "table runner in neutral tones",
        "ceramic or glass dinnerware display",
        "wood wine storage with traditional details",
        "potted plants in ceramic containers",
        "framed mirrors with traditional styling",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    entrance_hall: {
      prompt_name: "Transitional Entrance Hall",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "An elegant transitional entrance hall with soft neutral walls (greige, warm gray, cream) and medium-toned hardwood floors.",
      camera_setup:
        "Marketing-quality, wide-angle shot with balanced natural lighting.",
      assembled_elements: [
        "wood console table with traditional details",
        "framed entry mirror with traditional styling",
        "traditional coat rack or decorative hooks",
        "upholstered or wood storage bench",
        "ceramic or metal umbrella stand",
        "ceramic or metal table lamp with traditional shade",
        "ceramic or glass decorative bowl or tray",
        "traditional-style framed wall art",
        "traditional patterned area rug or runner in contemporary colors",
        "potted plants in ceramic containers",
        "decorative key holder",
        "woven or ceramic storage baskets",
        "updated traditional ceiling light fixture",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    terrace: {
      prompt_name: "Transitional Terrace",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "An elegant transitional outdoor terrace with stone or wood-look tile floors and classic architectural details.",
      camera_setup:
        "Marketing-quality, wide-angle shot with balanced natural lighting.",
      assembled_elements: [
        "wood or mixed material outdoor dining table",
        "classic outdoor chairs with comfortable cushions",
        "outdoor sofa with traditional lines and neutral cushions",
        "neutral outdoor cushions in quality fabrics",
        "classic umbrella in neutral tones",
        "outdoor rug in traditional patterns with contemporary colors",
        "ceramic or stone planters with classic plants",
        "updated traditional outdoor lighting",
        "wood or mixed material side tables",
        "outdoor storage with traditional styling",
        "decorative lanterns in mixed metals",
        "quality outdoor textiles",
        "classic garden accessories",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },

    balcony: {
      prompt_name: "Transitional Balcony",
      base_style: "cinematic, photorealistic, 4K",
      room_description:
        "A cozy compact transitional balcony with classic styling and space-efficient design.",
      camera_setup:
        "Marketing-quality, wide-angle shot with balanced natural lighting.",
      assembled_elements: [
        "small wood or mixed material outdoor table",
        "classic folding chairs with comfortable cushions",
        "neutral outdoor cushions",
        "ceramic vertical planters",
        "hanging plants in decorative containers",
        "classic outdoor lighting string or lanterns",
        "compact storage with traditional details",
        "outdoor rug in classic pattern",
        "ceramic or metal decorative elements",
        "fabric privacy screen in neutral tones",
        "decorative wall-mounted shelves",
      ],
      negative_prompts: ["no people", "no text overlays", "no clutter"],
    },
  },
} as const;

// Helper function to get style name for prompts
function getStyleName(style: RenovationStyle): string {
  const styleNames: Record<RenovationStyle, string> = {
    default: "Scandinavian",
    mediterranean: "Mediterranean coastal",
    industrial: "modern industrial",
    transitional: "transitional contemporary",
  };
  return styleNames[style];
}

// Function to generate assembly renovation prompt - final optimized narrative format
export function getAssemblyRenovationPrompt(
  roomType: RenovationType,
  selectedElements?: string[], // Optional: only modify specific elements
  style: RenovationStyle = "default",
): string {
  // 2-level lookup: style first, then room type
  const assemblyPrompt = ROOM_ASSEMBLY_PROMPTS[style][roomType];
  const styleInstructions = RENOVATION_STYLES[style];
  const styleName = getStyleName(style);

  // If specific elements are selected, focus on those
  const elementsToInclude =
    selectedElements && selectedElements.length > 0
      ? selectedElements
      : assemblyPrompt.assembled_elements;

  const elementsText = elementsToInclude.join(", ");
  const negativeText = assemblyPrompt.negative_prompts.join(", ");

  // Remove style name from room description to avoid redundancy
  // e.g., "A large sunlit Scandinavian kitchen..." -> "A large, sunlit kitchen..."
  let roomDesc = assemblyPrompt.room_description;
  const styleWords = styleName.toLowerCase().split(" ");
  styleWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    roomDesc = roomDesc.replace(regex, "");
  });
  roomDesc = roomDesc.replace(/\s+/g, " ").trim();

  // Clean camera setup (remove redundant "Marketing-quality" prefix)
  const cameraInfo = assemblyPrompt.camera_setup
    .toLowerCase()
    .replace(/marketing-quality,?\s*/i, "")
    .trim();

  return `${assemblyPrompt.prompt_name} — Interior Renovation

MANDATORY STRUCTURAL PRESERVATION: Keep wall positions EXACTLY as shown — do not move, resize, or reposition walls. Keep floor boundaries and floor plan layout IDENTICAL — floor area shape and dimensions must match the original. CRITICAL: Corner pixels (wall-wall and floor-wall intersections) must remain in the SAME exact pixel positions. Keep door and window openings at EXACT positions — same size, same location, same shape. CRITICAL: Do NOT create windows if the original image has no windows. Only preserve windows that already exist in the original image. Do NOT add window openings to windowless rooms. Keep ceiling height UNCHANGED. Keep camera perspective IDENTICAL — same viewing angle, same position, same spatial relationships. Keep key architectural elements (columns, beams, structural features) at EXACT positions and scale. DO NOT modify geometry, dimensions, or spatial layout. ONLY transform: materials, colors, finishes, furniture, decor, and surface textures.

FORBIDDEN: Do not move walls, change floor boundaries, alter corner pixel positions (wall-wall or floor-wall), modify edge lines, alter room dimensions, modify door/window positions, create new windows, add window openings, change ceiling height, adjust camera angle, or reposition structural elements.

Transform to ${styleName} aesthetic: ${roomDesc} ${styleInstructions}

Elements: ${elementsText}. Remove personal items, photos, cultural symbols. Use neutral, contemporary decor.

Camera: ${cameraInfo}. Style: ${assemblyPrompt.base_style.toLowerCase()}. Exclude: ${negativeText}, structural modifications, geometry changes, corner pixel alterations.

REMINDER: Corner pixels (wall-wall and floor-wall) must remain in the SAME exact positions. Wall positions, floor boundaries, and structural geometry must remain EXACTLY as in the original image. Do NOT create windows if the original image has no windows — only preserve windows that already exist.`;
}

// Re-export PropertyImage type for convenience
export type { PropertyImage } from "~/lib/data";
