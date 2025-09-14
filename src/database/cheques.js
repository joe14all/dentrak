import { db } from "./db";
import { mockCheques } from "./mockData";

// Function to populate the cheques table from mock data if it's empty
export const populateCheques = async () => {
  const count = await db.cheques.count();
  if (count === 0) {
    console.log("Populating cheques with mock data...");
    await db.cheques.bulkAdd(mockCheques);
  }
};

// Get all cheques from the database, sorted by date received
export const getAllCheques = async () => {
  return await db.cheques.orderBy("dateReceived").reverse().toArray();
};

// Add a new cheque
export const addCheque = async (cheque) => {
  return await db.cheques.add(cheque);
};

// Update the status of a cheque
export const updateChequeStatus = async (id, status) => {
  return await db.cheques.update(id, { status });
};
