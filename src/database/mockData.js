// This file contains mock data to populate the database for development and testing.

/**
 * @typedef {Object} Deduction
 * @property {string} name - The name of the deduction (e.g., "Lab Fees").
 * @property {'percentage' | 'flat'} type - The type of deduction.
 * @property {number} value - The amount/percentage to deduct.
 * @property {'pre-split' | 'post-split'} timing - Determines if the deduction is taken from gross production ('pre-split') or from the dentist's calculated pay ('post-split').
 */

/**
 * @typedef {Object} BonusTier
 * @property {number} threshold - The daily/monthly production/collection amount to exceed for the bonus.
 * @property {number} percentage - The bonus percentage applied to the amount over the threshold.
 */

/**
 * @typedef {Object} Practice
 * @property {number} id - Unique identifier.
 * @property {string} name - The name of the practice.
 * @property {'active' | 'archived'} status - The current status of the practice.
 * @property {string} [address] - Street address.
 * @property {string} [city] - City.
 * @property {string} [provinceState] - Province or State.
 *
 * @property {'percentage' | 'employment'} paymentType - The primary compensation model.
 * @property {'contractor' | 'employee'} taxStatus - Crucial for financial reporting.
 *
 * @property {'production' | 'collection'} [calculationBase] - For percentage types, is pay based on what's billed or what's collected?
 * @property {number} [percentage] - The main percentage for 'percentage' payment types.
 * @property {number} [dailyGuarantee] - A minimum daily pay for percentage-based roles.
 *
 * @property {number} [basePay] - The daily rate for 'employment' payment types.
 *
 * @property {Deduction[]} deductions - An array of all possible deductions.
 * @property {BonusTier[]} [bonusTiers] - An array of bonus tiers, allowing for complex bonus structures.
 * @property {{percentage: number, notes: string}} [holdback] - For holding back a portion of pay.
 *
 * @property {'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'custom'} payCycle - How often payments are made.
 * @property {string} paymentDetail - Free text for specific pay dates (e.g., "15th of following month", "Every second Friday").
 * @property {string} [notes] - Any other miscellaneous notes.
 */

/** @type {Practice[]} */
export const mockPractices = [
  {
    id: 1,
    name: "All Care dental by the sea ",
    status: "active",
    address: "607 W Channel Islands Blvd",
    city: "Port Hueneme",
    provinceState: "CA",
    paymentType: "percentage",
    taxStatus: "contractor",
    calculationBase: "Production",
    percentage: 29,
    dailyGuarantee: 950,
    deductions: [],
    holdback: {},
    payCycle: "bi-weekly",
    paymentDetail: "",
    notes: "A high-volume clinic.",
  },
  {
    id: 2,
    name: "City Center Dentistry",
    status: "active",
    address: "456 Oak Ave",
    city: "Gotham",
    provinceState: "NY",
    paymentType: "employment",
    taxStatus: "employee",
    basePay: 800,
    bonusTiers: [
      { threshold: 2500, percentage: 20 },
      { threshold: 4000, percentage: 25 },
    ],
    deductions: [],
    payCycle: "bi-weekly",
    paymentDetail: "Paid every second Friday. Taxes deducted at source.",
    notes: "Corporate environment. Standard W2 employment.",
  },
  {
    id: 3,
    name: "Rural Community Clinic",
    status: "active",
    address: "789 Pine Ln",
    city: "Smallville",
    provinceState: "KS",
    paymentType: "employment",
    taxStatus: "employee",
    basePay: 950, // Higher base pay, less complex structure
    deductions: [],
    payCycle: "weekly",
    paymentDetail: "Paid every Friday.",
    notes: "Public health focus. No production bonus available.",
  },
  {
    id: 4,
    name: "Ortho Specialists (Archived)",
    status: "archived",
    address: "101 Arch St",
    city: "Star City",
    provinceState: "WA",
    paymentType: "percentage",
    taxStatus: "contractor",
    calculationBase: "production",
    percentage: 50,
    deductions: [
      {
        name: "Specialist Lab Fees",
        type: "percentage",
        value: 60,
        timing: "pre-split",
      },
    ],
    payCycle: "monthly",
    paymentDetail: "Paid on the last business day of the month.",
    notes: "Previous contract ended last year. All payments finalized.",
  },
];

