// app/api/crosssell/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { END_POINT } from "@/lib/server/constants/backend-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CrossSellItem {
  sku: string;
  link_type: string;
  linked_product_sku: string;
  linked_product_type: string;
  position: number;
}

interface CrossSellRequestBody {
  skus: string[];
  token: string;
}

/**
 * Fetches crosssell data for a single product SKU
 */
async function fetchCrossSellData(
  sku: string,
  token: string
): Promise<CrossSellItem[]> {
  const url = `${END_POINT}/index.php/rest/V1/products/${sku}/links/crosssell`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Cookie": "PHPSESSID=ielc136sve7u2d4tj0u9voohfd"
      },
      redirect: "follow",
    });

    if (!res.ok) {
      // If product not found or no crosssell data, return empty array
      if (res.status === 404) {
        return [];
      }
      throw new Error(`Failed to fetch crosssell data for SKU ${sku}: ${res.status}`);
    }

    const data = (await res.json()) as CrossSellItem[];

    // Ensure each item has the sku field
    return Array.isArray(data) 
      ? data.map((item) => ({ ...item, sku }))
      : [];
  } catch (err) {
    console.error(`Error fetching crosssell for SKU ${sku}:`, err);
    // Return empty array on error to allow other SKUs to be processed
    return [];
  }
}

/**
 * POST handler for crosssell endpoint
 * Accepts JSON body: { skus: string[], token: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CrossSellRequestBody>;
    const skus = Array.from(new Set(body.skus || [])).filter(Boolean);
    const token = body.token?.trim() || "";

    if (skus.length === 0 || !token) {
      return NextResponse.json(
        {
          error:
            "Request must include an array of product SKUs and a bearer token.",
        },
        { status: 400 }
      );
    }

    // Fetch crosssell data for all SKUs in parallel
    const results = await Promise.all(
      skus.map((sku) => fetchCrossSellData(sku, token))
    );

    const allCrossSellItems = results.flat();

    return NextResponse.json(allCrossSellItems, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Bad request";
    console.error("Crosssell POST error:", err);
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}


