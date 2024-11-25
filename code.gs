function doGet(){
  return HtmlService.createTemplateFromFile('login').evaluate()
  .setTitle('Epic Coding Channel')
  .setFaviconUrl('https://cdn.jsdelivr.net/gh/EPICCODING17/image/Logo-EicCoding.png')
  .addMetaTag('viewport', 'width=device-width, initial-scale=1')
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function loadPageContent(page) {
  if (page === 'transmittal') {
    return HtmlService.createTemplateFromFile('transmittal').evaluate().getContent();
  } else if (page === 'lockscreen') {
    return HtmlService.createTemplateFromFile('lockscreen').evaluate().getContent();
  } else if (page === 'login') {  // Added login page condition
    return HtmlService.createTemplateFromFile('login').evaluate().getContent();
  } else if (page === 'calendar') {  // Added calendar page condition
    return HtmlService.createTemplateFromFile('calendar').evaluate().getContent();
  } else if (page === 'admin-dashboard') {  // Added admin dashboard condition
    return HtmlService.createTemplateFromFile('admin-dashboard').evaluate().getContent();
  }
  // Add logic for other pages like dashboard
  return HtmlService.createTemplateFromFile('dashboard').evaluate().getContent();
}


function include(filename){
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function logout() {
  return loadPageContent('login');
}

function checkLogin(username, password) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Login');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] == username && data[i][7] == password) {
      Logger.log('User found: ' + JSON.stringify(data[i]));
      return {
        name: data[i][2],
        address: data[i][3],
        type: data[i][4], // USER or Administrator
        store: data[i][5], // if type === 'USER' then indicator = storeName, else type === 'Administator then indicator = "ADMIN"
        username: data[i][6],
        password: data[i][7]
      };
    }
  }
  Logger.log('User not found or incorrect password');
  return null;
}

function servePage(type, store, name, address, username, password) {
  var html, js, css;

  // Check the user type and load corresponding HTML
  if (type === 'Administrator') {
    html = HtmlService.createHtmlOutputFromFile('index').getContent();
  } else if (type === 'USER') {
    html = HtmlService.createHtmlOutputFromFile('index').getContent();
  } else {
    html = HtmlService.createHtmlOutputFromFile('login').getContent();
  }

  // Load the JS and CSS content
  css = HtmlService.createHtmlOutputFromFile('css').getContent();
  js = HtmlService.createHtmlOutputFromFile('js').getContent();
  dashboard = HtmlService.createHtmlOutputFromFile('js-dashboard').getContent();
  transmittal = HtmlService.createHtmlOutputFromFile('js-transmittal').getContent();
  admin = HtmlService.createHtmlOutputFromFile('js-admin').getContent();

  // Append the CSS inside the <head> tag and JS before the closing </body> tag
  html = html.replace('</head>', css + '</head>');  // Insert JS before closing </body> tag
  html = html.replace('</body>', js + '</body>');  // Insert JS before closing </body> tag
  html = html.replace('</body>', dashboard + '</body>');  // Insert JS before closing </body> tag
  html = html.replace('</body>', transmittal + '</body>');  // Insert JS before closing </body> tag
  html = html.replace('</body>', admin + '</body>');  // Insert JS before closing </body> tag

  // Inject user type, store name, name, and address as script variables
  const storeName = type === 'USER' ? store : 'ADMIN'; // If user is 'USER', use the actual store, otherwise 'ADMIN'
  html = html.replace('</head>', 
    `<script>
       var userType = '${type}';
       var storeName = '${storeName}';
       var name = '${name}';
       var username = '${username}';
       var password = '${password}';
       var userAddress = '${address}';
    </script></head>`
  );

  return html;
}

/**
 * Retrieves store transmittal data based on user type and store name.
 * @param {string} storeName - The name of the store to get data for.
 * @param {string} logintype - The type of login ('USER' or 'Administrator').
 * @return {string} - JSON string containing formatted transmittal data.
 */
