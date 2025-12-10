import { Row, DotSku } from "@/types";

interface SuggestPositionsResult {
  success: boolean;
  updatedDotSkus?: DotSku[];
  error?: string;
  retryDelay?: string;
  failCount?: number;
}

export async function suggestPositionsForProduct(
  row: Row,
  dotProductImages: Record<string, string | null>
): Promise<SuggestPositionsResult> {
  if (!row.img) {
    return { success: false, error: "Main product image is missing" };
  }

  // Filter dots that have images
  const dotSkusToProcess = row.dot_skus.filter(dot => dotProductImages[dot.sku]);

  if (dotSkusToProcess.length === 0) {
    return { success: false, error: "No dot product images found" };
  }

  try {
    const formData = new FormData();

    // Send main product image URL
    if (row.img.startsWith('blob:')) {
      const mainResponse = await fetch(row.img);
      const mainBlob = await mainResponse.blob();
      formData.append("mainProductImg", new File([mainBlob], "main_product.jpg", { type: mainBlob.type }));
    } else {
      formData.append("mainProductImg", row.img);
    }

    // Send dot product image URLs
    for (const dot of dotSkusToProcess) {
      const imgUrl = dotProductImages[dot.sku];
      if (imgUrl) {
        if (imgUrl.startsWith('blob:')) {
          const dotResponse = await fetch(imgUrl);
          const dotBlob = await dotResponse.blob();
          formData.append("dotImg", new File([dotBlob], dot.sku, { type: dotBlob.type }));
        } else {
          formData.append("dotImg", imgUrl);
        }
      }
    }

    const response = await fetch("/api/ai/test", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to analyze positions");
    }

    // Update dot positions
    const updatedDotSkus = row.dot_skus.map(dot => {
      const processedIndex = dotSkusToProcess.findIndex(d => d.sku === dot.sku);
      if (processedIndex !== -1 && data.results.dotProducts[processedIndex]) {
        const result = data.results.dotProducts[processedIndex];
        if (result && result.position) {
          return {
            ...dot,
            top: result.position.top,
            left: result.position.left,
          };
        }
      }
      return dot;
    });

    // Check for any retryDelay in results
    const retryDelayItem = data.results.dotProducts.find((r: any) => r.retryDelay);
    const retryDelay = retryDelayItem ? retryDelayItem.retryDelay : undefined;
    const failCount = data.summary?.failCount;

    if (retryDelay) {
      return { success: false, updatedDotSkus, retryDelay, failCount };
    }

    return { success: true, updatedDotSkus, failCount };

  } catch (error) {
    console.error("Error suggesting positions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to suggest positions"
    };
  }
}
