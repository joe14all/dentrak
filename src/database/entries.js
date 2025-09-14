import { db } from "./db";
import { mockEntries } from "./mockData";

// Function to populate the entries table from mock data if it's empty
export const populateEntries = async () => {
  const count = await db.entries.count();
  if (count === 0) {
    console.log("Populating entries with mock data...");
    await db.entries.bulkAdd(mockEntries);
  }
};

// Get all entries from the database
export const getAllEntries = async () => {
  return await db.entries.toArray();
};

// Get entries for a specific practice
export const getEntriesForPractice = async (practiceId) => {
  return await db.entries.where("practiceId").equals(practiceId).toArray();
};

// Add a new entry
export const addEntry = async (entry) => {
  return await db.entries.add(entry);
};
