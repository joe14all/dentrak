/* eslint-disable no-unused-vars */
import { db } from "./db";
import { mockETransfers } from "./mockData";

/**
 * Populates the eTransfers table with mock data if it's empty.
 */
export const populateETransfers = async () => {
  const count = await db.eTransfers.count();
  if (count === 0) {
    console.log("Populating e-transfers with mock data...");
    const transfersWithoutIds = mockETransfers.map(({ id, ...rest }) => rest);
    await db.eTransfers.bulkAdd(transfersWithoutIds);
  }
};

/**
 * Gets all e-transfers from the database, sorted by payment date.
 * @returns {Promise<import('./mockTransactions').ETransfer[]>}
 */
export const getAllETransfers = async () => {
  return await db.eTransfers.orderBy("paymentDate").reverse().toArray();
};

/**
 * Adds a new e-transfer record.
 * @param {Omit<import('./mockTransactions').ETransfer, 'id'>} transfer
 */
export const addETransfer = async (transfer) => {
  return await db.eTransfers.add(transfer);
};

/**
 * Updates an existing e-transfer record by its ID.
 * @param {number} id
 * @param {Partial<import('./mockTransactions').ETransfer>} updatedData
 */
export const updateETransfer = async (id, updatedData) => {
  return await db.eTransfers.update(id, updatedData);
};

/**
 * Deletes an e-transfer record by its ID.
 * @param {number} id
 */
export const deleteETransfer = async (id) => {
  return await db.eTransfers.delete(id);
};
