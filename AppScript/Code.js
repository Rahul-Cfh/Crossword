var SHEET_NAME = 'Entries';
var HEADERS = ['Timestamp', 'First Name', 'Last Name', 'Company', 'Email', 'Score', 'ID'];

function doPost(e) {
  try {
    var params = parseParams(e);
    var sheet = getOrCreateSheet(SHEET_NAME);
    sheet.appendRow([
      new Date(),
      params.firstName || '',
      params.lastName || '',
      params.company || '',
      params.email || '',
      params.score || '',
      params.id || '',
    ]);
    return jsonOutput({ ok: true });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonOutput({ ok: true, message: 'Crossword raffle endpoint. POST to submit.' });
}

function parseParams(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents && e.postData.type === 'application/json') {
    try { return JSON.parse(e.postData.contents) || {}; } catch (_) { /* fallthrough */ }
  }
  return e.parameter || {};
}

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
