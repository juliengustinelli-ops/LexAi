# Cloud Based Solutions - LinkedIn Lead Generator

A Google Sheets tool for finding and managing ServiceNow-related leads from LinkedIn.

## Features

- **X-Ray Search**: Automated Google search for LinkedIn profiles matching your criteria
- **Vetting Workflow**: Quick pass/fail marking for manual profile review
- **Duplicate Detection**: Automatically skips leads already in your sheet
- **Company Enrichment**: Auto-populates company website info
- **Excel Export**: Export batches of 35 vetted leads

## Setup Instructions

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "CBS Lead Generator" (or whatever you prefer)

### Step 2: Add the Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `Code.gs` from this folder
4. Paste it into the Apps Script editor
5. Click **Save** (disk icon or Ctrl+S)

### Step 3: Get a SerpAPI Key (Free)

1. Go to [https://serpapi.com](https://serpapi.com)
2. Sign up for a free account (100 searches/month free)
3. Copy your API key from the dashboard

### Step 4: Add Your API Key

1. In the Apps Script editor, find this line near the top:
   ```javascript
   SERP_API_KEY: '', // Add your SerpAPI key here
   ```
2. Paste your API key between the quotes:
   ```javascript
   SERP_API_KEY: 'your_key_here',
   ```
3. Save the script

### Step 5: Authorize the Script

1. Go back to your Google Sheet
2. Refresh the page
3. You should see a new menu: **🎯 Lead Generator**
4. Click **Lead Generator > Setup Sheet**
5. Google will ask you to authorize the script - click through the prompts
   - Click "Advanced" > "Go to CBS Lead Generator (unsafe)" > "Allow"

## Usage

### Finding Leads

1. Click **Lead Generator > Run X-Ray Search**
2. The tool will search Google for LinkedIn profiles matching:
   - ServiceNow professionals
   - Platform Owners, Product Managers, Program Managers, Directors
   - Located in United States
   - Excluding consultants, partners, architects, and ServiceNow employees

### Vetting Leads

1. Click the LinkedIn URL to open each profile in a new tab
2. Check for:
   - Has a profile picture
   - Does NOT work for ServiceNow
   - Currently employed
   - Uses ServiceNow in their current role
3. Select the row(s) in Google Sheets
4. Click **Lead Generator > Mark Selected as Passed** or **Mark Selected as Failed**

### Quick Vetting Tips

- Open multiple LinkedIn tabs at once (click several URLs)
- Review quickly: photo + current job + ServiceNow mention
- Most vetting takes ~15 seconds per profile
- You can select multiple rows and mark them all at once

### Enriching Leads

1. After marking leads as Passed, click **Lead Generator > Enrich Passed Leads**
2. This adds estimated company website URLs

### Exporting Leads

1. Click **Lead Generator > Export Next 35 to Excel**
2. A new Google Sheet will be created with your leads
3. In the export sheet: **File > Download > Microsoft Excel (.xlsx)**

## Customizing the Search

To change the search criteria, edit the `SEARCH_QUERY` in the script:

```javascript
SEARCH_QUERY: 'site:linkedin.com/in "ServiceNow" AND ("Platform Owner" OR "Product Manager") AND "United States"'
```

### Search Query Tips

- `site:linkedin.com/in` - Only LinkedIn profiles
- `"exact phrase"` - Exact match required
- `AND` - All terms must appear
- `OR` - Any of the terms
- `-term` - Exclude results with this term

## Troubleshooting

### "API Key Required" error
Make sure you added your SerpAPI key to the script (Step 4)

### Menu not appearing
Refresh the Google Sheet page

### Authorization error
Follow the authorization steps again, clicking through "Advanced" and "Go to..."

### No results found
- Check your SerpAPI account has searches remaining
- Try simplifying the search query
- Google may be rate-limiting; wait a few minutes

## Data Fields

| Field | Description |
|-------|-------------|
| Status | New, Passed, Failed, or Exported |
| Name | Full name from LinkedIn |
| Title | Job title |
| Company | Current company |
| LinkedIn URL | Profile link (clickable) |
| Location | Geographic location |
| Company Website | Enriched company URL |
| Company Size | Company employee count (if available) |
| Industry | Company industry (if available) |
| Notes | Your notes about the lead |
| Date Added | When the lead was found |
| Date Exported | When the lead was exported |

## Limits

- **SerpAPI Free Tier**: 100 searches/month
- **Export Batch Size**: 35 leads per export
- **Google Apps Script**: 6 min execution limit per function

## Alternative: Manual Entry

If you prefer to add leads manually (from Sales Navigator, etc.):
1. Simply paste data directly into the sheet columns
2. Set Status to "New"
3. The vetting and export workflow works the same way
