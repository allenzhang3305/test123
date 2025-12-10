// e.g.
// "22-0139-0-19",
// "1017750-v2",
// "13-0034-0-19",

import type { SimplifiedProduct } from "@/types";

export async function fetchProducts(
  pids: string[]
): Promise<SimplifiedProduct[]> {
  const res = await fetch("/api/products/list", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pids }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`fetchProducts failed: ${res.status} - ${errorText}`);
  }

  const data = (await res.json()) as SimplifiedProduct[];

  if (!Array.isArray(data)) {
    throw new Error("Invalid response format from API");
  }

  return data;
}
