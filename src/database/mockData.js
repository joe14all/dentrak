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
    name: "Smile Bright Dental",
    status: "active",
    address: "123 Main St",
    city: "Metropolis",
    provinceState: "CA",
    paymentType: "percentage",
    taxStatus: "contractor",
    calculationBase: "collection",
    percentage: 40,
    dailyGuarantee: 600,
    deductions: [
      { name: "Lab Fees", type: "percentage", value: 50, timing: "pre-split" },
      { name: "Supply Fee", type: "flat", value: 25, timing: "post-split" },
    ],
    holdback: {
      percentage: 5,
      notes: "Released quarterly after 90 days for lab remakes.",
    },
    payCycle: "monthly",
    paymentDetail: "Paid on the 15th of the following month.",
    notes: "A high-volume clinic with a focus on cosmetic work.",
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

export const mockEntries = [
  // Entries for Smile Bright Dental
  {
    practiceId: 1,
    date: "2024-08-01",
    production: 2500,
    labFees: 300,
    notes: "One crown prep.",
  },
  {
    practiceId: 1,
    date: "2024-08-02",
    production: 1800,
    labFees: 0,
    notes: "",
  },

  // Entries for City Center Dentistry
  {
    practiceId: 2,
    date: "2024-08-05",
    production: 2800,
    basePay: 700,
    notes: "Busy day, hit bonus.",
  },
  {
    practiceId: 2,
    date: "2024-08-06",
    production: 1900,
    basePay: 700,
    notes: "Just under the bonus threshold.",
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
