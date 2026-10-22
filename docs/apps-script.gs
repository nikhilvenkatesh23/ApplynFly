const SPREADSHEET_ID = 'REPLACE_WITH_YOUR_GOOGLE_SHEET_ID';
const SHEET_NAME = 'Profile Evaluations';
const COUNTRIES = ['USA', 'UK', 'Canada', 'Germany', 'Australia', 'France', 'Singapore', 'New Zealand'];
const COURSE_LEVELS = ['UG', 'PG', 'MBA', 'PhD'];
const ENGLISH_TESTS = ['IELTS', 'TOEFL', 'PTE', 'Duolingo', 'Not taken yet'];
const GRE_GMAT_STATUSES = ['Not taken', 'Preparing', 'GRE taken', 'GMAT taken', 'Not required for my course'];
const BUDGETS = ['Under ₹10 lakh', '₹10–20 lakh', '₹20–35 lakh', 'Above ₹35 lakh', 'Not sure yet'];

function doPost(event) {
  try {
    const data = JSON.parse(event.postData.contents);
    const requiredFields = [
      'full_name',
      'phone',
      'email',
      'course_level',
      'field_of_study',
      'preferred_intake',
      'academic_score',
      'english_test_status',
      'gre_gmat_status',
      'yearly_budget_inr',
      'consent'
    ];

    if (data.website) {
      return jsonResponse({ success: false, message: 'Invalid submission.' });
    }
    if (requiredFields.some((field) => !String(data[field] || '').trim())) {
      return jsonResponse({ success: false, message: 'Please complete all required fields.' });
    }
    if (String(data.full_name).length > 150 || String(data.field_of_study).length > 200) {
      return jsonResponse({ success: false, message: 'One or more fields are too long.' });
    }
    if (!/^[0-9+() -]{8,20}$/.test(String(data.phone))) {
      return jsonResponse({ success: false, message: 'Enter a valid phone number.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) {
      return jsonResponse({ success: false, message: 'Enter a valid email address.' });
    }

    const countries = Array.isArray(data.preferred_countries)
      ? data.preferred_countries
      : [data.preferred_countries];
    if (!countries.length || countries.some((country) => !COUNTRIES.includes(country))) {
      return jsonResponse({ success: false, message: 'Select at least one valid preferred country.' });
    }
    if (!COURSE_LEVELS.includes(data.course_level)) {
      return jsonResponse({ success: false, message: 'Select a valid course level.' });
    }
    if (!ENGLISH_TESTS.includes(data.english_test_status)) {
      return jsonResponse({ success: false, message: 'Select a valid English test status.' });
    }
    if (data.english_test_status !== 'Not taken yet' && !String(data.english_test_score || '').trim()) {
      return jsonResponse({ success: false, message: 'Enter your English test score.' });
    }
    if (!GRE_GMAT_STATUSES.includes(data.gre_gmat_status) || !BUDGETS.includes(data.yearly_budget_inr)) {
      return jsonResponse({ success: false, message: 'Select valid GRE/GMAT and budget options.' });
    }
    if (data.consent !== 'I agree to be contacted about my enquiry.') {
      return jsonResponse({ success: false, message: 'Consent is required to submit this form.' });
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          'Timestamp',
          'Full name',
          'Phone',
          'Email',
          'Preferred countries',
          'Course level',
          'Field of study',
          'Preferred intake',
          'Latest academic percentage or CGPA',
          'English test status',
          'English test score',
          'GRE/GMAT status',
          'Yearly budget (INR)',
          'Consent'
        ]);
      }

      sheet.appendRow([
        new Date(),
        data.full_name,
        data.phone,
        data.email,
        countries.join(', '),
        data.course_level,
        data.field_of_study,
        data.preferred_intake,
        data.academic_score,
        data.english_test_status,
        data.english_test_score || '',
        data.gre_gmat_status,
        data.yearly_budget_inr,
        data.consent
      ].map(sheetSafeValue));
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({ success: true, message: 'Profile evaluation submitted.' });
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, message: 'Unable to save the evaluation. Please try again.' });
  }
}

function sheetSafeValue(value) {
  if (value instanceof Date) {
    return value;
  }
  const text = String(value == null ? '' : value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
