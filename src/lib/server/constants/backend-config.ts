if (!process.env.END_POINT) {
  throw new Error(
    `Missing required environment variable: END_POINT. ` +
    `Please set it in your .env.local file.`
  );
}

export const END_POINT = process.env.END_POINT;

// Google Sheets API configuration (optional, only needed for Google Sheets update feature)
// To use Google Sheets update:
// 1. Create a service account in Google Cloud Console
// 2. Enable Google Sheets API for your project
// 3. Download the service account JSON key
// 4. Share your Google Sheet with the service account email
// 5. Set the following environment variables:
//    - GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL: The service account email
//    - GOOGLE_SHEETS_PRIVATE_KEY: The private key from the JSON (with \n replaced as actual newlines)