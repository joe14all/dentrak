import Dexie from "dexie";

// Create a new Dexie database instance
export const db = new Dexie("DentrakDatabase");

// Define the database schema
db.version(1).stores({
  practices: "++id, name", // '++id' is an auto-incrementing primary key, 'name' is an indexed property
  entries: "++id, practiceId, date", // Indexing by practiceId and date for efficient lookups
  cheques: "++id, practiceId, dateReceived, status", // Indexing for filtering
});
