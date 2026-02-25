/**
 * Cloud Based Solutions - LinkedIn Lead Generator v3
 * Finds ServiceNow administrators and platform owners at OTHER companies
 * Now with search history logging
 */

const CONFIG = {
  SERP_API_KEY: '', // Add your SerpAPI key here
  LEADS_PER_BATCH: 35,

  // IT Directors and VP Technology at Hospitals & Large Companies in USA
  SEARCH_QUERIES: [
    // Hospital IT Directors
    'site:linkedin.com/in "Director of IT" "Hospital" -consultant -recruiter',
    'site:linkedin.com/in "IT Director" "Hospital" -consultant -recruiter',
    'site:linkedin.com/in "Director of Information Technology" "Hospital" -consultant',
    'site:linkedin.com/in "Director of IT" "Health System" -consultant -recruiter',
    'site:linkedin.com/in "IT Director" "Healthcare" -consultant -recruiter',
    'site:linkedin.com/in "Director of IT" "Medical Center" -consultant',

    // Hospital VP Technology
    'site:linkedin.com/in "VP of Technology" "Hospital" -consultant -recruiter',
    'site:linkedin.com/in "VP Technology" "Healthcare" -consultant -recruiter',
    'site:linkedin.com/in "Vice President Technology" "Hospital" -consultant',
    'site:linkedin.com/in "VP of IT" "Hospital" -consultant -recruiter',
    'site:linkedin.com/in "VP Information Technology" "Health System" -consultant',

    // Large Company IT Directors (Fortune 500 type)
    'site:linkedin.com/in "Director of IT" "Enterprise" -consultant -recruiter',
    'site:linkedin.com/in "IT Director" "Fortune" -consultant -recruiter',
    'site:linkedin.com/in "Director of Information Technology" "Corporation" -consultant',
    'site:linkedin.com/in "IT Director" "Inc" "United States" -consultant -recruiter',

    // Large Company VP Technology
    'site:linkedin.com/in "VP of Technology" "Enterprise" -consultant -recruiter',
    'site:linkedin.com/in "VP Technology" "Corporation" -consultant -recruiter',
    'site:linkedin.com/in "Vice President of IT" "Inc" -consultant -recruiter',
    'site:linkedin.com/in "VP Information Technology" "United States" -consultant'
  ]
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🎯 Lead Generator')
    .addItem('🔍 Run Search', 'runSearch')
    .addItem('✅ Mark Passed', 'markAsPassed')
    .addItem('❌ Mark Failed', 'markAsFailed')
    .addSeparator()
    .addItem('📤 Export Passed to Sheet', 'exportPassedToSheet')
    .addItem('🧹 Clear Leads Sheet', 'clearLeadsSheet')
    .addSeparator()
    .addItem('📊 Export to Excel', 'exportToExcel')
    .addItem('📜 View History', 'viewHistory')
    .addItem('👁️ View Seen URLs', 'viewSeenUrls')
    .addItem('⚙️ Setup Sheet', 'setupSheet')
    .addToUi();
}

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Leads') || ss.insertSheet('Leads');

  const headers = ['Status', 'Name', 'Title', 'Company', 'LinkedIn URL', 'Date Added'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#1a73e8').setFontColor('#fff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(5, 350);

  // Also setup Seen URLs sheet
  setupSeenUrlsSheet();

  SpreadsheetApp.getUi().alert('Setup complete!');
}

function setupSeenUrlsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Seen URLs');

  if (!sheet) {
    sheet = ss.insertSheet('Seen URLs');
    sheet.getRange(1, 1).setValue('URL');
    sheet.getRange(1, 2).setValue('Date First Seen');
    sheet.getRange(1, 1, 1, 2).setBackground('#424242').setFontColor('#fff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    // Hide the sheet so it doesn't clutter the UI
    sheet.hideSheet();
  }

  return sheet;
}

function getSeenUrls() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Seen URLs');

  if (!sheet) {
    sheet = setupSeenUrlsSheet();
    return new Set();
  }

  const data = sheet.getDataRange().getValues();
  const seenUrls = new Set();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      seenUrls.add(data[i][0].toLowerCase());
    }
  }

  return seenUrls;
}

function addToSeenUrls(urls) {
  if (urls.length === 0) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Seen URLs');

  if (!sheet) {
    sheet = setupSeenUrlsSheet();
  }

  const today = new Date().toLocaleDateString();
  const rows = urls.map(url => [url.toLowerCase(), today]);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, 2).setValues(rows);
}

