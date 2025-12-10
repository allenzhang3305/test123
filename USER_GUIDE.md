# Product Combo Management - User Guide

## Overview

This web application helps you manage product combo data by uploading CSV or JavaScript files, visualizing product relationships, and scraping product images from URLs.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- CSV files or JavaScript files containing product combo data

### Environment Setup

Before running the application, ensure you have the following environment variable set in your `.env.local` file:

```
NEXT_PUBLIC_BASE_URL=https://xxxxxxxxxx
NEXT_PUBLIC_MEDIA_ORIGIN=https://xxxxxxxxx
```

## Navigation

The application features a static left sidebar with the following navigation options:

- **Home** - Main landing page with links to different sections
- **Edit Combo** - Upload and manage combo data
- **View Production** - Scrape and view product images

## Main Features

### 1. Edit Combo Page

The Edit Combo page allows you to upload and visualize product combo data.

#### Uploading Files

You can upload files in two ways:

1. **Drag and Drop**: Drag a file over the upload area (the area will highlight when dragging)
2. **Click to Choose**: Click on the upload area to open the file picker

#### Supported File Formats

##### CSV Format

The CSV file should follow this format:

```csv
product_sku,prod_name,url,img,dot_skus,dot_pos
22-0141-0-19,22-0140-0-19,,,,20:20,,,
```

**Columns:**
- `product_sku` - Main product SKU
- `dot_skus` - Semicolon-separated list of dot product SKUs (optional, e.g., "DOT001;DOT002;DOT003")
- `dot_pos` - Semicolon-separated list of position coordinates in format "top:left" (e.g., "20:20;30:40;50:60")

**Note:** The application automatically fetches product names and URLs from the API using the product SKUs.

##### JavaScript Format

The JavaScript file should contain an `allRecomComboData` array with the following structure:

```javascript
const allRecomComboData = [
  {
    name: "Product Name",
    sku: "22-0141-0-19",
    img: "{{media url=wysiwyg/image.jpg}}",
    dots: [
      {
        sku: "22-0140-0-19",
        top: "62%",
        left: "75%",
        url: "{{store direct_url='product.html'}}"
      }
    ]
  }
];
```

#### Features

##### Data Table

- **Resizable Height**: Drag the bottom handle to adjust the table height (min: 100px, max: 800px)
- **Sticky Header**: Table header remains visible while scrolling
- **Click to Copy**: Click on any cell containing product names or SKUs to copy to clipboard
- **Scrollable**: Both horizontal and vertical scrolling supported

**Table Columns:**
- 商品名 (Product Name)
- 商品SKU (Product SKU)
- 前台連結 (Frontend URL)
- 白點商品1-4 SKU (Dot Product 1-4 SKUs)

##### Visualization

Below the data table, you'll find a visual representation of each combo:

- **Main Product Card**: Shows product image, name, and SKU
- **Dot Products**: Lists all associated dot products with:
  - Product image
  - SKU
  - Product name (fetched automatically)
  - Position coordinates (top/left) if available
  - Error indicator (red "(Not found)") if product cannot be fetched

**Note:** Product images for dot products are automatically fetched when data is loaded.

### 2. View Production Page

The View Production page allows you to scrape and view product images from URLs.

#### How to Use

1. **Prepare Data**: First, upload combo data in the Edit Combo page
2. **Navigate**: Go to View Production page from the sidebar
3. **Scrape**: Click the "Scrape" button to fetch images from all product URLs
4. **Filter**: Use filter buttons to view:
   - **All** - Show all products
   - **With image** - Show only products with images
   - **No image** - Show only products without images

#### Features

- **Image Cards**: Each product is displayed as a card with:
  - Product image (if available)
  - Product title/URL
  - Dot indicators showing positions on the image

## Keyboard Shortcuts & Tips

### Click to Copy

- Click on any product name or SKU in the table to copy it to clipboard
- A toast notification will confirm the copy action
- Works on all SKU elements throughout the application

### Table Management

- **Resize**: Hover over the bottom border of the table and drag to resize
- **Scroll**: Use mouse wheel or scrollbar to navigate through data
- **Clear Data**: Click the "Clear" button in the top right to remove all loaded data

## Troubleshooting

### Common Issues

1. **"Failed to fetch" error**
   - Check your internet connection
   - Verify the `NEXT_PUBLIC_BASE_URL` environment variable is set correctly
   - Ensure the API endpoint is accessible

2. **Product images not loading**
   - Check if the product SKU exists in the system
   - Verify the media URL format is correct
   - Look for red "(Not found)" indicators in the visualization

3. **CSV parsing errors**
   - Ensure the CSV file follows the correct format
   - Check that column headers match exactly
   - Verify there are no encoding issues (use UTF-8)

4. **JavaScript file parsing errors**
   - Ensure the file contains a valid `allRecomComboData` array
   - Check for syntax errors in the JavaScript file
   - Verify the structure matches the expected format

### Visual Feedback

- **Drag and Drop**: The upload area will highlight with a blue border and scale effect when dragging files
- **Loading States**: Spinner indicators show when processing files or fetching data
- **Error Messages**: Red alert boxes display error messages if something goes wrong

## Data Flow

1. **Upload** → File is parsed (CSV or JS)
2. **Fetch** → Product data is fetched from API (names, URLs, images)
3. **Store** → Data is stored in global state (Zustand)
4. **Display** → Data is shown in table and visualization
5. **Scrape** (optional) → Images are scraped from product URLs in View Production page

## Best Practices

1. **File Preparation**
   - Ensure CSV files are properly formatted with correct column headers
   - For JS files, validate the array structure before uploading
   - Include position data (top/left) for better visualization

2. **Data Management**
   - Use the Clear button to reset data before uploading new files
   - Check the visualization to verify all products loaded correctly
   - Look for red "(Not found)" indicators to identify missing products

3. **Performance**
   - Large files may take time to process
   - Image fetching happens automatically but may take a moment
   - Use the resizable table to optimize viewing space

## Support

For issues or questions:
- Check the browser console for error messages
- Verify environment variables are set correctly
- Ensure file formats match the expected structure

