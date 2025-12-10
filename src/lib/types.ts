export interface Dot {
  left: string;
  top: string;
}

export interface DotSku {
  sku: string;
  top: string;
  left: string;
}

export interface Row {
  product_sku: string;
  prod_name: string;
  url: string;
  img: string | null;
  dot_skus: DotSku[];
}

export interface DotProduct {
  sku: string;
  name: string;
  price: string; // numeric encoded as string by upstream
  MRL_discount_price: string; // numeric encoded as string by upstream
  url_key: string;
  image: string; // path like "/e/a/example.jpg"
  real_img: string; // parsed from image
  visibility: string; // e.g., "1" | "4"

  top: string;
  left: string;
  url?: string;
  mobile?: string;
}

export interface ComboItem {
  name: string;
  sku: string;
  img: string | null;
  dots: DotProduct[];
}

// Simplified product response from /api/products/list
export interface SimplifiedProduct {
  image: string | null;
  url: string;
  name: string;
  sku: string;
}

// Upstream API response types (for direct API calls, not our route)
export interface ProductItem {
  sku: string;
  name: string;
  price: string;
  MRL_discount_price: string;
  url_key: string;
  image: string;
  visibility: string;
}

export interface ProductsListResponse {
  status: boolean; // true on success
  code: string; // e.g., "00"
  message: string; // e.g., "success"
  data: {
    item_total: number;
    items: ProductItem[];
  };
}

export interface CrossSellItem {
  sku: string;
  link_type: string;
  linked_product_sku: string;
  linked_product_type: string;
  position: number;
}

// LocalStorage key literals for type safety
export type LocalStorageKey =
  | "combo-table-collapsed"
  | "crosssell-token"
  | "combo-tools-config"
  | "google-sheets-config";