function viewSeenUrls() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Seen URLs');

  if (!sheet) {
    ui.alert('No Seen URLs sheet yet. Run a search first.');
    return;
  }

  const totalSeen = sheet.getLastRow() - 1; // Minus header

  const response = ui.alert(
    'Seen URLs Tracker',
    'Total URLs ever seen: ' + totalSeen + '\n\n' +
    'These leads will never appear again, even after clearing the Leads sheet.\n\n' +
    'Do you want to view the Seen URLs sheet?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    sheet.showSheet();
    sheet.activate();
  }
}

function resetSeenUrls() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Seen URLs');

  if (!sheet) {
    ui.alert('No Seen URLs sheet to reset.');
    return;
  }

  const totalSeen = sheet.getLastRow() - 1;

  const response = ui.alert(
    'Reset Seen URLs',
    'WARNING: This will reset ALL ' + totalSeen + ' seen URLs.\n\n' +
    'You will start seeing previously seen leads again.\n\n' +
    'Are you sure?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    if (totalSeen > 0) {
      sheet.deleteRows(2, totalSeen);
    }
    ui.alert('Seen URLs reset. You will now see all leads again.');
  }
}

function runSearch() {
  const ui = SpreadsheetApp.getUi();

  if (!CONFIG.SERP_API_KEY) {
    ui.alert('Add your SerpAPI key to line 7 in the script editor.');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast('Searching...', 'Please wait', -1);

  let allLeads = [];
  const queryResults = []; // Track results per query for logging

  // Run each search query
  for (const query of CONFIG.SEARCH_QUERIES) {
    try {
      const leads = searchGoogle(query);
      queryResults.push({ query: query, count: leads.length });
      allLeads = allLeads.concat(leads);
      Utilities.sleep(1000); // Rate limit between searches
    } catch (e) {
      console.log('Search error: ' + e.message);
      queryResults.push({ query: query, count: 0, error: e.message });
    }
  }

  // Remove duplicates by URL
  const uniqueLeads = [];
  const seenUrls = new Set();
  for (const lead of allLeads) {
    const cleanUrl = lead.url.split('?')[0].toLowerCase();
    if (!seenUrls.has(cleanUrl)) {
      seenUrls.add(cleanUrl);
      uniqueLeads.push(lead);
    }
  }

  // Log this search run to history
  const newLeadsAdded = addLeadsToSheet(uniqueLeads);
  logSearchRun(queryResults, allLeads.length, uniqueLeads.length, newLeadsAdded);

  if (uniqueLeads.length === 0) {
    ui.alert('No results found. Check History tab for details.');
    return;
  }

  ss.toast('Found ' + uniqueLeads.length + ' leads! (' + newLeadsAdded + ' new)', 'Done', 5);
}

function searchGoogle(query) {
  const url = 'https://serpapi.com/search.json?q=' + encodeURIComponent(query) +
              '&api_key=' + CONFIG.SERP_API_KEY + '&num=50';

  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());

  if (!data.organic_results) return [];

  const leads = [];

  for (const result of data.organic_results) {
    if (!result.link.includes('linkedin.com/in/')) continue;

    const lead = parseResult(result);
    if (lead && !shouldExcludeLead(lead)) {
      leads.push(lead);
    }
  }

  return leads;
}

function parseResult(result) {
  const title = result.title || '';
  const snippet = result.snippet || '';

  // Parse name and job title from LinkedIn title format
  let name = '';
  let jobTitle = '';

  const match = title.match(/^([^-–]+)[-–]\s*(.+?)(?:\s*\||\s*-\s*LinkedIn)/i);
  if (match) {
    name = match[1].trim();
    jobTitle = match[2].trim();
  } else {
    name = title.replace(/\s*[-|].*LinkedIn.*/i, '').trim();
  }

  // Extract company
  let company = '';
  const companyMatch = snippet.match(/(?:at|@)\s+([^·.]+)/i);
  if (companyMatch) {
    company = companyMatch[1].trim();
  }

  // Clean URL (remove tracking params)
  let url = result.link.split('?')[0];

  return { name, title: jobTitle, company, url };
}

