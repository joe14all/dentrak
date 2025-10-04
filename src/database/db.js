import Dexie from "dexie";

export const db = new Dexie("DentrakDatabase");

// Version 1: The original schema
db.version(1).stores({
  practices: "++id, name, status, taxStatus",
  entries: "++id, practiceId, date",
  cheques: "++id, practiceId, dateReceived, status",
});

// Version 2: Added index for entryType
db.version(2).stores({
  entries: "++id, practiceId, date, entryType",
});

// Version 3: Added the new 'payments' table
db.version(3).stores({
  payments: "++id, practiceId, paymentDate", // Indexed for efficient queries
});
