// app/api/crosssell/dummy/get/route.ts
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CrossSellItem {
  sku: string;
  link_type: string;
  linked_product_sku: string;
  linked_product_type: string;
  position: number;
}

const dummyFilePath = join(
  process.cwd(),
  "src",
  "app",
  "api",
  "crosssell",
  "crosssell-dummy-live.json"
);

const ensureDummyFileExists = async () => {
  try {
    await fs.access(dummyFilePath);
  } catch {
    await fs.writeFile(dummyFilePath, "[]", "utf-8");
  }
};

const ensureDummyFilePromise = ensureDummyFileExists();

export async function GET() {
  try {
    await ensureDummyFilePromise;
    const fileContent = await fs.readFile(dummyFilePath, "utf-8");
    const data = JSON.parse(fileContent) as CrossSellItem[];

    // add a delay of 1 second
    await new Promise((resolve) => setTimeout(resolve, 150));

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to read dummy crosssell data";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
