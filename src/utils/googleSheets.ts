import type { PoolEntry } from '../types';

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * Google Apps Script for Hostel Swimming Pool Entry Record System
 * Instructions:
 * 1. Open your Google Sheet (sheets.new)
 * 2. Click Extensions > Apps Script
 * 3. Delete any default code and paste this entire script
 * 4. Click 'Deploy' > 'New deployment'
 * 5. Select type: 'Web app'
 * 6. Execute as: 'Me'
 * 7. Who has access: 'Anyone' (IMPORTANT!)
 * 8. Click 'Deploy', authorize permissions, and copy the Web App URL!
 * 9. Paste that URL into your Swimming Pool Warden Admin Panel.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Create header row if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Record ID",
        "Date",
        "Student Name",
        "Room No",
        "Student ID",
        "Phone",
        "Entry Time",
        "Timestamp Recorded"
      ]);
      sheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff");
    }
    
    var data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.id || "",
      data.date || new Date().toISOString().split('T')[0],
      data.name || "",
      data.roomNumber || "",
      data.studentId || "",
      data.phone || "",
      data.entryTime || "",
      new Date().toLocaleString()
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Sends entry record to Google Sheets via Webhook
 */
export async function syncEntryWithGoogleSheets(
  webhookUrl: string,
  entry: PoolEntry
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('https://script.google.com/')) {
    return { success: false, message: 'Google Sheets webhook URL is not configured or invalid.' };
  }

  const payload = {
    id: entry.id,
    date: entry.dateStr || new Date().toISOString().split('T')[0],
    name: entry.name,
    roomNumber: entry.roomNumber,
    studentId: entry.studentId,
    phone: entry.phone,
    entryTime: entry.entryTimeFormatted,
  };

  try {
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return { success: true, message: 'Recorded in Google Sheets successfully.' };
  } catch (err) {
    console.warn('Google Sheets sync failed:', err);
    return { success: false, message: 'Failed to communicate with Google Sheets.' };
  }
}
