import { BASE_URL, MEDIA_URL } from "@/lib/client/constants/frontend-config";
import { DotSku, Row } from "@/types";

/**
 * Parses a media URL from the Magento media template format.
 *
 * Converts: "{{media url=path/to/image.jpg}}"
 * To: "https://media.mrliving.com.tw/path/to/image.jpg"
 *
 * @param val - The media URL string in template format or a regular URL
 * @returns The parsed URL string or null if input is invalid
 *
 * @example
 * parseMediaUrl("{{media url=wysiwyg/image.jpg}}")
 * // Returns: "https://media.mrliving.com.tw/wysiwyg/image.jpg"
 */
export const parseMediaUrl = (val: unknown): string | null => {
  if (val == null) return null;

  const s = String(val).trim();

  if (s.startsWith("{{media url=")) {
    // Step 1: Remove trailing "}}"
    let out = s.replace(/\}\}\s*$/, "");

    // Step 2: Replace "{{media url=" with domain URL
    out = out.replace(/^\{\{media url=/, MEDIA_URL + "/");

    return out;
  }

  return s || null;
};

/**
 * Constructs image URL from product image path.
 *
 * @param imgUrl - The product image path (e.g., "/e/a/example.jpg")
 * @returns Object containing img_src and img_srcset
 */
export const getImgUrl = (
  imgUrl: string
): { img_srcset: string; img_src: string } => {
  const productImgPath = imgUrl.replace(/\\/g, "");
  const img_srcset = `{{media url=catalog/product/cache/912f4218b83600a6f47af6c76f1f9667${productImgPath}}}`;
  const img_src = `{{media url=catalog/product/cache/912f4218b83600a6f47af6c76f1f9667${productImgPath}}}`;
  return { img_srcset, img_src };
};

// Helper function to construct product URL from url_key
export function parseProductUrl(urlKey: string): string {
  return `${BASE_URL}/${urlKey}.html`;
}

export function sheetArrData2RowData(arrData: string[][]): Row[] {
  return arrData.map((row: string[]) => {
    const dotSkus: DotSku[] = [];
    for (let i = 4; i < row.length; i++) {
      dotSkus.push({
        sku: row[i],
        top: row[i + 1],
        left: row[i + 2],
      });
    }

    return {
      product_sku: row[0],
      prod_name: row[1],
      url: row[2],
      img: row[3],
      dot_skus: dotSkus,
    };
  });
}

export function rowData2SheetArrData(rowData: Row[]): string[][] {
  return rowData.map((row) => {
    return [
      row.product_sku,
      row.prod_name,
      row.url || "",
      row.img || "",
      ...row.dot_skus.map((dot) => dot.sku),
      ...row.dot_skus.map((dot) => dot.top),
      ...row.dot_skus.map((dot) => dot.left),
    ];
  });
}