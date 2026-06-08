/**
 * PDF Parser for Day Sheet Reports
 * Uses column-position-based parsing for accurate extraction.
 * Each text item's X coordinate is used to assign it to the correct
 * table column (Date, Patient Name, Th, Code, Description, OS,
 * Charges, Payments, BT, Prov, Phone #).
 */

import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker - using local copy
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

/**
 * Parse a Day Sheet PDF file and extract procedure data.
 * @param {File} file - The PDF file to parse
 * @returns {Promise<Array>} Array of procedure objects
 */
export const parseDaySheetPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;

    // ── Step 1: Collect all text items across all pages ──────────────
    const allItems = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

      for (const item of textContent.items) {
        const text = item.str.trim();
        if (text) {
          allItems.push({
            text,
            x: item.transform[4],
            // Convert PDF Y (bottom-up) to page-relative Y (top-down)
            pageY: viewport.height - item.transform[5],
            page: pageNum,
          });
        }
      }
    }

    // ── Step 2: Group items into rows ─────────────────────────────────
    const rows = groupIntoRows(allItems);

    // ── Step 3: Find column header row ────────────────────────────────
    const headerRowIndex = findHeaderRow(rows);
    if (headerRowIndex === -1) {
      throw new Error("Could not find column header row in PDF");
    }

    // ── Step 4: Parse grand totals for post-import verification ───────
    const grandTotals = parseGrandTotals(rows);

    // ── Step 5: Walk rows and build procedure records ─────────────────
    const procedures = [];
    let currentDate = null;
    let currentPatient = null;

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];

      // Stop when we reach the grand totals section
      if (isGrandTotalsRow(row)) break;

      // Skip repeated column-header rows (one per page)
      if (isColumnHeaderRow(row)) continue;

      // Skip page headers, footers, metadata
      if (isSkippableRow(row)) {
        continue;
      }

      // Parse this row directly from its assembled text
      const procedure = parseRowText(row.text, currentDate, currentPatient);

      if (procedure) {
        if (procedure.date) currentDate = procedure.date;
        if (procedure.patientName) currentPatient = procedure.patientName;
        procedures.push(procedure);
      }
    }

    // ── Step 6: Return or throw ────────────────────────────────────
    if (procedures.length === 0) {
      throw new Error(
        "No procedure data found in PDF. The format may not match expected Day Sheet layout.",
      );
    }

    return procedures;
  } catch (error) {
    if (error.message.includes("No procedure data found")) throw error;
    throw new Error(`Failed to parse PDF file: ${error.message}`);
  }
};

// ─── Row Grouping ─────────────────────────────────────────────────────────────

/**
 * Group flat list of positioned items into rows using Y-proximity per page.
 */
const groupIntoRows = (items) => {
  const Y_TOLERANCE = 3;
  // Use a simple list instead of a Map to avoid key collisions across pages
  const rowList = [];

  for (const item of items) {
    let foundRow = null;
    for (const row of rowList) {
      if (
        row.page === item.page &&
        Math.abs(row.y - item.pageY) <= Y_TOLERANCE
      ) {
        foundRow = row;
        break;
      }
    }

    if (foundRow) {
      foundRow.items.push(item);
    } else {
      rowList.push({ page: item.page, y: item.pageY, items: [item] });
    }
  }

  // Sort rows: page ascending, then Y ascending (top → bottom)
  rowList.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    return a.y - b.y;
  });

  // Sort items within each row left → right, then build text
  for (const row of rowList) {
    row.items.sort((a, b) => a.x - b.x);
    row.text = row.items.map((i) => i.text).join(" ");
  }

  return rowList;
};

// ─── Header Detection ─────────────────────────────────────────────────────────

const findHeaderRow = (rows) => {
  for (let i = 0; i < rows.length; i++) {
    const t = rows[i].text;
    if (
      t.includes("Date") &&
      (t.includes("Patient") || t.includes("Name")) &&
      t.includes("Charges")
    ) {
      return i;
    }
  }
  return -1;
};

const isColumnHeaderRow = (row) => {
  const t = row.text;
  return (
    t.includes("Date") &&
    (t.includes("Patient") || t.includes("Name")) &&
    t.includes("Charges")
  );
};

// ─── Row Classification ───────────────────────────────────────────────────────

const isGrandTotalsRow = (row) => /Grand\s+TOTALS?/i.test(row.text);

