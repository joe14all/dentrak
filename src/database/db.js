import Dexie from "dexie";

export const db = new Dexie("DentrakDatabase");

// Version 6: Removes the 'preferences' table as the dashboard is no longer customizable.
db.version(6).stores({
  practices: "++id, name, status, taxStatus",
  entries: "++id, practiceId, date, entryType",
  payments: "++id, practiceId, paymentDate",
  cheques: "++id, practiceId, status, dateReceived",
  directDeposits: "++id, practiceId, paymentDate",
  eTransfers: "++id, practiceId, status, paymentDate",
});
