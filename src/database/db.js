import Dexie from "dexie";

export const db = new Dexie("DentrakDatabase");

// Version 6: Adds a new table to store user preferences, including dashboard layout.
db.version(6).stores({
  practices: "++id, name, status, taxStatus",
  entries: "++id, practiceId, date, entryType",
  payments: "++id, practiceId, paymentDate",
  cheques: "++id, practiceId, status, dateReceived",
  directDeposits: "++id, practiceId, paymentDate",
  eTransfers: "++id, practiceId, status, paymentDate",

  // New table for storing key-value preferences.
  preferences: "++key",
});
