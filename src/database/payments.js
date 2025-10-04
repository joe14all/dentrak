/* eslint-disable no-unused-vars */
import { db } from "./db";
import { mockPayments } from "./mockData";

/**
 * Populates the payments table with mock data if it's empty.
 */
export const populatePayments = async () => {
  const count = await db.payments.count();
  if (count === 0) {
    console.log("Populating payments with mock data...");
    const paymentsWithoutIds = mockPayments.map(({ id, ...rest }) => rest);
    await db.payments.bulkAdd(paymentsWithoutIds);
  }
};

/**
 * Gets all payments from the database, sorted by date.
 * @returns {Promise<import('./mockPayments').Payment[]>}
 */
export const getAllPayments = async () => {
  return await db.payments.orderBy("paymentDate").reverse().toArray();
};

/**
 * Adds a new payment to the database.
 * @param {Omit<import('./mockPayments').Payment, 'id'>} payment
 */
export const addPayment = async (payment) => {
  return await db.payments.add(payment);
};

/**
 * Updates an existing payment by its ID.
 * @param {number} id
 * @param {Partial<import('./mockPayments').Payment>} updatedData
 */
export const updatePayment = async (id, updatedData) => {
  return await db.payments.update(id, updatedData);
};

/**
 * Deletes a payment by its ID.
 * @param {number} id
 */
export const deletePayment = async (id) => {
  return await db.payments.delete(id);
};