function shouldExcludeLead(lead) {
  const text = (lead.company + ' ' + lead.title).toLowerCase();

  // Block consultants, recruiters, and vendors
  if (text.includes('consultant') ||
      text.includes('recruiter') ||
      text.includes('staffing') ||
      text.includes('freelance') ||
      text.includes('advisory') ||
      text.includes('partner') ||
      text.includes('vendor') ||
      text.includes('solutions provider')) {
    return true;
  }

  return false;
}

function addLeadsToSheet(leads) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Leads');

  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName('Leads');
  }

  if (leads.length === 0) {
    return 0;
  }

  // Get ALL ever-seen URLs (persistent across clears)
  const seenUrls = getSeenUrls();

  // Also check current sheet (in case Seen URLs is out of sync)
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][4]) seenUrls.add(data[i][4].toLowerCase().split('?')[0]);
  }

  // Filter out any leads we've EVER seen before
  const newLeads = leads.filter(lead => !seenUrls.has(lead.url.toLowerCase()));

  if (newLeads.length === 0) {
    return 0;
  }

  const today = new Date().toLocaleDateString();
  const rows = newLeads.map(lead => ['New', lead.name, lead.title, lead.company, lead.url, today]);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, 6).setValues(rows);

  // Make URLs clickable
  for (let i = 0; i < rows.length; i++) {
    sheet.getRange(lastRow + 1 + i, 5).setFormula('=HYPERLINK("' + rows[i][4] + '","' + rows[i][4] + '")');
  }

  // Add these URLs to permanent Seen URLs list
  const newUrls = newLeads.map(lead => lead.url.split('?')[0]);
  addToSeenUrls(newUrls);

  return newLeads.length;
}

function markAsPassed() {
  updateStatus('Passed');
}

function markAsFailed() {
  updateStatus('Failed');
}

function updateStatus(status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sheet) return;

  const range = sheet.getActiveRange();
  const startRow = range.getRow();
  const numRows = range.getNumRows();

  if (startRow === 1) return;

  for (let i = 0; i < numRows; i++) {
    sheet.getRange(startRow + i, 1).setValue(status);
  }

  // Move to next row
  if (startRow + numRows <= sheet.getLastRow()) {
    sheet.getRange(startRow + numRows, 1).activate();
  }
}

function exportToExcel() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const passed = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'Passed') passed.push(data[i]);
  }

  if (passed.length === 0) {
    SpreadsheetApp.getUi().alert('No passed leads to export.');
    return;
  }

  const batch = passed.slice(0, CONFIG.LEADS_PER_BATCH);
  const exportSS = SpreadsheetApp.create('Leads_' + new Date().toLocaleDateString().replace(/\//g, '-'));
  const exportSheet = exportSS.getActiveSheet();

  exportSheet.getRange(1, 1, 1, 5).setValues([['Name', 'Title', 'Company', 'LinkedIn URL', 'Date Added']]);
  exportSheet.getRange(2, 1, batch.length, 5).setValues(batch.map(r => [r[1], r[2], r[3], r[4], r[5]]));

  SpreadsheetApp.getUi().alert('Exported ' + batch.length + ' leads!\n\nOpen: ' + exportSS.getUrl());
}

// ============================================
// HISTORY & LOGGING FUNCTIONS
// ============================================

function setupHistorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('History');

  if (!sheet) {
    sheet = ss.insertSheet('History');
  }

  const headers = ['Run #', 'Date/Time', 'Total Raw Results', 'Unique Results', 'New Leads Added', 'Query Breakdown'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground('#6a1b9a').setFontColor('#fff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(6, 500);

  return sheet;
}

function logSearchRun(queryResults, totalRaw, uniqueCount, newLeadsAdded) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('History');

  if (!sheet) {
    sheet = setupHistorySheet();
  }

  // Get next run number
  const lastRow = sheet.getLastRow();
  const runNumber = lastRow; // Row 1 is headers, so lastRow = run number

  // Format query breakdown
  const breakdown = queryResults.map(q => {
    const shortQuery = q.query.replace('site:linkedin.com/in ', '').substring(0, 50);
    return shortQuery + ': ' + q.count + (q.error ? ' (error)' : '');
  }).join(' | ');

  // Format date/time
  const now = new Date();
  const dateTime = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

  // Add row
  const row = [runNumber, dateTime, totalRaw, uniqueCount, newLeadsAdded, breakdown];
  sheet.getRange(lastRow + 1, 1, 1, row.length).setValues([row]);

  // Color code based on results
  if (newLeadsAdded > 0) {
    sheet.getRange(lastRow + 1, 5).setBackground('#c8e6c9'); // Green for new leads
  } else {
    sheet.getRange(lastRow + 1, 5).setBackground('#ffcdd2'); // Red for no new leads
  }
}

function viewHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('History');

  if (!sheet) {
    sheet = setupHistorySheet();
    SpreadsheetApp.getUi().alert('History tab created. No searches logged yet.');
    return;
  }

  // Activate the History sheet
  sheet.activate();

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert('No searches logged yet. Run a search first.');
    return;
  }

  // Show summary
  const data = sheet.getDataRange().getValues();
  let totalLeads = 0;
  for (let i = 1; i < data.length; i++) {
    totalLeads += data[i][4] || 0;
  }

  SpreadsheetApp.getUi().alert(
    'Search History Summary\n\n' +
    'Total Runs: ' + (lastRow - 1) + '\n' +
    'Total New Leads Added: ' + totalLeads + '\n\n' +
    'See the History tab for full details.'
  );
}

