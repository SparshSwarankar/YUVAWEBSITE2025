// ===== YUVA VOLUNTEER FORM BACKEND - (FINAL VERSION with Header Styling) =====

// --- CONFIGURATION ---
// PASTE THE ID OF YOUR EXISTING GOOGLE SHEET HERE
const SHEET_ID = '1r7SDgDxlERlpyYNB-9nUcuv2_5YFZNClzbDUQv-ekrY'; 
const SHEET_NAME = 'Submissions';

/**
 * You can run this function manually from the editor to create and style the headers
 * in the sheet you specified by its ID.
 */
function setupSheet() {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    let sheet = doc.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = doc.getSheets()[0].setName(SHEET_NAME);
      Logger.log(`The first sheet was renamed to "${SHEET_NAME}".`);
    }
    
    const finalSheet = doc.getSheetByName(SHEET_NAME);
    const headers = ['Timestamp', 'Full Name', 'Email', 'Phone', 'College', 'Interests', 'Skills'];

    if (finalSheet.getLastRow() === 0) {
      finalSheet.appendRow(headers);
      finalSheet.setFrozenRows(1);
      
      const headerRange = finalSheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#555879');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      
      Logger.log(`Headers were created and styled successfully in sheet: ${doc.getName()}`);
    } else {
      Logger.log('Sheet already contains data. Headers were not added.');
    }
  } catch (e) {
    Logger.log(`Error during setup: ${e.message}. Please check that your SHEET_ID is correct.`);
  }
}


/**
 * Handles POST requests from the volunteer form.
 */
function doPost(e) {
  try {
    const doc = SpreadsheetApp.openById(SHEET_ID);
    const sheet = doc.getSheetByName(SHEET_NAME);

    const headers = ['Timestamp', 'Full Name', 'Email', 'Phone', 'College', 'Interests', 'Skills'];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#555879');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
    }

    const newRow = [
      new Date(),
      e.parameter.fullName,
      e.parameter.email,
      e.parameter.phone,
      e.parameter.college,
      e.parameter.interests,
      e.parameter.skills
    ];
    
    sheet.appendRow(newRow);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Form submitted successfully!' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles OPTIONS requests for CORS pre-flight checks.
 * This corrected version simply returns a valid JSON response, which is all
 * that is needed to satisfy the browser's pre-flight check.
 */
function doOptions(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'SUCCESS' }))
    .setMimeType(ContentService.MimeType.JSON);
}