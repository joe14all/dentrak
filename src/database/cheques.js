/* eslint-disable no-unused-vars */
import { db } from "./db";
import { mockCheques } from "./mockData";

/**
 * Populates the cheques table with mock data if it's empty.
 */
export const populateCheques = async () => {
  const count = await db.cheques.count();
  if (count === 0) {
    console.log("Populating cheques with mock data...");
    // Dexie handles auto-incrementing IDs, so we remove them from mock data
    const chequesWithoutIds = mockCheques.map(({ id, ...rest }) => rest);
    await db.cheques.bulkAdd(chequesWithoutIds);
  }
};

/**
 * Gets all cheques from the database, sorted by date received.
 * @returns {Promise<import('./mockTransactions').Cheque[]>}
 */
export const getAllCheques = async () => {
  return await db.cheques.orderBy("dateReceived").reverse().toArray();
};

/**
 * Adds a new cheque to the database.
 * @param {Omit<import('./mockTransactions').Cheque, 'id'>} cheque
 */
export const addCheque = async (cheque) => {
  return await db.cheques.add(cheque);
};

/**
 * Updates an existing cheque by its ID.
 * @param {number} id
 * @param {Partial<import('./mockTransactions').Cheque>} updatedData
 */
export const updateCheque = async (id, updatedData) => {
  return await db.cheques.update(id, updatedData);
};

/**
 * Deletes a cheque by its ID.
 * @param {number} id
 */
export const deleteCheque = async (id) => {
  return await db.cheques.delete(id);
};
