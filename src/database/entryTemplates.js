import { db } from "./db";

/**
 * @typedef {Object} EntryTemplate
 * @property {number} [id] - Unique identifier (auto-generated)
 * @property {string} name - Template name (e.g., "Typical Tuesday at All Care Dental")
 * @property {number} practiceId - The practice this template is for
 * @property {'dailySummary' | 'periodSummary' | 'individualProcedure' | 'attendanceRecord'} entryType - Type of entry
 * @property {number} [production] - Default production amount
 * @property {number} [collection] - Default collection amount
 * @property {Array<{name: string, amount: number, type: string}>} [adjustments] - Default adjustments
 * @property {string} [checkInTime] - For attendance records
 * @property {string} [checkOutTime] - For attendance records
 * @property {string} [notes] - Default notes
 * @property {string} [patientId] - Default patient ID
 * @property {string} [procedureCode] - Default procedure code
 * @property {string} createdAt - ISO date string when template was created
 */

/**
 * Gets all entry templates from the database, sorted by practice and name.
 * @returns {Promise<EntryTemplate[]>}
 */
export const getAllEntryTemplates = async () => {
  try {
    const templates = await db.entryTemplates.toArray();
    // Sort by practice ID, then by name
    return templates.sort((a, b) => {
      if (a.practiceId !== b.practiceId) {
        return a.practiceId - b.practiceId;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Failed to get entry templates:", error);
    return [];
  }
};

/**
 * Gets all templates for a specific practice.
 * @param {number} practiceId
 * @returns {Promise<EntryTemplate[]>}
 */
export const getTemplatesByPractice = async (practiceId) => {
  try {
    const templates = await db.entryTemplates
      .where("practiceId")
      .equals(practiceId)
      .toArray();
    return templates.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to get templates for practice:", error);
    return [];
  }
};

/**
 * Adds a new entry template to the database.
 * @param {Omit<EntryTemplate, 'id' | 'createdAt'>} template
 * @returns {Promise<number>} The ID of the newly added template.
 */
export const addEntryTemplate = async (template) => {
  try {
    // Validation
    if (!template.name || !template.practiceId || !template.entryType) {
      throw new Error(
        "Template name, practice ID, and entry type are required."
      );
    }

    const templateWithTimestamp = {
      ...template,
      createdAt: new Date().toISOString(),
    };

    return await db.entryTemplates.add(templateWithTimestamp);
  } catch (error) {
    console.error("Failed to add entry template:", error);
    throw error;
  }
};

/**
 * Updates an existing entry template.
 * @param {number} id
 * @param {Partial<EntryTemplate>} updatedData
 * @returns {Promise<number>}
 */
export const updateEntryTemplate = async (id, updatedData) => {
  try {
    return await db.entryTemplates.update(id, updatedData);
  } catch (error) {
    console.error("Failed to update entry template:", error);
    throw error;
  }
};

/**
 * Deletes an entry template by its ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteEntryTemplate = async (id) => {
  try {
    return await db.entryTemplates.delete(id);
  } catch (error) {
    console.error("Failed to delete entry template:", error);
    throw error;
  }
};

/**
 * Creates an entry object from a template.
 * @param {EntryTemplate} template
 * @param {string} date - The date for the new entry (YYYY-MM-DD)
 * @returns {Object} Entry data ready to be saved
 */
export const createEntryFromTemplate = (template, date) => {
  const entry = {
    practiceId: template.practiceId,
    entryType: template.entryType,
    date: date,
  };

  // Copy over relevant fields based on entry type
  if (template.entryType !== "attendanceRecord") {
    if (template.production !== undefined)
      entry.production = template.production;
    if (template.collection !== undefined)
      entry.collection = template.collection;
    if (template.adjustments) entry.adjustments = [...template.adjustments];
  }

  if (template.entryType === "attendanceRecord") {
    if (template.checkInTime) entry.checkInTime = template.checkInTime;
    if (template.checkOutTime) entry.checkOutTime = template.checkOutTime;
  }

  if (template.entryType === "individualProcedure") {
    if (template.patientId) entry.patientId = template.patientId;
    if (template.procedureCode) entry.procedureCode = template.procedureCode;
  }

  if (template.notes) entry.notes = template.notes;

  return entry;
};

/**
 * Generates multiple entries from a template for a date range.
 * Only creates entries for non-blocked dates.
 * @param {EntryTemplate} template
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string[]} daysOfWeek - Array of days to include (e.g., ['Monday', 'Wednesday', 'Friday'])
 * @param {Function} isDateBlockedFn - Function to check if a date is blocked
 * @returns {Array<Object>} Array of entry objects ready to be saved
 */
export const generateEntriesFromTemplate = (
  template,
  startDate,
  endDate,
  daysOfWeek,
  isDateBlockedFn
) => {
  const entries = [];
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  // Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
  const dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const targetDays = daysOfWeek.map((day) => dayMap[day]);

  // Iterate through each day in the range
  for (
    let date = new Date(start);
    date <= end;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const dayOfWeek = date.getUTCDay();
    const dateStr = date.toISOString().split("T")[0];

    // Check if this day is in our target days and not blocked
    if (targetDays.includes(dayOfWeek) && !isDateBlockedFn(dateStr)) {
      entries.push(createEntryFromTemplate(template, dateStr));
    }
  }

  return entries;
};
