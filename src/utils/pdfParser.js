/**
 * PDF Parser for Day Sheet Reports
 * Parses dental day sheet PDFs and extracts procedure data
 */

import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker - using local copy
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

/**
 * Parse a Day Sheet PDF file and extract procedure data
 * @param {File} file - The PDF file to parse
 * @returns {Promise<Array>} Array of procedure objects
 */
export const parseDaySheetPDF = async (file) => {
  try {
    console.log("Starting PDF parse for:", file.name);

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    console.log("File converted to ArrayBuffer, size:", arrayBuffer.byteLength);

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    console.log("PDF loaded successfully, pages:", pdf.numPages);

    // Process each page separately to maintain context
    let allProcedures = [];
    let currentDate = null;
    let currentPatient = null;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`\n=== Processing page ${pageNum} of ${pdf.numPages} ===`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Group text items by their Y position (rows)
      const rows = groupTextByRows(textContent.items);
      console.log(`Page ${pageNum}: ${rows.length} rows extracted`);

      // Parse this page's rows with context from previous pages
      const { procedures, lastDate, lastPatient } = parseDaySheetRows(
        rows,
        currentDate,
        currentPatient,
      );
      console.log(`Page ${pageNum}: ${procedures.length} procedures parsed`);

      allProcedures = allProcedures.concat(procedures);

      // Update context for next page
      if (lastDate) currentDate = lastDate;
      if (lastPatient) currentPatient = lastPatient;
    }

    console.log("\n=== Total procedures parsed:", allProcedures.length, "===");

    // Verify totals
    const totalCharges = allProcedures.reduce(
      (sum, p) => sum + (p.charges || 0),
      0,
    );
    const totalPayments = allProcedures.reduce(
      (sum, p) => sum + (p.payments || 0),
      0,
    );
    const nonZeroCharges = allProcedures.filter((p) => p.charges > 0).length;
    console.log("Procedures with charges > 0:", nonZeroCharges);
    console.log("Total Charges:", totalCharges.toFixed(2));
    console.log("Total Payments:", totalPayments.toFixed(2));
    console.log("Expected Charges: 26529.52");
    console.log("Expected Payments: 2625.10");
    console.log("Missing Charges:", (26529.52 - totalCharges).toFixed(2));

    const procedures = allProcedures;

    if (procedures.length === 0) {
      throw new Error(
        "No procedure data found in PDF. The format may not match expected Day Sheet layout.",
      );
    }

    return procedures;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    if (error.message.includes("No procedure data found")) {
      throw error;
    }
    throw new Error(`Failed to parse PDF file: ${error.message}`);
  }
};

/**
 * Group text items by their Y position to form rows
 * @param {Array} textItems - Text items from PDF.js
 * @returns {Array} Array of rows, each containing text items
 */
const groupTextByRows = (textItems) => {
  const rowMap = new Map();
  const yTolerance = 2; // Pixels tolerance for same row

  textItems.forEach((item) => {
    const y = Math.round(item.transform[5]);

    // Find existing row within tolerance
    let foundY = null;
    for (const existingY of rowMap.keys()) {
      if (Math.abs(existingY - y) <= yTolerance) {
        foundY = existingY;
        break;
      }
    }

    const rowY = foundY !== null ? foundY : y;
    if (!rowMap.has(rowY)) {
      rowMap.set(rowY, []);
    }

    rowMap.get(rowY).push({
      text: item.str.trim(),
      x: item.transform[4],
      y: item.transform[5],
    });
  });

  // Convert map to sorted array and sort items within each row by X position
  const rows = Array.from(rowMap.entries())
    .map(([y, items]) => ({
      y,
      items: items.sort((a, b) => a.x - b.x),
      text: items.map((i) => i.text).join(" "),
    }))
    .sort((a, b) => b.y - a.y); // Sort by Y descending (top to bottom)

  return rows;
};

/**
 * Parse structured rows into procedure objects
 * @param {Array} rows - Rows of text from PDF
 * @param {string} initialDate - Date context from previous page
 * @param {string} initialPatient - Patient context from previous page
 * @returns {Object} Object with procedures array and last date/patient
 */