/**
 * @typedef {Object} Adjustment
 * @property {string} name - The description of the adjustment (e.g., "Lab Fees").
 * @property {'cost' | 'write-off' | 'other'} type - The category of the adjustment.
 * @property {number} amount - The monetary value of the adjustment.
 */

/**
 * Represents a single financial or attendance entry.
 * The `entryType` field determines which other fields are relevant.
 *
 * @typedef {Object} Entry
 * @property {number} id - Unique identifier for the entry.
 * @property {number} practiceId - Links the entry to a specific practice.
 * @property {'dailySummary' | 'periodSummary' | 'individualProcedure' | 'attendanceRecord'} entryType - The core of the versatile structure.
 *
 * -- Date Fields --
 * @property {string} [date] - For dailySummary, individualProcedure, and attendanceRecord.
 * @property {string} [periodStartDate] - For periodSummary.
 * @property {string} [periodEndDate] - For periodSummary.
 *
 * -- Financials (not used by attendanceRecord) --
 * @property {number} [production]
 * @property {number} [collection]
 * @property {Adjustment[]} [adjustments]
 *
 * -- Attendance Fields (only for attendanceRecord) --
 * @property {string} [checkInTime] - Optional time stamp (e.g., "08:30").
 * @property {string} [checkOutTime] - Optional time stamp (e.g., "17:00").
 *
 * -- Optional Details --
 * @property {string} [patientId]
 * @property {string} [procedureCode]
 * @property {string} [notes]
 */

/** @type {Entry[]} */
export const mockEntries = [
  // --- Example: Attendance Records (New Type) ---
  {
    id: 101,
    practiceId: 2, // City Center Dentistry
    entryType: "attendanceRecord",
    date: "2025-10-06",
    checkInTime: "08:55",
    checkOutTime: "17:05",
    notes: "Regular work day.",
  },
  {
    id: 102,
    practiceId: 3, // Rural Community Clinic
    entryType: "attendanceRecord",
    date: "2025-10-07",
    notes: "Present for morning huddle and admin tasks. Left after lunch.",
  },

  {
    id: 1,
    practiceId: 1, // Smile Bright Dental
    entryType: "dailySummary",
    date: "2025-10-01",
    production: 3200,
    collection: 2850,
    adjustments: [
      { name: "Lab Fee (Crown)", amount: 250, type: "cost" },
      { name: "Supplies", amount: 50, type: "cost" },
    ],
    notes: "Productive day, 2 crowns and fillings.",
  },
  {
    id: 2,
    practiceId: 1,
    entryType: "dailySummary",
    date: "2025-10-02",
    production: 1800,
    collection: 1500,
    adjustments: [],
    notes: "Hygiene checks and a few fillings.",
  },

  // --- Example: Period Summary (for simple, high-level tracking) ---
  {
    id: 3,
    practiceId: 2, // City Center Dentistry
    entryType: "periodSummary",
    periodStartDate: "2025-09-16",
    periodEndDate: "2025-09-30",
    production: 28500,
    collection: 26000,
    adjustments: [
      { name: "Total Lab Fees for Period", amount: 2800, type: "cost" },
    ],
    notes: "Pay stub summary for the last half of September.",
  },

  // --- Example: Individual Procedures (for detailed, patient-level tracking) ---
  {
    id: 4,
    practiceId: 3, // Rural Community Clinic
    entryType: "individualProcedure",
    date: "2025-10-03",
    patientId: "P-48151",
    procedureCode: "D2740", // Porcelain/Ceramic Crown
    production: 1450,
    collection: 0, // Collection will be logged later
    adjustments: [{ name: "Lab Fee", amount: 210, type: "cost" }],
    notes: "Crown prep on #14.",
  },
  {
    id: 5,
    practiceId: 3,
    entryType: "individualProcedure",
    date: "2025-10-03",
    patientId: "P-48151",
    procedureCode: "D2330", // Resin composite
    production: 250,
    collection: 250,
    adjustments: [],
    notes: "Anterior filling on #8.",
  },
  {
    id: 6,
    practiceId: 1,
    entryType: "dailySummary",
    date: "2025-10-03",
    production: 4500,
    collection: 4000,
    adjustments: [{ name: "Implant Parts", amount: 800, type: "cost" }],
    notes: "Implant placement day.",
  },
];
/**
 * Represents a physical cheque received as payment.
 *
 * @typedef {Object} Cheque
 * @property {number} id - Unique identifier for the cheque record.
 * @property {number} practiceId - Links to the practice that issued the cheque.
 * @property {number} [linkedPaymentId] - Links to the corresponding entry in the 'payments' table.
 * @property {string} dateReceived - The date the cheque was physically received.
 * @property {number} amount - The monetary value of the cheque.
 * @property {string} chequeNumber - The number printed on the cheque.
 * @property {'Pending' | 'Deposited' | 'Cleared' | 'Bounced'} status - The current status in the deposit lifecycle.
 * @property {string} [dateDeposited] - The date the cheque was deposited into the bank.
 * @property {string} [dateCleared] - The date the cheque cleared the bank.
 * @property {string} [image] - A path or URI to a scanned image of the cheque.
 * @property {string} [notes] - Any relevant notes (e.g., "For second half of Sept pay period").
 */