function getStoreTransmittalData(storeName) {
  try {
    // Define sheet based on storeName
    let sheetName = storeName || 'RRG'; // Default to 'RRG' if storeName is not provided

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error("Sheet '" + sheetName + "' not found");
    }

    // Fetch data from the sheet
    const dataRange = sheet.getRange('A2:K' + sheet.getLastRow());
    const values = dataRange.getValues();

    // Format data for the DataTable
    const formattedData = values.map(row => ({
      ID: row[0],
      Date: row[1],
      'DR Number': row[2],
      Vendor: row[3],
      Type: row[4],
      Amount: row[5],
      Status: row[6],
      Transmitted: row[7],
      Received: row[8],
      Late: row[9],
      Remarks: row[10]
    }));

    // Return the formatted data as JSON
    return JSON.stringify(formattedData);

  } catch (error) {
    console.error('Error fetching store transmittal data:', error);
    return JSON.stringify([]);  // Return empty array on error
  }
}

function addData(form) {
  try {
    // Helper function to format date as mm/dd/yyyy
    function formatDate(date) {
      var d = new Date(date);
      var day = d.getDate();
      var month = d.getMonth() + 1;
      var year = d.getFullYear();
      return (month < 10 ? '0' : '') + month + '/' + (day < 10 ? '0' : '') + day + '/' + year;
    }

    // Extract and format form data
    var date = formatDate(form.date);
    var drnumber = form.drnumber;
    var vendor = form.vendor;
    var type = form.type;
    var amount = form.amount;
    var status = form.status;
    var transmitted = formatDate(form.transmitted);
    var received = form.received;
    var late = form.late;
    var remarks = form.remarks;
    var targetSheetName = form.store;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(targetSheetName);
    
    if (!sheet) {
      throw new Error("Sheet not found: " + targetSheetName);
    }

    // Get the last row's ID and increment it
    var lastRow = sheet.getLastRow();
    var lastId = 0;

    if (lastRow > 0) {
      var lastIdValue = sheet.getRange(lastRow, 1).getValue();
      lastId = parseInt(lastIdValue) || 0;
    }

    var newId = lastId + 1;

    // Add data to sheet
    sheet.appendRow([newId, date, drnumber, vendor, type, amount, status, transmitted, received, late, remarks]);

    return "Data submitted successfully.";
  } catch (error) {
    Logger.log("Error: " + error.toString());
    return "Error: " + error.toString();
  }
}

function updateData(formData) {
  try {
    if (!formData || !formData.editStore) {
      throw new Error("Form data is missing or invalid.");
    }

    // Log received form data
    Logger.log("Received form data: " + JSON.stringify(formData));

    var targetSheetName = formData.editStore;
    var id = String(formData.editId).trim(); // Convert to string and trim any whitespace
    if (!targetSheetName || !id) {
      throw new Error("Sheet name or ID is missing.");
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(targetSheetName);

    if (!sheet) {
      throw new Error("Sheet not found: " + targetSheetName);
    }

    // Extract and format form data
    var date = formatDate(formData.editDate);
    var drnumber = formData.editDRnumber;
    var vendor = formData.editVendor;
    var type = formData.editType;
    var amount = formData.editAmount;
    var status = formData.editStatus;
    var transmitted = formatDate(formData.editTransmitted);
    var received = formData.editReceived;
    var late = formData.editLate;
    var remarks = formData.editRemarks;

    // Log extracted values
    Logger.log("Searching for ID: " + id);
    Logger.log("Formatted values: " + [id, date, drnumber, vendor, type, amount, status, transmitted, received, late, remarks].join(', '));

    // Find the row by ID (assuming ID is in column A)
    var dataRange = sheet.getRange('A2:A' + sheet.getLastRow());
    var ids = dataRange.getValues().flat().map(String); // Convert all IDs to strings for comparison
    Logger.log("Available IDs: " + ids.join(', ')); // Log all IDs for debugging
    var rowIndex = ids.indexOf(id) + 2; // +2 to adjust for header and 0-based index

    if (rowIndex < 2) {
      throw new Error("ID not found: " + id);
    }

    // Update the data in the sheet
    // Assuming your sheet has 10 columns for data (excluding ID)
    var dataToUpdate = [date, drnumber, vendor, type, amount, status, transmitted, received, late, remarks];
    if (dataToUpdate.length !== 10) {
      throw new Error("Data array does not match the expected column count.");
    }
    sheet.getRange(rowIndex, 2, 1, dataToUpdate.length).setValues([dataToUpdate]);

    return "Data updated successfully.";
  } catch (error) {
    Logger.log("Error: " + error.toString());
    return "Error: " + error.toString();
  }
}

function formatDate(date) {
  var d = new Date(date);
  var day = d.getDate();
  var month = d.getMonth() + 1; // Months are zero-based
  var year = d.getFullYear();
  return (month < 10 ? '0' : '') + month + '/' + (day < 10 ? '0' : '') + day + '/' + year;
}

function deleteData(id, sheetName) {
  try {
    Logger.log("Attempting to delete row with ID:", id);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error("Sheet not found: " + sheetName);
    }

    var dataRange = sheet.getRange('A2:A' + sheet.getLastRow());
    var ids = dataRange.getValues().flat();
    var rowIndex = ids.indexOf(id);

    if (rowIndex === -1) {
      throw new Error("ID not found: " + id);
    }

    Logger.log("Deleting row index:", rowIndex + 2); // +2 to adjust for header and 0-based index
    sheet.deleteRow(rowIndex + 2);

    // Rearrange IDs after deletion
    rearrangeIds(sheet);

    return "Row deleted successfully.";
  } catch (error) {
    Logger.log("Error deleting row: " + error.toString());
    return "Error deleting row: " + error.toString();
  }
}