const isSkippableRow = (row) => {
  const t = row.text;
  if (!t.trim() || t.length < 3) return true;
  if (/DAY SHEET/i.test(t)) return true;
  // Clinic/practice name header — skip lines that are ALL-CAPS words (no digits)
  if (/DENTAL/i.test(t) && !/\d/.test(t) && t === t.toUpperCase()) return true;
  if (/Provider\s+[A-Z0-9]+/i.test(t)) return true;
  if (/Audit\s*#/i.test(t)) return true;
  if (/Date:\s*Page:/i.test(t)) return true;
  if (/^\s*Page\s+\d+/i.test(t)) return true;
  // Date-range header line e.g. "05/01/2026 - 05/31/2026"
  if (/^\d{2}\/\d{2}\/\d{4}\s*-\s*\d{2}\/\d{2}\/\d{4}/.test(t)) return true;
  if (/New Patients of Record/i.test(t)) return true;
  if (/Patients Seen/i.test(t)) return true;
  if (/Avg (Prod|Chg) per/i.test(t)) return true;
  if (/Page\s+Totals?:/i.test(t)) return true;
  // Column sub-header repeated on each page
  if (/Charges:\s+Payments:/i.test(t)) return true;
  return false;
};

// ─── Row Text Parser ──────────────────────────────────────────────────────────

/**
 * Parse a single assembled row text string into a procedure object.
 * Strategy: anchor on the "amount BT provider" tail to extract the charge,
 * then parse date / patient / tooth / code / description from the prefix.
 *
 * Every data row ends with:  AMOUNT  BT_num  PROVIDER  [(phone)]  [*]
 * e.g. "685.00 1 SH01 (805)389-6586 *" or "0.00 41 SH01 ( )"
 */
const parseRowText = (rawText, lastDate, lastPatient) => {
  const text = rawText.replace(/\s+/g, " ").trim();
  if (!text || text.length < 8) return null;

  // ── 1. Extract charge amount via tail pattern ─────────────────────
  // Tail: AMOUNT  BT(1-3 digits)  PROVIDER(2-6 alnum)  [rest (phone, *)]  EOL
  // Amount requires exactly 2 decimal places to avoid matching codes like D2999.1
  const tailMatch = text.match(
    /^(.+?)\s+(-?\d{1,6}\.\d{2})\s+\d{1,3}\s+[A-Z][A-Z0-9]{1,5}.*$/,
  );
  if (!tailMatch) return null;

  const prefix = tailMatch[1].trim();
  const chargeAmt = parseFloat(tailMatch[2]);

  // ── 2. Extract date from start of prefix ─────────────────────────
  const dateMatch = prefix.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)$/);
  let date = null;
  let rest = prefix;
  if (dateMatch) {
    date = formatDate(dateMatch[1]);
    rest = dateMatch[2].trim();
  } else if (lastDate) {
    date = lastDate;
  } else {
    return null;
  }

  // ── 3. Payment row ────────────────────────────────────────────────
  if (/Dental Ins\.|Check Payment/i.test(rest)) {
    const payPatient =
      rest.replace(/\s*(?:Dental Ins\.|Check Payment).*/i, "").trim() ||
      lastPatient;
    if (!payPatient) return null;
    return {
      date,
      patientName: payPatient,
      tooth: "",
      code: "PAYMENT",
      description: "Dental Insurance Payment",
      surface: "",
      charges: 0,
      payments: Math.abs(chargeAmt),
    };
  }

  // ── 4. Procedure row ──────────────────────────────────────────────
  // rest = "PatientName [Tooth] Code Description"
  // Code: standard D-code (D0055, D2999.1) or custom UPPERCASE word (RCTLZR)
  const procMatch = rest.match(
    /^(.+?)\s+(?:(\d{1,2})\s+)?([A-Z]\d{4}(?:\.\d+)?|[A-Z]{4,10})\s+(.+)$/,
  );
  if (procMatch) {
    const patient = procMatch[1].trim() || lastPatient;
    if (!patient) return null;
    return {
      date,
      patientName: patient,
      tooth: procMatch[2] || "",
      code: procMatch[3].trim(),
      description: procMatch[4].trim(),
      surface: "",
      charges: chargeAmt > 0 ? chargeAmt : 0,
      payments: 0,
    };
  }

  // ── 5. Code-only fallback (no description text) ───────────────────
  const codeOnly = rest.match(
    /^(.+?)\s+(?:(\d{1,2})\s+)?([A-Z]\d{4}(?:\.\d+)?|[A-Z]{4,10})\s*$/,
  );
  if (codeOnly) {
    const patient = codeOnly[1].trim() || lastPatient;
    if (!patient) return null;
    return {
      date,
      patientName: patient,
      tooth: codeOnly[2] || "",
      code: codeOnly[3].trim(),
      description: "",
      surface: "",
      charges: chargeAmt > 0 ? chargeAmt : 0,
      payments: 0,
    };
  }

  return null;
};

// ─── Grand Totals Parser ──────────────────────────────────────────────────────

/**
 * Scan all rows for the "Grand TOTALS:" section and extract Charges/Payments.
 */
