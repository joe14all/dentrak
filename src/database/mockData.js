// This file contains mock data to populate the database for development and testing.

export const mockPractices = [
  {
    id: 1,
    name: "Smile Bright Dental",
    paymentType: "percentage", // 'percentage' or 'employment'
    percentage: 40, // As a whole number, e.g., 40 for 40%
    deductions: [
      { name: "Lab Fees", type: "percentage", value: 50 }, // Deduct 50% of lab fees
    ],
    payCycle: "monthly", // 'monthly', 'bi-weekly'
    notes: "Pays on the 15th of the following month.",
  },
  {
    id: 2,
    name: "City Center Dentistry",
    paymentType: "employment",
    basePay: 700, // Per day
    productionBonus: {
      threshold: 2000, // Bonus applies on production over $2000
      percentage: 25, // 25% of production over threshold
    },
    deductions: [],
    payCycle: "bi-weekly",
    notes: "Standard employment, taxes deducted at source.",
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