function updateBulkStatus(idsToUpdate, newStatus, sheetName) {
  try {
    Logger.log("Attempting to update status for rows with IDs: " + idsToUpdate.join(', ') + " to '" + newStatus + "'");

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error("Sheet not found: " + sheetName);
    }

    // Get the entire data range (assuming IDs are in column A)
    var idRange = sheet.getRange('A2:A' + sheet.getLastRow());
    var allIds = idRange.getValues().flat();

    // Column G corresponds to column index 7 (1-based index) for status
    var statusColumnIndex = 7;
    // Column I corresponds to column index 9 (1-based index) for the "Received" date
    var receivedColumnIndex = 9;

    // Get today's date and format it
    var today = new Date();
    var formattedDate = formatDate(today);

    // Iterate over each ID to update the corresponding row in column G (status) and column I (Received date)
    idsToUpdate.forEach(function(id) {
      var rowIndex = allIds.indexOf(id);
      if (rowIndex !== -1) {
        sheet.getRange(rowIndex + 2, statusColumnIndex).setValue(newStatus); // +2 for header and 0-based index
        sheet.getRange(rowIndex + 2, receivedColumnIndex).setValue(formattedDate); // Set formatted date in column I (Received)
        Logger.log("Updated ID: " + id + " at row " + (rowIndex + 2) + " to status: " + newStatus + " and received date: " + formattedDate);
      } else {
        Logger.log("ID not found: " + id);
      }
    });

    return "Status and received date updated successfully for selected rows.";
  } catch (error) {
    Logger.log("Error updating status and received date: " + error.toString());
    return "Error updating status and received date: " + error.toString();
  }
}

function deleteBulkData(ids, sheetName) {
  try {
    Logger.log("Attempting to delete rows with IDs: " + ids.join(', '));

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error("Sheet not found: " + sheetName);
    }

    var dataRange = sheet.getRange('A2:A' + sheet.getLastRow());
    var allIds = dataRange.getValues().flat();

    // Collect the row indices to be deleted, in reverse order to avoid shifting rows while deleting
    var rowsToDelete = [];
    ids.forEach(function(id) {
      var rowIndex = allIds.indexOf(id);
      if (rowIndex !== -1) {
        rowsToDelete.push(rowIndex + 2); // +2 to adjust for header and 0-based index
      } else {
        Logger.log("ID not found: " + id);
      }
    });

    if (rowsToDelete.length === 0) {
      throw new Error("No matching IDs found for deletion.");
    }

    Logger.log("Deleting row indices: " + rowsToDelete.join(', '));
    
    // Sort row indices in descending order to delete without affecting row order
    rowsToDelete.sort(function(a, b) { return b - a; });

    rowsToDelete.forEach(function(rowIndex) {
      sheet.deleteRow(rowIndex);
    });

    // Rearrange remaining IDs after deletion
    rearrangeIds(sheet);

    return "Rows deleted successfully.";
  } catch (error) {
    Logger.log("Error deleting rows: " + error.toString());
    return "Error deleting rows: " + error.toString();
  }
}

function rearrangeIds(sheet) {
  var range = sheet.getRange('A2:A' + sheet.getLastRow()); // Adjust range if necessary
  var ids = range.getValues();
  
  for (var i = 0; i < ids.length; i++) {
    ids[i][0] = i + 1; // Set IDs to 1, 2, 3, etc.
  }
  
  range.setValues(ids);
}

