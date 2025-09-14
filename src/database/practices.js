import { db } from "./db";
import { mockPractices } from "./mockData";

// Function to populate the practices table from mock data if it's empty
export const populatePractices = async () => {
  const count = await db.practices.count();
  if (count === 0) {
    console.log("Populating practices with mock data...");
    await db.practices.bulkAdd(mockPractices);
  }
};

// Get all practices from the database
export const getAllPractices = async () => {
  return await db.practices.toArray();
};

// Add a new practice
export const addPractice = async (practice) => {
  return await db.practices.add(practice);
};

// Update an existing practice
export const updatePractice = async (id, updatedData) => {
  return await db.practices.update(id, updatedData);
};

// Delete a practice
export const deletePractice = async (id) => {
  // In a real app, you would also delete associated entries and cheques
  return await db.practices.delete(id);
};
