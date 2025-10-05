/* eslint-disable no-unused-vars */
import { db } from "./db";
import { mockDirectDeposits } from "./mockData";

/**
 * Populates the directDeposits table with mock data if it's empty.
 */
export const populateDirectDeposits = async () => {
  const count = await db.directDeposits.count();
  if (count === 0) {
    console.log("Populating direct deposits with mock data...");
    const depositsWithoutIds = mockDirectDeposits.map(
      ({ id, ...rest }) => rest
    );
    await db.directDeposits.bulkAdd(depositsWithoutIds);
  }
};

/**
 * Gets all direct deposits from the database, sorted by payment date.
 * @returns {Promise<import('./mockTransactions').DirectDeposit[]>}
 */
export const getAllDirectDeposits = async () => {
  return await db.directDeposits.orderBy("paymentDate").reverse().toArray();
};

/**
 * Adds a new direct deposit record.
 * @param {Omit<import('./mockTransactions').DirectDeposit, 'id'>} deposit
 */
export const addDirectDeposit = async (deposit) => {
  return await db.directDeposits.add(deposit);
};

/**
 * Updates an existing direct deposit record by its ID.
 * @param {number} id
 * @param {Partial<import('./mockTransactions').DirectDeposit>} updatedData
 */
export const updateDirectDeposit = async (id, updatedData) => {
  return await db.directDeposits.update(id, updatedData);
};

/**
 * Deletes a direct deposit record by its ID.
 * @param {number} id
 */
export const deleteDirectDeposit = async (id) => {
  return await db.directDeposits.delete(id);
};