/** @type {Cheque[]} */
export const mockCheques = [
  {
    id: 1,
    practiceId: 1,
    linkedPaymentId: 1,
    dateReceived: "2025-10-15",
    amount: 8530.5,
    chequeNumber: "2045",
    status: "Deposited",
    dateDeposited: "2025-10-16",
    dateCleared: null,
    image: null,
    notes: "Payment for the last half of September.",
  },
  {
    id: 2,
    practiceId: 4,
    dateReceived: "2025-09-30",
    amount: 12500.0,
    chequeNumber: "8801",
    status: "Cleared",
    dateDeposited: "2025-10-01",
    dateCleared: "2025-10-03",
    image: null,
    notes: "Final payment from archived contract.",
  },
];

// --- 2. New Direct Deposit Schema ---

/**
 * Represents a direct deposit (EFT) payment.
 *
 * @typedef {Object} DirectDeposit
 * @property {number} id - Unique identifier for the deposit record.
 * @property {number} practiceId - Links to the paying practice.
 * @property {number} [linkedPaymentId] - Links to the 'payments' table.
 * @property {string} paymentDate - The date the deposit was received in the account.
 * @property {number} amount - The net amount received.
 * @property {string} payPeriodStartDate - The start of the pay period this deposit covers.
 * @property {string} payPeriodEndDate - The end of the pay period.
 * @property {string} transactionId - The unique transaction ID from the bank statement.
 * @property {string} [paystubImage] - A path or URI to an image of the associated paystub.
 * @property {string} [notes] - Notes on the deposit (e.g., "Includes holiday pay").
 */

/** @type {DirectDeposit[]} */
export const mockDirectDeposits = [
  {
    id: 1,
    practiceId: 2,
    linkedPaymentId: 2,
    paymentDate: "2025-10-05",
    amount: 7200.0,
    payPeriodStartDate: "2025-09-16",
    payPeriodEndDate: "2025-09-30",
    transactionId: "DD-987654",
    paystubImage: null,
    notes: "Standard bi-weekly payroll deposit.",
  },
];

// --- 3. New E-Transfer Schema ---

