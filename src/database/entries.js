import { db } from "./db";
import { mockEntries } from "./mockData";

/**
 * Populates the entries table with mock data if it's empty.
 */
export const populateEntries = async () => {
  // Add log to see when this function is called
  console.log("Attempting to populate entries...");

  const count = await db.entries.count();

  // Add log to show the current count
  console.log(`Found ${count} existing entries in the database.`);

  if (count === 0) {
    console.log("Entries table is empty. Populating with mock data...");
    try {
      // eslint-disable-next-line no-unused-vars
      const entriesWithoutIds = mockEntries.map(({ id, ...rest }) => rest);
      await db.entries.bulkAdd(entriesWithoutIds);
      console.log("Successfully added mock entries.");
    } catch (error) {
      console.error("Error during bulkAdd for entries:", error);
    }
  } else {
    console.log("Entries table already contains data. Skipping population.");
  }
};

// --- Other functions remain the same ---
export const getAllEntries = async () => {
  return await db.entries.toArray();
};
export const addEntry = async (entry) => {
  return await db.entries.add(entry);
};
export const updateEntry = async (id, data) => {
  return await db.entries.update(id, data);
};
export const deleteEntry = async (id) => {
  return await db.entries.delete(id);
};
