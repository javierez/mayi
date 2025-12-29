import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/dal";
import { listListingsCompactWithAuth } from "~/server/queries/listing";

interface ListingSearchResult {
  listingId: number;
  referenceNumber: string | null;
  title: string | null;
  city: string | null;
  listingType: string | null;
  price: number | null;
}

/**
 * GET /api/listings/search
 * Search for listings by reference number, title, or location
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    // Use the existing listListingsCompact function with search filter
    const result = await listListingsCompactWithAuth({
      searchQuery: search,
      limit,
    });

    // Map to simplified format for combobox
    const listings: ListingSearchResult[] = result.map((l) => ({
      listingId: Number(l.listingId),
      referenceNumber: l.referenceNumber,
      title: l.title,
      city: l.city,
      listingType: l.listingType,
      price: l.price ? Number(l.price) : null,
    }));

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Error searching listings:", error);
    return NextResponse.json(
      { error: "Error al buscar propiedades" },
      { status: 500 }
    );
  }
}
