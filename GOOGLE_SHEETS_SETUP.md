# Google Sheets API Setup Guide

This guide will walk you through the steps to obtain the required environment variables for the Google Sheets update feature:
- `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SHEETS_PRIVATE_KEY`

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- A Google Sheet that you want to update (or create a new one)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click **"New Project"**
4. Enter a project name (e.g., "Product Combo Manager")
5. Select your organization and location if applicable
6. Click **"Create"**
7. Wait for the project to be created, then select it from the project dropdown

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, navigate to **"APIs & Services"** > **"Library"** (or go directly to [API Library](https://console.cloud.google.com/apis/library))
2. Search for **"Google Sheets API"**
3. Click on **"Google Sheets API"** from the search results
4. Click **"Enable"** to activate the API for your project

## Step 3: Create a Service Account

1. In the Google Cloud Console, navigate to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** at the top of the page
3. Select **"Service account"** from the dropdown menu
4. Fill in the service account details:
   - **Service account name**: Enter a descriptive name (e.g., "sheets-updater")
   - **Service account ID**: This will be auto-generated based on the name
   - **Description** (optional): Add a description like "Service account for updating Google Sheets"
5. Click **"Create and Continue"**
6. (Optional) Grant roles if needed - for basic usage, you can skip this step
7. Click **"Continue"** and then **"Done"**

## Step 4: Create and Download Service Account Key

1. In the **"Credentials"** page, find your newly created service account in the **"Service Accounts"** section
2. Click on the service account email address
3. Go to the **"Keys"** tab
4. Click **"Add Key"** > **"Create new key"**
5. Select **"JSON"** as the key type
6. Click **"Create"**
7. A JSON file will be automatically downloaded to your computer - **keep this file secure!**

## Step 5: Extract Environment Variables from JSON

Open the downloaded JSON file. It should look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Extract the Required Values:

1. **`GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL`**: 
   - Copy the value from `"client_email"` field
   - Example: `your-service-account@your-project.iam.gserviceaccount.com`

2. **`GOOGLE_SHEETS_PRIVATE_KEY`**:
   - Copy the entire value from `"private_key"` field (including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines)
   - The key may contain `\n` characters - these need to be preserved as actual newlines in your environment variable

## Step 6: Share Google Sheet with Service Account

1. Open the Google Sheet you want to update
2. Click the **"Share"** button in the top-right corner
3. In the "Share with people and groups" dialog, paste the service account email (the `client_email` from the JSON file)
4. Set the permission to **"Editor"** (or at least "Viewer" if you only need read access)
5. **Uncheck** "Notify people" (service accounts don't need email notifications)
6. Click **"Share"**

> **Important**: The service account must have at least "Editor" access to the Google Sheet for the update feature to work.

## Step 7: Configure Environment Variables

### Option A: Using `.env.local` file (Recommended for Development)

1. Create or edit the `.env.local` file in your project root directory
2. Add the following variables:

```env
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- Replace `your-service-account@your-project.iam.gserviceaccount.com` with your actual service account email
- Replace the private key with your actual private key from the JSON file
- Keep the quotes around the private key value
- The `\n` characters in the private key should remain as `\n` (they will be converted to actual newlines by the application)

### Option B: Using System Environment Variables (Production)

For production deployments, set these as environment variables in your hosting platform:

**Example for Vercel:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable with its value

**Example for other platforms:**
```bash
export GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
export GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
```

## Step 8: Verify Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Edit Combo page
3. Load some data (via CSV or JS file upload)
4. Click the **"Update Sheet"** button
5. Enter your Google Sheet ID when prompted
   - The Sheet ID can be found in the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
6. If everything is configured correctly, you should see a success message

## Troubleshooting

### Error: "Missing Google Sheets credentials"
- **Solution**: Make sure both environment variables are set in your `.env.local` file and restart your development server

### Error: "Failed to update Google Sheet" or "Permission denied"
- **Solution**: Verify that you've shared the Google Sheet with the service account email and granted "Editor" permissions

### Error: "Invalid credentials" or "Authentication failed"
- **Solution**: 
  - Double-check that the private key is correctly formatted with quotes
  - Ensure the `\n` characters are preserved in the private key
  - Verify the service account email is correct

### Error: "Spreadsheet not found"
- **Solution**: 
  - Verify the Sheet ID is correct (from the URL)
  - Ensure the service account has access to the sheet
  - Check that the sheet name is correct (defaults to "Sheet1" if not specified)

## Security Best Practices

1. **Never commit the JSON key file or `.env.local` to version control**
   - Add `.env.local` to your `.gitignore` file
   - The JSON key file should be kept secure and never shared

2. **Rotate keys periodically**
   - Delete old keys in Google Cloud Console
   - Create new keys and update your environment variables

3. **Limit service account permissions**
   - Only grant the minimum necessary permissions
   - Use separate service accounts for different purposes if needed

4. **Use environment-specific credentials**
   - Use different service accounts for development and production

## Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Cloud Service Accounts Guide](https://cloud.google.com/iam/docs/service-accounts)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

If you encounter any issues not covered in this guide, please check:
1. The application logs for detailed error messages
2. Google Cloud Console for service account status
3. The Google Sheet sharing settings