const parseDaySheetRows = (rows, initialDate = null, initialPatient = null) => {
  const procedures = [];
  let currentDate = initialDate;
  let currentPatient = initialPatient;

  // Skip header rows - look for the first date
  let dataStartIndex = 0;
  for (let i = 0; i < rows.length; i++) {
    if (/\d{2}\/\d{2}\/\d{4}/.test(rows[i].text)) {
      dataStartIndex = i;
      break;
    }
  }

  console.log("Starting data parsing from row:", dataStartIndex);
  if (rows.length > dataStartIndex + 20) {
    console.log(
      "Sample rows 0-5:",
      rows
        .slice(dataStartIndex, dataStartIndex + 5)
        .map((r, i) => `${i}: ${r.text.substring(0, 100)}`),
    );
    console.log(
      "Sample rows 15-20:",
      rows
        .slice(dataStartIndex + 15, dataStartIndex + 20)
        .map((r, i) => `${i + 15}: ${r.text.substring(0, 100)}`),
    );
  }

  for (let i = dataStartIndex; i < rows.length; i++) {
    const row = rows[i];
    const text = row.text;

    // Skip obviously non-data rows
    if (
      !text.trim() ||
      text.length < 10 ||
      text.includes("Audit #") ||
      text.includes("DAY SHEET") ||
      text.includes("MARINA DENTAL") ||
      text.includes("Provider SH01") ||
      text.includes("Page:") ||
      text.match(/Date\s+Patient Name/) ||
      text.match(/Charges:\s+Payments:/) ||
      text.includes("04/01/2026 - 04/30/2026") ||
      text.includes("New Patients of Record") ||
      text.includes("Patients Seen") ||
      text.includes("Avg Prod per Patient") ||
      text.includes("Avg Chg per Procedure") ||
      text.includes("offsetting adjustments")
    ) {
      continue; // Skip but don't stop
    }

    // Try to parse as a procedure line
    let procedure = parseProcedureLineV2(text, currentDate, currentPatient);

    // If parsing failed and there's a next line, try combining them
    if (!procedure && i + 1 < rows.length) {
      const nextRow = rows[i + 1];
      const combinedText = text + " " + nextRow.text;
      procedure = parseProcedureLineV2(
        combinedText,
        currentDate,
        currentPatient,
      );

      // If combined parsing worked, skip the next row
      if (procedure) {
        if (procedures.length < 3) {
          console.log(
            "✓ Combined rows:",
            text.substring(0, 60),
            "+",
            nextRow.text.substring(0, 30),
          );
        }
        i++; // Skip next row since we consumed it
      }
    }

    if (procedure) {
      // Validate charge is reasonable (not a random number we picked up)
      if (procedure.charges > 5000) {
        console.log(
          "⚠️ Suspicious high charge:",
          procedure.charges,
          "in:",
          text.substring(0, 80),
        );
        continue; // Skip obviously wrong values
      }

      // Log first few to see what's being captured
      if (procedures.length < 10) {
        console.log(
          `✓ #${procedures.length + 1} Parsed:`,
          procedure.date,
          procedure.patientName.substring(0, 20),
          procedure.code,
          "Ch:",
          procedure.charges,
          "Py:",
          procedure.payments,
        );
      }
      procedures.push(procedure);

      // Update current context
      if (procedure.date) currentDate = procedure.date;
      if (procedure.patientName) currentPatient = procedure.patientName;
    } else {
      // Log failures for first 20 attempts to see patterns
      if (
        procedures.length < 10 &&
        text.length > 10 &&
        !text.includes("04/01/2026 - 04/30/2026")
      ) {
        console.log("✗ Failed to parse:", text.substring(0, 100));
      }
    }
  }

  console.log(
    `Successfully parsed ${procedures.length} procedures from ${rows.length} rows`,
  );
  return {
    procedures,
    lastDate: currentDate,
    lastPatient: currentPatient,
  };
};

/**
 * Enhanced line parser with multiple pattern attempts
 * @param {string} line - Line of text
 * @param {string} lastDate - Last known date
 * @param {string} lastPatient - Last known patient
 * @returns {Object|null} Procedure object or null
 */
