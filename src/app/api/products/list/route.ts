// app/api/products/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/lib/client/constants/frontend-config";
import { getImgUrl, parseMediaUrl, parseProductUrl } from "@/lib/shared/utils/str";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  pids: string[];
}

interface ProductItem {
  sku: string;
  name: string;
  price: string;
  MRL_discount_price: string;
  url_key: string;
  image: string;
  visibility: string;
}

interface ProductsListResponse {
  status: boolean; // true on success
  code: string; // e.g., "00"
  message: string; // e.g., "success"
  data: {
    item_total: number;
    items: ProductItem[];
  };
}



export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const pids = Array.from(new Set(body?.pids || [])).filter(Boolean);

    if (pids.length === 0) {
      return NextResponse.json(
        { error: "No product IDs provided" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${BASE_URL}/index.php/rest/V1/api/mrl/products/list`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pids,
          // fields: "sku,name,price,MRL_discount_price,url_key,image,visibility",
          fields: "sku,name,url_key,image",
          page: 1,
          page_size: 100,
        }),
        redirect: "follow",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          error: "Upstream error",
          status: res.status,
          body: text,
        },
        { status: 502 }
      );
    }

    const json = (await res.json()) as ProductsListResponse[];
    
    if (!Array.isArray(json) || json.length === 0) {
      return NextResponse.json(
        { error: "Invalid response format from upstream" },
        { status: 502 }
      );
    }

    const products = json[0].data.items.map((item: ProductItem) => ({
      image: parseMediaUrl(getImgUrl(item.image).img_src),
      url: parseProductUrl(item.url_key),
      name: item.name,
      sku: item.sku,
    }));

    return NextResponse.json(products, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