/**
 * Represents a payment received via e-transfer.
 *
 * @typedef {Object} ETransfer
 * @property {number} id - Unique identifier.
 * @property {number} practiceId - Links to the paying practice.
 * @property {number} [linkedPaymentId] - Links to the 'payments' table.
 * @property {string} paymentDate - The date the transfer was accepted.
 * @property {number} amount - The amount of the transfer.
 * @property {string} confirmationNumber - The confirmation or reference number from the e-transfer.
 * @property {string} [senderEmail] - The email address of the sender, for tracking.
 * @property {'Pending' | 'Accepted' | 'Expired' | 'Cancelled'} status - The status of the e-transfer.
 * @property {string} [screenshotImage] - A path or URI to a screenshot of the confirmation.
 * @property {string} [notes] - Any notes, such as the security answer.
 */

/** @type {ETransfer[]} */
export const mockETransfers = [
  {
    id: 1,
    practiceId: 3,
    linkedPaymentId: 3,
    paymentDate: "2025-10-03",
    amount: 4750.0,
    confirmationNumber: "ETR-ABC123XYZ",
    senderEmail: "accounting@ruralclinic.com",
    status: "Accepted",
    screenshotImage: null,
    notes: "Security answer: 'dentist'",
  },
];

/**
 * Represents a single payment received from a practice.
 *
 * @typedef {Object} Payment
 * @property {number} id - Unique identifier.
 * @property {number} practiceId - Links the payment to a specific practice.
 * @property {string} paymentDate - The date the payment was received.
 * @property {number} amount - The total monetary value of the payment.
 * @property {'cheque' | 'e-transfer' | 'directDeposit' | 'cash'} paymentMethod - The method of payment.
 *
 * @property {string} [payPeriodStartDate] - The start date of the pay period this payment covers.
 * @property {string} [payPeriodEndDate] - The end date of the pay period.
 *
 * @property {string} [referenceNumber] - Optional reference like a cheque number or e-transfer ID.
 * @property {number[]} [linkedEntryIds] - An array of 'entry' IDs that this payment covers for reconciliation.
 * @property {number} [linkedChequeId] - An optional ID linking to a record in the 'cheques' table for detailed tracking.
 *
 * @property {string} [image] - Placeholder for a URI or path to an attached image (e.g., for transfers).
 * @property {string} [notes] - Any miscellaneous notes.
 */

/** @type {Payment[]} */
export const mockPayments = [
  {
    id: 1,
    practiceId: 1,
    paymentDate: "2025-10-15",
    amount: 8530.5,
    paymentMethod: "cheque",
    payPeriodStartDate: "2025-09-16",
    payPeriodEndDate: "2025-09-30",
    referenceNumber: "2045",
    linkedChequeId: 1, // Corresponds to an entry in the 'cheques' table
    notes: "Payment for the last half of September.",
  },
  {
    id: 2,
    practiceId: 2,
    paymentDate: "2025-10-05",
    amount: 7200.0,
    paymentMethod: "directDeposit",
    payPeriodStartDate: "2025-09-16",
    payPeriodEndDate: "2025-09-30",
    referenceNumber: "DD-987654",
    notes: "Standard bi-weekly payroll deposit.",
  },
  {
    id: 3,
    practiceId: 3,
    paymentDate: "2025-10-03",
    amount: 4750.0,
    paymentMethod: "e-transfer",
    payPeriodStartDate: "2025-09-22",
    payPeriodEndDate: "2025-09-26",
    referenceNumber: "ETR-ABC123XYZ",
    image: null, // Placeholder for a screenshot
    notes: "E-transfer for the last week of September.",
  },
];

/**
 * The main Report object. The `type` determines the structure of the `data` payload.
 *
 * @typedef {Object} Report
 * @property {number} id - Unique identifier for the saved report.
 * @property {string} name - A user-defined name for the report (e.g., "Q3 2025 Production Summary").
 * @property {'payPeriodStatement' | 'annualSummary' | 'practiceComparison'} type - The type of report.
 * @property {string} createdAt - The ISO string date when the report was generated.
 * @property {Object} parameters - The settings used to generate the report.
 * @property {string} parameters.startDate - The start date for the report's data range.
 * @property {string} parameters.endDate - The end date for the report's data range.
 * @property {number[]} [parameters.practiceIds] - An array of practice IDs included in the report.
 * @property {Object} data - The calculated data payload, with a structure that varies by report type.
 */