function getVendorOptions() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendor');
  var data = sheet.getRange('A2:B' + sheet.getLastRow()).getValues();
  var vendors = [];
  var vendorTypeMap = {};

  data.forEach(function(row) {
    if (row[0] !== "") {
      vendors.push(row[0]);
      vendorTypeMap[row[0]] = row[1];
    }
  });

  Logger.log('Vendors:', vendors);
  Logger.log('Vendor Type Map:', vendorTypeMap);

  return {
    vendors: vendors,
    vendorTypeMap: vendorTypeMap
  };
}

function getDashboardData(storeName) {
    try {
        const defaultSheetName = 'RRG';
        const sheetName = storeName || defaultSheetName;
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = spreadsheet.getSheetByName(sheetName);

        if (!sheet) {
            Logger.log(`Sheet '${sheetName}' not found. Falling back to default '${defaultSheetName}'.`);
            return getDashboardData(defaultSheetName); 
        }

        const dataRange = sheet.getRange('A2:J' + sheet.getLastRow());
        const values = dataRange.getValues();

        let weeklyDRCount = 0;
        const weeklyTransmittalData = [];
        const monthlyData = {};
        const drCountByMonth = {}; 
        const lateCountsByMonth = {}; 

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth(); 
        const currentYear = currentDate.getFullYear();
        const currentWeekDates = getCurrentWeekDates();

        values.forEach(row => {
            const drDate = new Date(row[7]); 
            const status = row[6]; 
            const late = row[9]; 
            const drNumber = row[2]; 

            // Get month-year key for the current row's date
            const monthYear = getMonthYearKey(drDate);

            // Initialize monthly data structure if it doesn't exist
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    totalDR: 0,
                    lateDR: 0,
                    pendingCount: 0,
                    receivedCount: 0,
                    notReceivedCount: 0,
                    vendors: {} // Add a vendors object to track vendor counts
                };
            }

            if (drNumber) {
                drCountByMonth[monthYear] = (drCountByMonth[monthYear] || 0) + 1;
                monthlyData[monthYear].totalDR++;
            }

            if (isDateInRange(drDate, currentWeekDates)) {
                weeklyDRCount++;
                weeklyTransmittalData.push({
                    ID: row[0],
                    Date: row[1],
                    'DR Number': drNumber,
                    Vendor: row[3],
                    Type: row[4],
                    Amount: row[5],
                    Status: status,
                    Transmitted: row[7],
                    Received: row[8], 
                    Late: late,
                    Remarks: row[10]
                });
            }

            // Count statuses for the current month
            if (status === 'PENDING') {
                monthlyData[monthYear].pendingCount++;
            }
            if (status === 'RECEIVED') {
                monthlyData[monthYear].receivedCount++;
            }
            if (status === 'NOT RECEIVED') {
                monthlyData[monthYear].notReceivedCount++;
            }

            if (late === '✔') {
                lateCountsByMonth[monthYear] = (lateCountsByMonth[monthYear] || 0) + 1;
                monthlyData[monthYear].lateDR++;
            }

            // Count vendors for the current month
            const vendor = row[3]; // Assuming Vendor is in column D (index 3)
            if (vendor) {
                monthlyData[monthYear].vendors[vendor] = (monthlyData[monthYear].vendors[vendor] || 0) + 1;
            }
        });

        const lastThreeMonths = getLastThreeMonthsData(currentYear, currentMonth, monthlyData, lateCountsByMonth);
        const currentMonthKey = getMonthYearKey(new Date(currentYear, currentMonth, 1));
        
        // Pass vendor counts from monthly data to the dashboard data
        const vendorCounts = monthlyData[currentMonthKey]?.vendors || {};

        const dashboardData = {
            drCount: drCountByMonth,
            pendingCount: Object.values(monthlyData).reduce((sum, data) => sum + data.pendingCount, 0),
            receivedCount: Object.values(monthlyData).reduce((sum, data) => sum + data.receivedCount, 0),
            notReceivedCount: Object.values(monthlyData).reduce((sum, data) => sum + data.notReceivedCount, 0),
            lateCount: lateCountsByMonth,
            weeklyDRCount,
            weeklyTransmittalData,
            vendorCounts,
            monthlyData: lastThreeMonths 
        };

        Logger.log(`Fetched data for store '${sheetName}':`, JSON.stringify(dashboardData));
        return JSON.stringify(dashboardData);

    } catch (error) {
        Logger.log('Error fetching dashboard data:', error);
        return JSON.stringify({
            drCount: {},
            pendingCount: 0,
            receivedCount: 0,
            notReceivedCount: 0,
            lateCount: {},
            weeklyDRCount: 0,
            weeklyTransmittalData: [],
            vendorCounts: {},
            monthlyData: []
        });
    }
}

