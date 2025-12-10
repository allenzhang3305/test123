// Validate required environment variables at startup
if (!process.env.NEXT_PUBLIC_BASE_URL) {
  throw new Error(
    `Missing required environment variable: NEXT_PUBLIC_BASE_URL. ` +
    `Please set it in your .env.local file.`
  );
}

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

if (!process.env.NEXT_PUBLIC_MEDIA_URL) {
  throw new Error(
    `Missing required environment variable: NEXT_PUBLIC_MEDIA_URL. ` +
    `Please set it in your .env.local file.`
  );
}

export const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL;