const parseProcedureLineV2 = (line, lastDate, lastPatient) => {
  // Clean the line but preserve structure
  const cleaned = line.replace(/\s+/g, " ").trim();

  // Pattern 1: Full line with date (more flexible with spacing)
  // Match: date + patient + optional(tooth) + code + description + charge
  const fullPattern =
    /^(\d{2}\/\d{2}\/\d{4})\s+([A-Za-z][A-Za-z\s,]+?)\s+(?:(\d+)\s+)?([A-Z]\d{4}(?:\.\d+)?)\s+(?:([A-Z]{1,4})\s+)?(.+?)\s+(\d+\.\d{2})/;

  let match = cleaned.match(fullPattern);

  if (match) {
    const [, dateStr, patientName, tooth, code, surface, description, charges] =
      match;

    return {
      date: formatDate(dateStr),
      patientName: patientName.trim(),
      tooth: tooth || "",
      code: code.trim(),
      description: description.trim(),
      surface: surface || "",
      charges: parseFloat(charges) || 0,
      payments: 0,
    };
  }

  // Pattern 2: Continuation line (no date, but has patient + code + charge)
  const contPattern =
    /^([A-Za-z][A-Za-z\s,]+?)\s+(?:(\d+)\s+)?([A-Z]\d{4}(?:\.\d+)?)\s+(?:([A-Z]{1,4})\s+)?(.+?)\s+(\d+\.\d{2})/;

  match = cleaned.match(contPattern);

  if (match && lastDate) {
    const [, patientName, tooth, code, surface, description, charges] = match;

    return {
      date: lastDate,
      patientName: patientName.trim(),
      tooth: tooth || "",
      code: code.trim(),
      description: description.trim(),
      surface: surface || "",
      charges: parseFloat(charges) || 0,
      payments: 0,
    };
  }

  // Pattern 3: Simple line (same patient, code + charge)
  const simplePattern =
    /^(?:(\d+)\s+)?([A-Z]\d{4}(?:\.\d+)?)\s+(?:([A-Z]{1,4})\s+)?(.+?)\s+(\d+\.\d{2})/;

  match = cleaned.match(simplePattern);

  if (match && lastDate && lastPatient) {
    const [, tooth, code, surface, description, charges] = match;

    return {
      date: lastDate,
      patientName: lastPatient,
      tooth: tooth || "",
      code: code.trim(),
      description: description.trim(),
      surface: surface || "",
      charges: parseFloat(charges) || 0,
      payments: 0,
    };
  }

  // Pattern 4: Payment-only lines (no procedure code)
  // 04/24/2026 Lowery, Jenna Dental Ins. Check Payment -186.00 1 SH01
  const paymentPattern =
    /^(?:(\d{2}\/\d{2}\/\d{4})\s+)?([A-Za-z][A-Za-z\s,]+?)\s+(?:Dental Ins\.|Check Payment|Insurance Payment|Payment).+?(-\d+\.\d{2})/i;

  match = cleaned.match(paymentPattern);

  if (match) {
    const [, dateStr, patientName, amount] = match;
    const paymentAmount = Math.abs(parseFloat(amount));
    const useDate = dateStr ? formatDate(dateStr) : lastDate;

    if (useDate && paymentAmount > 0) {
      return {
        date: useDate,
        patientName: patientName.trim(),
        tooth: "",
        code: "PAYMENT",
        description: "Payment received",
        surface: "",
        charges: 0,
        payments: paymentAmount,
      };
    }
  }

  return null;
};

/**
 * Format date from MM/DD/YYYY to YYYY-MM-DD
 * @param {string} dateStr - Date string in MM/DD/YYYY format
 * @returns {string} Date in YYYY-MM-DD format
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

  console.log("CSV parsing started, total lines:", lines.length);

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

  console.log("CSV parsing complete, procedures found:", procedures.length);

  // Verify totals
  const totalCharges = procedures.reduce((sum, p) => sum + p.charges, 0);
  const totalPayments = procedures.reduce((sum, p) => sum + p.payments, 0);
  console.log("CSV Total Charges:", totalCharges.toFixed(2));
  console.log("CSV Total Payments:", totalPayments.toFixed(2));

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
