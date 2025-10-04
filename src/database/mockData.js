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
export const mockCheques = [
  {
    practiceId: 1,
    dateReceived: "2024-09-15",
    amount: 5240.0,
    chequeNumber: "1054",
    status: "Deposited", // 'Pending', 'Deposited', 'Cleared', 'Bounced'
    image: null, // Placeholder for image data/path
  },
  {
    practiceId: 2,
    dateReceived: "2024-08-20",
    amount: 3450.0,
    chequeNumber: "EFT-84321",
    status: "Cleared",
    image: null,
  },
];