const parseGrandTotals = (rows) => {
  let inTotals = false;
  const totals = { charges: 0, payments: 0 };
  let foundCharges = false;
  let foundPayments = false;

  for (const row of rows) {
    if (isGrandTotalsRow(row)) {
      inTotals = true;
      continue;
    }
    if (!inTotals) continue;

    const text = row.text;

    if (!foundCharges) {
      // Matches "Charges: 25140.51" (label + value on same row, possibly separate items)
      const m = text.match(/^Charges:\s*([\d,]+\.?\d*)/i);
      if (m) {
        totals.charges = parseAmount(m[1]);
        foundCharges = true;
        continue;
      }
    }

    if (!foundPayments) {
      const m = text.match(/^Payments:\s*(-?[\d,]+\.?\d*)/i);
      if (m) {
        totals.payments = Math.abs(parseAmount(m[1]));
        foundPayments = true;
        continue;
      }
    }

    if (foundCharges && foundPayments) break;

    // Safety exit
    if (/New Patients|Patients Seen|Avg/i.test(text)) break;
  }

  return foundCharges ? totals : null;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Strip non-numeric characters (except . and -) and parse as float */
const parseAmount = (str) => {
  if (!str) return 0;
  const cleaned = str.replace(/,/g, "").replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
};

/**
 * Format date from MM/DD/YYYY to YYYY-MM-DD
 */
const formatDate = (dateStr) => {
  const [month, day, year] = dateStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

/**
 * Alternative CSV-based parser for manually converted data
 * @param {string} csvText - CSV text content
 * @returns {Array} Array of procedure objects
 */
export const parseCSV = (csvText) => {
  const lines = csvText.split("\n").filter((line) => line.trim());
  const procedures = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCSVLine(line);

    // Must have at least 8 columns
    if (values.length < 8) continue;

    const [
      date,
      patientName,
      tooth,
      code,
      description,
      surface,
      charges,
      payments,
    ] = values;

    // Strong filtering to exclude non-procedure rows
    const dateStr = date.trim();
    const patientStr = patientName.trim();
    const codeStr = code.trim();
    const chargesStr = charges.trim();

    // Skip if date is invalid or missing
    if (!dateStr || !dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) continue;

    // Skip header/footer rows
    if (
      patientStr.toLowerCase().includes("patient name") ||
      patientStr.toLowerCase().includes("day sheet") ||
      patientStr.toLowerCase().includes("marina dental") ||
      patientStr.toLowerCase().includes("audit #") ||
      patientStr.toLowerCase().includes("provider") ||
      patientStr.toLowerCase().includes("page:") ||
      patientStr.match(/^\d{2}\/\d{2}\/\d{4}$/) || // Date in patient name column
      patientStr === "Date:" ||
      patientStr === "" ||
      !patientStr
    ) {
      continue;
    }

    // Skip if code column doesn't contain a valid procedure code or payment indicator
    const hasValidCode =
      codeStr.match(/D\d{4}/) ||
      codeStr.match(/[A-Z]{2,6}\s+/) || // Some custom codes
      description.includes("Payment") ||
      description.includes("Dental Ins");

    if (!hasValidCode) continue;

    // Skip if charges is not a valid number
    if (!chargesStr && !description.includes("Payment")) continue;

    // Parse charges and payments
    const chargeAmount = parseFloat(chargesStr.replace(/[^0-9.-]/g, "")) || 0;
    const paymentAmount =
      Math.abs(parseFloat(payments.trim().replace(/[^0-9.-]/g, ""))) || 0;

    // Handle payment lines
    if (description.includes("Payment") || description.includes("Dental Ins")) {
      if (paymentAmount > 0) {
        procedures.push({
          date: formatDate(dateStr),
          patientName: patientStr,
          tooth: "",
          code: "PAYMENT",
          description: "Payment received",
          surface: "",
          charges: 0,
          payments: paymentAmount,
        });
      }
      continue;
    }

    // Regular procedure line
    procedures.push({
      date: formatDate(dateStr),
      patientName: patientStr,
      tooth: tooth.trim(),
      code: codeStr,
      description: description.trim(),
      surface: surface.trim(),
      charges: chargeAmount,
      payments: 0,
    });
  }

  return procedures;
};

/**
 * Parse a single CSV line, handling quoted values
 * @param {string} line - A single CSV line
 * @returns {Array} Array of values
 */
const parseCSVLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
};

/**
 * Validate if a file appears to be a valid Day Sheet PDF
 * @param {File} file - The file to validate
 * @returns {Promise<boolean>} True if valid
 */
export const validateDaySheetPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Extract first page text
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item) => item.str).join(" ");

    // Check for Day Sheet indicators
    const indicators = [
      "DAY SHEET",
      "ALPHABETICAL",
      "Patient Name",
      "Code",
      "Description",
      "Charges",
    ];

    const foundIndicators = indicators.filter((indicator) =>
      text.toUpperCase().includes(indicator.toUpperCase()),
    );

    return foundIndicators.length >= 4;
  } catch (error) {
    return false;
  }
};