// Helper function to format a date as YYYY-MM
function getMonthYearKey(date) {
    return `${date.getFullYear ()}-${date.getMonth() + 1}`;
}

// Helper function to prepare data for the last three months
function getLastThreeMonthsData(currentYear, currentMonth, monthlyData, lateCountsByMonth) {
    const lastThreeMonths = [];
    for (let i = 0; i < 3; i++) {
        const monthToCheck = new Date(currentYear, currentMonth - i, 1); // Month to check
        const monthKey = getMonthYearKey(monthToCheck);
        lastThreeMonths.push({
            month: monthKey,
            totalDR: monthlyData[monthKey]?.totalDR || 0,
            lateDR: lateCountsByMonth[monthKey] || 0,
            pendingCount: monthlyData[monthKey]?.pendingCount || 0,
            receivedCount: monthlyData[monthKey]?.receivedCount || 0,
            notReceivedCount: monthlyData[monthKey]?.notReceivedCount || 0
        });
    }
    return lastThreeMonths;
}

// Helper function to count vendor occurrences for the current month
function countVendorData(weeklyTransmittalData, currentMonthKey) {
    const vendorCounts = {};
    weeklyTransmittalData.forEach(row => {
        const drDate = new Date(row['Transmitted']); // Use Column H (Transmitted Date)
        const monthKey = getMonthYearKey(drDate);
        if (monthKey === currentMonthKey) { // Only count vendors for the current month
            const vendor = row.Vendor;
            if (vendor) {
                vendorCounts[vendor] = (vendorCounts[vendor] || 0) + 1;
            }
        }
    });
    return vendorCounts;
}

// Helper function to get current week date range (Monday to Sunday)
function getCurrentWeekDates() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Get the current day of the week (0-6, 0 = Sunday, 6 = Saturday)
    const distanceToMonday = (dayOfWeek + 6) % 7; // Calculate distance from today to Monday
    
    // First day of the current week (Monday)
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - distanceToMonday);
    firstDayOfWeek.setHours(0, 0, 0, 0); // Set time to the start of the day
    
    // Last day of the current week (Sunday)
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999); // Set time to the end of the day
    
    return { start: firstDayOfWeek, end: lastDayOfWeek };
}

// Helper function to check if a date falls within a given date range
function isDateInRange(date, range) {
    // Normalize the date by setting the time to 00:00:00
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    return normalizedDate >= range.start && normalizedDate <= range.end;
}

function serveDashboard(storeName) {
    const data = getDashboardData(storeName);
    return HtmlService.createHtmlOutputFromFile('dashboard.html')
        .append(`<script>var dashboardData = ${data};</script>`);
}

const STORE_CATEGORIES = {
    JOLLIBEE: ['JB1', 'JB2', 'JB3', 'JB4', 'JBLanao', 'JBMar', 'JBELSA'],
    RED_RIBBON: ['RRG', 'RRT', 'RRR', 'RRQ', 'RRLanao'],
    CHOWKING: ['CKA', 'CKG'],
    GREENWICH: ['GWG', 'GWT'],
    MANG_INASAL: ['MIT']
};

function getAdminDashboardData() {
    try {
        const allData = fetchAllStoreData();
        const consolidatedData = Object.values(allData).flat();
        const dashboardData = processMonthlyData(consolidatedData);
        
        Logger.log('Final Dashboard Data:', JSON.stringify(dashboardData, null, 2));
        
        return JSON.stringify({
            storeData: allData,
            dashboardSummary: dashboardData
        });
    } catch (error) {
        Logger.log('Error in getAdminDashboardData:', error);
        return JSON.stringify(getDefaultErrorResponse());
    }
}

function fetchAllStoreData() {
    const allData = {};
    Object.entries(STORE_CATEGORIES).forEach(([category, stores]) => {
        Logger.log(`Processing ${category} stores...`);
        stores.forEach(store => {
            const storeData = fetchStoreData(store);
            allData[store] = storeData;
            Logger.log(`${store} Data Count: ${storeData.length}`);
        });
    });
    return allData;
}

