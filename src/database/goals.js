import { db } from "./db";

/**
 * @typedef {Object} Goal
 * @property {number} [id] - Unique identifier (auto-generated)
 * @property {'production' | 'collection' | 'income'} type - What the goal is tracking.
 * @property {'monthly' | 'annual'} timePeriod - The duration of the goal.
 * @property {number} year - The year the goal applies to.
 * @property {number} [month] - The month (0-11) if timePeriod is 'monthly'.
 * @property {number} [practiceId] - Optional: ID of the practice this goal applies to (null/undefined for overall goal).
 * @property {number} targetAmount - The target value for the goal.
 */

/**
 * Gets all goals from the database, sorted by year, then month.
 * @returns {Promise<Goal[]>}
 */
export const getAllGoals = async () => {
  try {
    // Sort primarily by year, then by month (if applicable)
    return await db.goals.orderBy("[year+month]").toArray();
  } catch (error) {
    console.error("Failed to get goals:", error);
    return [];
  }
};

/**
 * Adds a new goal to the database.
 * @param {Omit<Goal, 'id'>} goal
 * @returns {Promise<number>} The ID of the newly added goal.
 */
export const addGoal = async (goal) => {
  try {
    // Basic validation
    if (
      !goal.type ||
      !goal.timePeriod ||
      !goal.year ||
      goal.targetAmount == null
    ) {
      throw new Error(
        "Goal type, timePeriod, year, and targetAmount are required."
      );
    }
    if (goal.timePeriod === "monthly" && goal.month == null) {
      throw new Error("Month is required for monthly goals.");
    }
    // Ensure month is null/undefined for annual goals during add/update
    if (goal.timePeriod === "annual") {
      goal.month = undefined;
    }
    // Ensure practiceId is null if it's meant to be an overall goal
    if (goal.practiceId === "" || goal.practiceId === "overall") {
      goal.practiceId = null;
    }

    return await db.goals.add(goal);
  } catch (error) {
    console.error("Failed to add goal:", error);
    throw error;
  }
};

/**
 * Updates an existing goal by its ID.
 * @param {number} id
 * @param {Partial<Goal>} updatedData
 * @returns {Promise<number>} Returns 1 if successful, 0 otherwise.
 */
export const updateGoal = async (id, updatedData) => {
  try {
    // Ensure month is null/undefined for annual goals during update
    if (updatedData.timePeriod === "annual") {
      updatedData.month = undefined;
    }
    // Ensure practiceId is null if it's meant to be an overall goal
    if (updatedData.practiceId === "" || updatedData.practiceId === "overall") {
      updatedData.practiceId = null;
    }
    return await db.goals.update(id, updatedData);
  } catch (error) {
    console.error(`Failed to update goal ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a goal by its ID.
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteGoal = async (id) => {
  try {
    return await db.goals.delete(id);
  } catch (error) {
    console.error(`Failed to delete goal ${id}:`, error);
    throw error;
  }
};
