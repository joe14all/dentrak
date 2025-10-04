import Dexie from "dexie";

export const db = new Dexie("DentrakDatabase");

// Version 1: The original schema
db.version(1).stores({
  practices: "++id, name, status, taxStatus",
  entries: "++id, practiceId, date",
  cheques: "++id, practiceId, dateReceived, status",
});

// Version 2: Upgraded schema to add the necessary index
// This tells Dexie that we want to be able to efficiently query the 'entryType' field.
db.version(2).stores({
  entries: "++id, practiceId, date, entryType", // Added 'entryType' index
});

// You can add future schema upgrades here, e.g., db.version(3)...