function fetchStoreData(sheetName) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
        Logger.log(`Warning: Sheet '${sheetName}' not found`);
        return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
        Logger.log(`Note: Sheet '${sheetName}' has no data rows`);
        return [];
    }

    const dataRange = sheet.getRange(`A2:K${lastRow}`);
    const values = dataRange.getValues();

    Logger.log(`Successfully fetched ${values.length} rows from ${sheetName}`);
    return values;
}

function processMonthlyData(allData) {
    const metrics = initializeMetrics();
    const currentMonthYear = getMonthYearKey(new Date());

    allData.forEach((row, index) => {
        if (!isValidRow(row)) {
            Logger.log(`Skipping invalid row at index ${index}`);
            return;
        }

        // Adjust indices based on your spreadsheet columns (A through K)
        const status = row[6];      // Column G - STATUS
        const transmittedDate = new Date(row[7]); // Column H - TRANSMITTED
        const late = row[9];        // Column J - LATE

        const monthYear = getMonthYearKey(transmittedDate);

        // Only process current month's data
        if (monthYear === currentMonthYear) {
            metrics.drCount++;

            // Update status counts
            switch(status.toUpperCase()) {
                case 'PENDING':
                    metrics.pendingCount++;
                    break;
                case 'RECEIVED':
                    metrics.receivedCount++;
                    break;
                case 'NOT RECEIVED':
                    metrics.notReceivedCount++;
                    break;
            }

            // Update late count
            if (late === '✔') {
                metrics.lateCount++;
            }
        }
    });

    logMetricsBreakdown(metrics);
    return metrics;
}

function fetchStoreData(sheetName) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
        Logger.log(`Warning: Sheet '${sheetName}' not found`);
        return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
        Logger.log(`Note: Sheet '${sheetName}' has no data rows`);
        return [];
    }

    // Get all columns (A through K)
    const dataRange = sheet.getRange(2, 1, lastRow - 1, 11);
    const values = dataRange.getValues();

    // Filter out empty rows
    const filteredValues = values.filter(row => row[0] && row[2]); // Check ID and DR NUMBER

    Logger.log(`Successfully fetched ${filteredValues.length} rows from ${sheetName}`);
    return filteredValues;
}

function isValidRow(row) {
    return row && 
           row.length >= 10 && // Make sure we have enough columns
           row[6] && // Status exists
           row[7]; // Transmitted date exists
}

function getMonthYearKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function initializeMetrics() {
    return {
        drCount: 0,
        pendingCount: 0,
        receivedCount: 0,
        notReceivedCount: 0,
        lateCount: 0,
        monthlyStats: {}
    };
}

// Add debug logging
function updateStoreMetrics(storeData) {
    console.log('Processing store data:', storeData);
    const metrics = {
        pending: 0,
        received: 0,
        notReceived: 0,
        late: 0,
        dr: 0
    };

    storeData.forEach((row, index) => {
        console.log(`Processing row ${index + 1}:`, row);
        
        const status = row[6];  // STATUS column
        const late = row[9];    // LATE column

        metrics.dr++;

        if (status === 'PENDING') {
            metrics.pending++;
        } else if (status === 'RECEIVED') {
            metrics.received++;
        } else if (status === 'NOT RECEIVED') {
            metrics.notReceived++;
        }

        if (late === '✔') {
            metrics.late++;
        }

        console.log(`Current metrics after row ${index + 1}:`, {...metrics});
    });

    console.log('Final metrics:', metrics);
    return metrics;
}

function isValidRow(row) {
    return row && row.length >= 8 && row[7]; // Ensure transmitted date exists
}

function getMonthYearKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function logMetricsBreakdown(metrics) {
    Logger.log('=== Metrics Breakdown (Current Month) ===');
    Logger.log('DR Count:', metrics.drCount);
    Logger.log('Pending:', metrics.pendingCount);
    Logger.log('Received:', metrics.receivedCount);
    Logger.log('Not Received:', metrics.notReceivedCount);
    Logger.log('Late Count:', metrics.lateCount);
    Logger.log('Monthly Statistics (All Months):', JSON.stringify(metrics.monthlyStats, null, 2));
}

function getDefaultErrorResponse() {
    return {
        drCount: 0,
        pendingCount: 0,
        receivedCount: 0,
        notReceivedCount: 0,
        lateCount: 0,
        monthlyStats: {},
        error: true
    };
}
