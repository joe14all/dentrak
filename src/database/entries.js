/* eslint-disable no-unused-vars */
import { db } from "./db";
import { mockEntries } from "./mockData";

// This function is now smarter and can handle adding missing mock data.
export const populateEntries = async () => {
  const count = await db.entries.count();
  if (count === 0) {
    console.log("Populating entries for the first time...");
    const entriesWithoutIds = mockEntries.map(({ id, ...rest }) => rest);
    await db.entries.bulkAdd(entriesWithoutIds);
  } else {
    // If the DB isn't empty, check specifically for attendance records.
    const attendanceCount = await db.entries
      .where("entryType")
      .equals("attendanceRecord")
      .count();
    if (attendanceCount === 0) {
      console.log(
        "Database exists, but adding missing attendance mock entries..."
      );
      const attendanceEntries = mockEntries
        .filter((e) => e.entryType === "attendanceRecord")
        .map(({ id, ...rest }) => rest); // Still remove hardcoded IDs
      if (attendanceEntries.length > 0) {
        await db.entries.bulkAdd(attendanceEntries);
      }
    }
  }
};

// Get all entries from the database
export const getAllEntries = async () => {
  return await db.entries.toArray();
};

// Get entries for a specific practice, sorted by date
export const getEntriesForPractice = async (practiceId) => {
  return await db.entries.where("practiceId").equals(practiceId).sortBy("date");
};

// Add a new entry
export const addEntry = async (entry) => {
  return await db.entries.add(entry);
};

// Update an existing entry
export const updateEntry = async (id, updatedData) => {
  return await db.entries.update(id, updatedData);
};

// Delete an entry by its ID
export const deleteEntry = async (id) => {
  return await db.entries.delete(id);
};