/** @type {Report[]} */
export const mockReports = [
  // --- 1. Example: A Detailed Pay Period Statement ---
  // This is the most common and useful report type for reconciling pay.
  {
    id: 1,
    name: "Smile Bright - Pay Period Oct 1-15, 2025",
    type: "payPeriodStatement",
    createdAt: "2025-10-16T10:00:00.000Z",
    parameters: {
      startDate: "2025-10-01",
      endDate: "2025-10-15",
      practiceIds: [1],
    },
    data: {
      practiceName: "Smile Bright Dental",
      summary: {
        grossProduction: 9500.0,
        grossCollection: 8350.0,
        totalAdjustments: 1100.0,
        netProduction: 8400.0, // Gross - Adjustments (pre-split)
        calculatedPay: 3360.0, // Based on 40% of net production
        totalPaymentsReceived: 3000.0,
        balanceDue: 360.0,
      },
      // Includes the raw entries used for the calculation
      lineItems: [
        {
          id: 1,
          date: "2025-10-01",
          production: 3200,
          collection: 2850,
          adjustmentsTotal: 300,
        },
        {
          id: 2,
          date: "2025-10-02",
          production: 1800,
          collection: 1500,
          adjustmentsTotal: 0,
        },
        {
          id: 6,
          date: "2025-10-03",
          production: 4500,
          collection: 4000,
          adjustmentsTotal: 800,
        },
      ],
      // Includes any payments received that were linked to this period
      paymentItems: [
        { id: 1, paymentDate: "2025-10-15", amount: 3000.0, method: "cheque" },
      ],
    },
  },

  // --- 2. Example: An Annual Summary Report ---
  // Useful for tax purposes and high-level performance review.
  {
    id: 2,
    name: "2025 Annual Financial Summary",
    type: "annualSummary",
    createdAt: "2026-01-05T11:00:00.000Z",
    parameters: {
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      practiceIds: [1, 2, 3], // All active practices
    },
    data: {
      year: 2025,
      overallTotals: {
        totalProduction: 250000,
        totalCollection: 235000,
        totalAdjustments: 15000,
        totalCalculatedPay: 98000,
      },
      // Provides a breakdown of totals for each practice
      byPractice: [
        {
          practiceName: "Smile Bright Dental",
          totalProduction: 120000,
          totalCalculatedPay: 48000,
        },
        {
          practiceName: "City Center Dentistry",
          totalProduction: 80000,
          totalCalculatedPay: 32000,
        },
        {
          practiceName: "Rural Community Clinic",
          totalProduction: 50000,
          totalCalculatedPay: 18000,
        },
      ],
    },
  },

  // --- 3. Example: A Practice Comparison Report ---
  // Ideal for analyzing performance between different work locations.
  {
    id: 3,
    name: "Q4 2025 - Practice Performance Comparison",
    type: "practiceComparison",
    createdAt: "2026-01-02T09:00:00.000Z",
    parameters: {
      startDate: "2025-10-01",
      endDate: "2025-12-31",
      practiceIds: [1, 2, 3],
    },
    data: {
      // An array of metrics, one for each practice
      metrics: [
        {
          practiceName: "Smile Bright Dental",
          totalProduction: 65000,
          totalCollection: 62000,
          daysWorked: 30,
          avgProductionPerDay: 2166.67,
        },
        {
          practiceName: "City Center Dentistry",
          totalProduction: 55000,
          totalCollection: 54000,
          daysWorked: 28,
          avgProductionPerDay: 1964.28,
        },
        {
          practiceName: "Rural Community Clinic",
          totalProduction: 48000,
          totalCollection: 48000,
          daysWorked: 32,
          avgProductionPerDay: 1500.0,
        },
      ],
    },
  },
];