// ============================================
// EXPORT & CLEAR FUNCTIONS
// ============================================

function exportPassedToSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Leads');

  if (!sheet) {
    SpreadsheetApp.getUi().alert('No Leads sheet found. Run Setup Sheet first.');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const passed = [];

  // Collect all passed leads (skip header row)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'Passed') {
      passed.push(data[i]);
    }
  }

  if (passed.length === 0) {
    SpreadsheetApp.getUi().alert('No passed leads to export.');
    return;
  }

  // Create new sheet with timestamp
  const now = new Date();
  const sheetName = 'Export_' + now.toLocaleDateString().replace(/\//g, '-') + '_' +
                    now.toLocaleTimeString().replace(/:/g, '-').replace(/\s/g, '');

  const exportSheet = ss.insertSheet(sheetName);

  // Add headers
  const headers = ['Name', 'Title', 'Company', 'LinkedIn URL', 'Date Added'];
  exportSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  exportSheet.getRange(1, 1, 1, headers.length).setBackground('#34a853').setFontColor('#fff').setFontWeight('bold');
  exportSheet.setFrozenRows(1);

  // Add passed leads (excluding Status column)
  const exportData = passed.map(row => [row[1], row[2], row[3], row[4], row[5]]);
  exportSheet.getRange(2, 1, exportData.length, 5).setValues(exportData);

  // Make URLs clickable
  for (let i = 0; i < exportData.length; i++) {
    const url = exportData[i][3];
    if (url) {
      exportSheet.getRange(i + 2, 4).setFormula('=HYPERLINK("' + url + '","' + url + '")');
    }
  }

  // Auto-resize columns
  exportSheet.setColumnWidth(4, 350);

  // Activate the new sheet
  exportSheet.activate();

  SpreadsheetApp.getUi().alert('Exported ' + passed.length + ' passed leads to "' + sheetName + '"!');
}

function clearLeadsSheet() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Leads');

  if (!sheet) {
    ui.alert('No Leads sheet found.');
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    ui.alert('Leads sheet is already empty.');
    return;
  }

  const leadsCount = lastRow - 1;

  // Confirm before clearing
  const response = ui.alert(
    'Clear Leads Sheet',
    'Are you sure you want to clear all ' + leadsCount + ' leads?\n\nThis cannot be undone.',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  // Delete all rows except header
  sheet.deleteRows(2, leadsCount);

  ui.alert('Cleared ' + leadsCount + ' leads from the sheet.');
}

function syncExistingLeadsToSeenUrls() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leadsSheet = ss.getSheetByName('Leads');

  if (!leadsSheet) {
    SpreadsheetApp.getUi().alert('No Leads sheet found.');
    return;
  }

  setupSeenUrlsSheet();

  const data = leadsSheet.getDataRange().getValues();
  const urls = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][4]) {
      urls.push(data[i][4].split('?')[0]);
    }
  }

  if (urls.length === 0) {
    SpreadsheetApp.getUi().alert('No URLs to sync.');
    return;
  }

  addToSeenUrls(urls);
  SpreadsheetApp.getUi().alert('Synced ' + urls.length + ' URLs to Seen URLs sheet.');
}
