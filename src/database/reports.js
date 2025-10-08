/* eslint-disable no-unused-vars */
import { db } from "./db";
import { mockReports } from "./mockData";

/**
 * Populates the reports table with mock data if it's empty.
 */
export const populateReports = async () => {
  const count = await db.reports.count();
  if (count === 0) {
    console.log("Populating reports with mock data...");
    const reportsWithoutIds = mockReports.map(({ id, ...rest }) => rest);
    await db.reports.bulkAdd(reportsWithoutIds);
  }
};

/**
 * Gets all saved reports from the database, sorted by creation date.
 * @returns {Promise<import('./mockReports').Report[]>}
 */
export const getAllReports = async () => {
  return await db.reports.orderBy("createdAt").reverse().toArray();
};

/**
 * Adds a new report to the database.
 * @param {Omit<import('./mockReports').Report, 'id'>} report
 */
export const addReport = async (report) => {
  return await db.reports.add(report);
};

/**
 * Updates an existing report by its ID.
 * @param {number} id
 * @param {Partial<import('./mockReports').Report>} updatedData
 */
export const updateReport = async (id, updatedData) => {
  return await db.reports.update(id, updatedData);
};

/**
 * Deletes a report by its ID.
 * @param {number} id
 */
export const deleteReport = async (id) => {
  return await db.reports.delete(id);
};
