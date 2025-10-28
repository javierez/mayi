import type { PropertyImage } from "~/lib/data";

export interface GeminiRenovationRequest {
  imageUrl: string;
  propertyId: bigint;
  referenceNumber: string;
  imageOrder: number;
  renovationType?: RenovationType;
}

export interface GeminiRenovationResponse {
  success: boolean;
  renovatedImageBase64?: string;
  error?: string;
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

// Style instruction sets for different aesthetics
export const RENOVATION_STYLES = {
  default: `
    STYLE AESTHETIC - SCANDINAVIAN NORDIC:

    WALLS:
    - Paint: pure white (Benjamin Moore Simply White), soft off-whites
    - Wood accent walls: light pine, birch, or whitewashed oak planks
    - Materials: smooth painted surfaces, natural wood paneling
    - Trim: white-painted wood in simple profiles

    FLOORS:
    - Hardwood: light oak, ash, or pine in natural matte finish
    - Tile: white or light gray ceramic/porcelain in simple patterns
    - Carpet: minimal use, natural wool in cream or light gray
    - Rugs: natural jute, wool in geometric patterns, or solid light colors

    FURNITURE:
    - Sofas: comfortable designs in light gray linen or white cotton
    - Tables: light wood (oak, birch) with simple, functional designs
    - Seating: Windsor chairs, wishbone chairs, or upholstered pieces in natural fabrics
    - Storage: light wood shelving, white painted cabinets with wood tops
    - Materials: light woods, white painted surfaces, natural textiles

    LIGHTING:
    - Pendant lights: simple shapes in white, wood, or brass
    - Table lamps: ceramic bases in white/cream with linen shades
    - Floor lamps: tripod wood legs with white shades
    - Candles and lanterns for hygge atmosphere

    CRITICAL: Transform ALL wall colors and finishes completely - no wall should remain the same color or finish as the original image. Paint every wall surface with the specified Scandinavian aesthetic.
  `,

  mediterranean: `
    STYLE AESTHETIC - MEDITERRANEAN COASTAL:

    WALLS:
    - Paint: warm whites, cream, soft terracotta, sage green
    - Textured finishes: lime plaster, stucco, or faux painting techniques
    - Stone accent walls: natural limestone, travertine, or stacked stone
    - Trim: arched openings, decorative moldings in warm wood tones

    FLOORS:
    - Tile: terracotta, ceramic in earth tones, natural stone (travertine, limestone)
    - Hardwood: distressed oak, chestnut, or reclaimed wood with character
    - Natural stone: tumbled marble, slate, or flagstone
    - Rugs: Persian, kilim, or natural fiber in warm earth tones

    FURNITURE:
    - Sofas: comfortable designs in warm fabrics (linen, cotton) in earth tones
    - Tables: dark wood (walnut, mahogany) with carved details or wrought iron bases
    - Seating: upholstered in rich fabrics, wrought iron chairs with cushions
    - Storage: dark wood armoires, wrought iron and wood combinations
    - Materials: dark woods, wrought iron, natural fabrics, ceramic accents

    LIGHTING:
    - Chandeliers: wrought iron with candle-style bulbs or ceramic details
    - Pendant lights: ceramic, terracotta, or metal in warm finishes
    - Table lamps: ceramic bases in earth tones with fabric shades
    - Lantern-style fixtures, warm ambient lighting

    CRITICAL: Transform ALL wall colors and finishes completely - no wall should remain the same color or finish as the original image. Paint every wall surface with the specified Mediterranean aesthetic.
  `,

  industrial: `
    STYLE AESTHETIC - MODERN INDUSTRIAL:

    WALLS:
    - Exposed brick: red brick, painted brick in charcoal or white
    - Paint: charcoal gray, deep black, or warm whites as contrast
    - Materials: concrete, metal panels, or reclaimed wood accent walls
    - Trim: minimal or metal channels, exposed structural elements

    FLOORS:
    - Concrete: polished, stained, or painted in gray tones
    - Hardwood: reclaimed or distressed wood in dark stains
    - Metal: steel plate or grating (accent areas)
    - Rugs: minimal use, leather or canvas materials, geometric patterns

    FURNITURE:
    - Sofas: leather upholstery in brown, black, or charcoal
    - Tables: reclaimed wood tops with steel pipe or beam bases
    - Seating: metal chairs, leather bar stools, vintage industrial pieces
    - Storage: metal lockers, pipe shelving, reclaimed wood and steel combinations
    - Materials: steel, iron, reclaimed wood, leather, canvas

    LIGHTING:
    - Pendant lights: Edison bulbs, metal shades, track lighting systems
    - Exposed fixtures: conduit wiring, industrial-style switches
    - Floor lamps: tripod designs with metal shades, photographer's lamps
    - Task lighting with adjustable metal arms and exposed bulbs

    CRITICAL: Transform ALL wall colors and finishes completely - no wall should remain the same color or finish as the original image. Paint every wall surface with the specified Industrial aesthetic.
  `,

  transitional: `
    STYLE AESTHETIC - TRANSITIONAL CONTEMPORARY:

    WALLS:
    - Paint: soft neutrals (greige, warm gray, cream, soft beige)
    - Accent walls: navy blue, sage green, or rich charcoal
    - Materials: smooth painted surfaces with classic crown molding
    - Trim: traditional profiles in white or matching wall colors

    FLOORS:
    - Hardwood: medium-toned oak, maple, or hickory in satin finish
    - Tile: neutral stone-look or wood-look porcelain in larger formats
    - Carpet: traditional patterns in updated colors, plush textures
    - Rugs: traditional patterns with contemporary color palettes

    FURNITURE:
    - Sofas: comfortable traditional silhouettes in updated fabrics
    - Tables: wood with classic shapes but cleaner lines, mixed materials
    - Seating: upholstered pieces mixing traditional forms with modern fabrics
    - Storage: built-ins with traditional details, painted or stained wood
    - Materials: quality woods, mixed metals, linen and cotton fabrics

    LIGHTING:
    - Chandeliers: updated traditional designs in mixed metals
    - Pendant lights: classic shapes with contemporary finishes
    - Table lamps: ceramic or metal bases with drum or empire shades
    - Layered lighting with dimmer controls for ambiance

    CRITICAL: Transform ALL wall colors and finishes completely - no wall should remain the same color or finish as the original image. Paint every wall surface with the specified Transitional aesthetic.
  `,
} as const;

export type RenovationStyle = keyof typeof RENOVATION_STYLES;

// NOTE: getRenovationPromptWithStyle removed - we use getAssemblyRenovationPrompt instead (see line 519)

// Settings for Gemini API calls
export const GEMINI_RENOVATION_SETTINGS = {
  model: "gemini-2.5-flash-image-preview",
  maxOutputTokens: 8192,
  temperature: 0.7,
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
        "white Shaker-style kitchen cabinets",
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
        "dark wood or warm-painted kitchen cabinets",
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
        "dark stained wood or metal-front kitchen cabinets",
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
        "Shaker or raised panel kitchen cabinets in painted or stained finishes",
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

// Function to generate assembly renovation prompt
export function getAssemblyRenovationPrompt(
  roomType: RenovationType,
  selectedElements?: string[], // Optional: only modify specific elements
  style: RenovationStyle = "default",
): string {
  // 2-level lookup: style first, then room type
  const assemblyPrompt = ROOM_ASSEMBLY_PROMPTS[style][roomType];
  const styleInstructions = RENOVATION_STYLES[style];

  // If specific elements are selected, focus on those
  const elementsToInclude =
    selectedElements && selectedElements.length > 0
      ? selectedElements
      : assemblyPrompt.assembled_elements;

  const elementsText = elementsToInclude
    .map((element) => `- ${element}`)
    .join("\n");
  const negativeText = assemblyPrompt.negative_prompts
    .map((neg) => `- ${neg}`)
    .join("\n");

  return `
ASSEMBLY RENOVATION - ${assemblyPrompt.prompt_name}

PRESERVE STRUCTURAL POSITIONS EXACTLY:
- Wall locations and dimensions (but CHANGE their appearance and materials completely)
- Door openings (but update door styles/materials/colors)
- Window openings (but update window frames/treatments)
- Ceiling height (but change ceiling finishes/treatments)
- Floor plan layout (but completely change flooring materials)

ROOM VISION:
${assemblyPrompt.room_description}

CAMERA & STYLE:
${assemblyPrompt.camera_setup}
${assemblyPrompt.base_style}

ASSEMBLED ELEMENTS TO TRANSFORM:
${elementsText}

STYLE AESTHETIC:
${styleInstructions}

MANDATORY REQUIREMENTS:
- Transform ALL specified elements with completely different styles, colors, and arrangements
- Remove all personal belongings, family photos, cultural symbols, memorabilia
- Replace with neutral, contemporary decor appropriate for the space
- Maintain photorealistic accuracy that respects the original space's positioning constraints

NEGATIVE ELEMENTS:
${negativeText}

CRITICAL: Every specified element must look completely renovated and different from the original image while maintaining the structural integrity and spatial relationships of the room.
`;
}

// Re-export PropertyImage type for convenience
export type { PropertyImage } from "~/lib/data";
