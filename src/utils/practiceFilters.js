/**
 * Utility functions for filtering practices based on archived status and dates
 */

/**
 * Determines if a practice should be included for a given month/year
 *
 * Logic:
 * - Active practices are always included
 * - Archived practices are included for months up to and including the archive month
 * - Archived practices are excluded for months after the archive month
 *
 * @param {Object} practice - The practice object
 * @param {number} year - The year to check (e.g., 2026)
 * @param {number} month - The month to check (0-indexed, 0 = January)
 * @returns {boolean} - True if the practice should be included for this period
 */
export const shouldIncludePracticeForMonth = (practice, year, month) => {
  // Always include active practices
  if (practice.status !== "archived" || !practice.archivedDate) {
    return true;
  }

  // Parse the archived date (format: YYYY-MM-DD)
  const [archivedYear, archivedMonth] = practice.archivedDate
    .split("-")
    .map((num) => parseInt(num, 10));

  // Convert to comparable format (YYYYMM)
  const periodValue = year * 100 + (month + 1); // month is 0-indexed, so add 1
  const archivedValue = archivedYear * 100 + archivedMonth;

  // Include if the period is on or before the archived month
  return periodValue <= archivedValue;
};

/**
 * Filters an array of practices for a specific month/year
 *
 * @param {Array} practices - Array of practice objects
 * @param {number} year - The year to filter for
 * @param {number} month - The month to filter for (0-indexed)
 * @returns {Array} - Filtered array of practices
 */
export const filterPracticesForMonth = (practices, year, month) => {
  return practices.filter((practice) =>
    shouldIncludePracticeForMonth(practice, year, month),
  );
};

/**
 * Filters practices for "current" context (typically used in dashboards showing current month)
 *
 * @param {Array} practices - Array of practice objects
 * @returns {Array} - Filtered array of practices for current month
 */
export const filterPracticesForCurrent = (practices) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return filterPracticesForMonth(practices, currentYear, currentMonth);
};

/**
 * Determines if a practice should be included for a date range
 * A practice is included if it was active (not archived) for any part of the date range
 *
 * @param {Object} practice - The practice object
 * @param {string|null} startDate - Start date in YYYY-MM-DD format (null = no start limit)
 * @param {string|null} endDate - End date in YYYY-MM-DD format (null = no end limit)
 * @returns {boolean} - True if the practice should be included
 */
export const shouldIncludePracticeForDateRange = (
  practice,
  startDate,
  endDate,
) => {
  // Always include active practices
  if (practice.status !== "archived" || !practice.archivedDate) {
    return true;
  }

  // If no start date specified, include all archived practices
  if (!startDate) {
    return true;
  }

  // Parse archived date (YYYY-MM-DD)
  const archivedDate = practice.archivedDate;

  // The practice should be included if it was archived on or after the start date
  // This means it was active during some portion of the date range
  return archivedDate >= startDate;
};

/**
 * Filters practices for a date range (for year-to-date, last N months, etc.)
 *
 * @param {Array} practices - Array of practice objects
 * @param {string|null} startDate - Start date in YYYY-MM-DD format
 * @param {string|null} endDate - End date in YYYY-MM-DD format
 * @returns {Array} - Filtered array of practices
 */
export const filterPracticesForDateRange = (practices, startDate, endDate) => {
  return practices.filter((practice) =>
    shouldIncludePracticeForDateRange(practice, startDate, endDate),
  );
};
