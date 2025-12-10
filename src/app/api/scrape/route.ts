// app/api/scrape/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/lib/server/logger";
import { chromium, BrowserContext } from "playwright";
import robotsParser from "robots-parser";
import pLimit from "p-limit";
import { Dot } from "@/types";

export const runtime = "nodejs"; // ensure Node runtime for this segment
export const dynamic = "force-dynamic"; // never cache API responses

interface ScrapeResult {
  url: string;
  image: string | null;
  title?: string;
  dots: Dot[];
}

const requestBodySchema = z.object({
  urls: z.array(z.string().url("Each URL must be a valid URL")).max(60, "Maximum 60 URLs allowed"),
});

type RequestBody = z.infer<typeof requestBodySchema>;

const robotsCache = new Map<string, ReturnType<typeof robotsParser>>()

const isAllowedByRobots = async (targetUrl: string): Promise<boolean> => {
  try {
    const u = new URL(targetUrl)
    const robotsUrl = `${u.origin}/robots.txt`
    let robots = robotsCache.get(robotsUrl)
    if (!robots) {
      const res = await fetch(robotsUrl, { redirect: "follow" })
      if (!res.ok) return true
      const txt = await res.text()
      robots = robotsParser(robotsUrl, txt)
      robotsCache.set(robotsUrl, robots)
    }
    return robots.isAllowed(targetUrl, "Mozilla/5.0 (compatible; combo-guide-scraper)") ?? true
  } catch {
    return true
  }
}

const absolutize = (base: string, raw?: string | null): string | null => {
  if (!raw) return null
  try {
    return new URL(raw, base).toString()
  } catch {
    return null
  }
}

const scrapeOne = async (pageUrl: string, context: BrowserContext): Promise<ScrapeResult> => {
  const page = await context.newPage()
  const allowed = await isAllowedByRobots(pageUrl)
  if (!allowed) return { url: pageUrl, image: null, dots: [] }

  try {
    // Navigate; let the page bootstrap, then rely on locator waits for UI readiness.
    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 15_000 })

    // Wait until `.combo-guide` exists/visible.
    const target = page.locator(".combo-guide").first()
    await target.waitFor({ state: "attached", timeout: 8_000 })

    // Prefer <img> inside; fall back to common lazy-load attrs & srcset; final fallback: background-image.
    const img = target.locator("img.btn-trigger").first()
    let src =
      (await img.getAttribute("src")) ||
      (await img.getAttribute("data-src")) ||
      (await img.getAttribute("data-original")) ||
      (await img.getAttribute("data-lazy")) ||
      null

    if (!src) {
      const srcset = await img.getAttribute("srcset")
      if (srcset) {
        const first = srcset.split(",")[0]?.trim().split(/\s+/)[0]
        src = first || null
      }
    }

    if (!src) {
      // background-image: url("...") on the .combo-guide or its first child
      const bg = await target.evaluate((el) => {
        const get = (e: Element) => getComputedStyle(e as HTMLElement).backgroundImage
        const self = get(el)
        if (self && self !== "none") return self
        const child = el.querySelector("*")
        return child ? get(child) : null
      })
      const match = bg?.match(/url\\(["']?(.*?)["']?\\)/i)
      if (match?.[1]) src = match[1]
    }

    const image = absolutize(page.url(), src)

    const title = (await page.title()) || undefined

    // Extract all `.dot` elements under the combo-guide and read left/top
    const dots = await target.evaluate((root) => {
      const out: { left: string; top: string }[] = []
      root.querySelectorAll('.dot').forEach((el) => {
        const h = el as HTMLElement
        let left = h.style.left
        let top = h.style.top
        if ((!left || !top) && (globalThis as { getComputedStyle?: typeof getComputedStyle }).getComputedStyle) {
          const cs = getComputedStyle(h)
          left = left || cs.left
          top = top || cs.top
        }
        if (left && top) out.push({ left, top })
      })
      return out
    })

    logger.info(`scraped ${image}: ${pageUrl}`, { dots: dots })
    return { url: pageUrl, image, title, dots }
  } catch (err) {
    logger.warn(`scraped failed ${pageUrl}`, { err })
    return { url: pageUrl, image: null, dots: [] }
  } finally {
    await page.close()
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const { urls } = requestBodySchema.parse(rawBody);
    logger.info("scrape request received", { urlsCount: urls.length });
    const unique = Array.from(new Set(urls)).slice(0, 60);

    // Launch one browser for all URLs; reuse a single context and lightweight pages.
    const browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    })

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (compatible; combo-guide-scraper)",
      locale: "en-US",
      javaScriptEnabled: true,
    })
    // Block heavy resources we don't need to download.
    await context.route("**/*", (route) => {
      const type = route.request().resourceType()
      if (type === "image" || type === "media" || type === "font" || type === "stylesheet") {
        return route.abort()
      }
      return route.continue()
    })

    const concurrency = Math.max(1, Math.min(8, Number(process.env.SCRAPE_CONCURRENCY || 6)));
    const limit = pLimit(concurrency);
    const results = await Promise.all(unique.map((u) => limit(() => scrapeOne(u, context))));

    await context.close();
    await browser.close();
    return NextResponse.json({ results });
  } catch (err) {
    logger.error("scrape POST failed", { err });
    const errorMessage = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
