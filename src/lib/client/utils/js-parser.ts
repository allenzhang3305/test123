/**
 * Safely evaluates text content to extract array data.
 * Handles various formats:
 * - HTML with <script> tags containing allRecomComboData
 * - Raw JavaScript array literals
 * - JS module exports
 * 
 * Consolidates logic previously duplicated in:
 * - useHtmlUpload.ts
 * - useJsUpload.ts
 * - edit-combo/page.tsx (handleImportFromText)
 * 
 * @param text - Raw text content (HTML or JS)
 * @returns Parsed array of combo data
 * @throws Error if text cannot be parsed as array
 */
export function parseComboArray(text: string): unknown[] {
  // Extract content from <script> tags
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  const scriptMatches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(text)) !== null) {
    scriptMatches.push(match[1].trim());
  }

  // If no script tags found, treat as plain JavaScript
  const jsContent = scriptMatches.length > 0 ? scriptMatches.join("\n") : text;

  // Strategy 1: Try to find allRecomComboData variable
  try {
    const sanitized = jsContent
      .replace(/\bexport\s+default\b/g, "")
      .replace(/\bexport\b/g, "");
    const fn1 = new Function(
      `${sanitized}; return (typeof allRecomComboData !== 'undefined' ? allRecomComboData : undefined);`
    );
    const r1 = fn1();
    if (Array.isArray(r1)) return r1;
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Try to extract array literal directly
  try {
    const start = jsContent.indexOf("[");
    const end = jsContent.lastIndexOf("]");
    if (start >= 0 && end > start) {
      const literal = jsContent.slice(start, end + 1);
      const fn2 = new Function(`return (${literal});`);
      const r2 = fn2();
      if (Array.isArray(r2)) return r2;
    }
  } catch {
    // Continue to next strategy
  }

  // Strategy 3: Try to evaluate as direct array expression
  try {
    const fn3 = new Function(`return (${jsContent});`);
    const r3 = fn3();
    if (Array.isArray(r3)) return r3;
  } catch {
    // Fall through to error
  }

  throw new Error("Input did not evaluate to an array");
}

/**
 * Type guard to check if unknown value has expected combo item shape
 */
export interface ParsedComboItem {
  sku?: unknown;
  name?: unknown;
  img?: unknown;
  dots?: unknown[];
}

/**
 * Type guard to check if unknown value has expected dot shape
 */
export interface ParsedComboDot {
  sku?: unknown;
  top?: unknown;
  left?: unknown;
}

/**
 * Safely extracts string value from unknown
 */
export function extractString(val: unknown, fallback = ""): string {
  if (val == null) return fallback;
  return String(val).trim() || fallback;
}
