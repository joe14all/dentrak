import Dexie from "dexie";

export const db = new Dexie("DentrakDatabase");

// This is the correct, consolidated schema for your application.
// Version 5 corrects the index names for transaction tables.
db.version(5).stores({
  // Tables from previous versions, carried forward:
  practices: "++id, name, status, taxStatus",
  entries: "++id, practiceId, date, entryType",
  payments: "++id, practiceId, paymentDate",

  // Updated and new tables for this version:
  cheques: "++id, practiceId, status, dateReceived",
  // CORRECTED: The field is 'paymentDate' in the mock data, not 'transactionDate'
  directDeposits: "++id, practiceId, paymentDate",
  eTransfers: "++id, practiceId, status, paymentDate", // CORRECTED here as well
});
