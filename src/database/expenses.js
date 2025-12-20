import { db } from "./db";

/**
 * Common expense categories for tax deductions
 */
export const EXPENSE_CATEGORIES = {
  // Vehicle & Travel
  MILEAGE: "Mileage",
  PARKING: "Parking & Tolls",
  TRAVEL: "Travel & Lodging",

  // Professional Development
  CONTINUING_ED: "Continuing Education",
  PROFESSIONAL_DUES: "Professional Dues & Memberships",
  SUBSCRIPTIONS: "Professional Subscriptions",

  // Office & Equipment
  SUPPLIES: "Office Supplies",
  EQUIPMENT: "Equipment & Tools",
  SOFTWARE: "Software & Technology",

  // Insurance & Healthcare
  MALPRACTICE: "Malpractice Insurance",
  HEALTH_INSURANCE: "Health Insurance",
  DISABILITY_INSURANCE: "Disability Insurance",

  // Professional Services
  ACCOUNTING: "Accounting & Tax Prep",
  LEGAL: "Legal Fees",
  CONSULTING: "Consulting Services",

  // Marketing & Business
  MARKETING: "Marketing & Advertising",
  PHONE: "Phone & Internet",
  MEALS: "Business Meals (50% deductible)",

  // Other
  UNIFORMS: "Uniforms & Scrubs",
  LICENSES: "Licenses & Permits",
  OTHER: "Other Business Expense",
};

/**
 * Get all expenses from the database
 * @returns {Promise<Array>}
 */
export async function getAllExpenses() {
  try {
    return await db.expenses.toArray();
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

/**
 * Get expenses for a specific year
 * @param {number} year
 * @returns {Promise<Array>}
 */
export async function getExpensesByYear(year) {
  try {
    return await db.expenses.where("year").equals(year).toArray();
  } catch (error) {
    console.error("Error fetching expenses by year:", error);
    return [];
  }
}

/**
 * Get expenses by category for a specific year
 * @param {number} year
 * @param {string} category
 * @returns {Promise<Array>}
 */
export async function getExpensesByYearAndCategory(year, category) {
  try {
    return await db.expenses
      .where("[year+category]")
      .equals([year, category])
      .toArray();
  } catch (error) {
    console.error("Error fetching expenses by year and category:", error);
    return [];
  }
}

/**
 * Get expenses for a specific practice
 * @param {number} practiceId
 * @returns {Promise<Array>}
 */
export async function getExpensesByPractice(practiceId) {
  try {
    return await db.expenses.where("practiceId").equals(practiceId).toArray();
  } catch (error) {
    console.error("Error fetching expenses by practice:", error);
    return [];
  }
}

/**
 * Get expenses within a date range
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {Promise<Array>}
 */
export async function getExpensesByDateRange(startDate, endDate) {
  try {
    return await db.expenses
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray();
  } catch (error) {
    console.error("Error fetching expenses by date range:", error);
    return [];
  }
}

/**
 * Add a new expense
 * @param {Object} expense
 * @returns {Promise<number>} - The ID of the newly created expense
 */
export async function addExpense(expense) {
  try {
    // Extract year from date for indexing
    const date = new Date(expense.date);
    const year = date.getFullYear();

    const expenseToAdd = {
      ...expense,
      year,
      createdAt: new Date().toISOString(),
    };

    return await db.expenses.add(expenseToAdd);
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
}

/**
 * Update an existing expense
 * @param {number} id
 * @param {Object} updates
 * @returns {Promise<number>}
 */
export async function updateExpense(id, updates) {
  try {
    // If date changed, recalculate year
    if (updates.date) {
      const date = new Date(updates.date);
      updates.year = date.getFullYear();
    }

    return await db.expenses.update(id, updates);
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
}

/**
 * Delete an expense
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteExpense(id) {
  try {
    await db.expenses.delete(id);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
}

/**
 * Calculate total expenses by category for a given year
 * @param {number} year
 * @returns {Promise<Object>} - Object with category totals
 */
export async function getExpenseTotalsByCategory(year) {
  try {
    const expenses = await getExpensesByYear(year);
    const totals = {};

    expenses.forEach((expense) => {
      const category = expense.category || "Other";
      if (!totals[category]) {
        totals[category] = 0;
      }
      totals[category] += expense.amount || 0;
    });

    return totals;
  } catch (error) {
    console.error("Error calculating category totals:", error);
    return {};
  }
}

/**
 * Calculate quarterly expense totals for tax planning
 * @param {number} year
 * @returns {Promise<Array>}
 */
export async function getQuarterlyExpenseTotals(year) {
  try {
    const expenses = await getExpensesByYear(year);
    const quarters = [
      { name: "Q1", months: [0, 1, 2], total: 0, expenses: [] },
      { name: "Q2", months: [3, 4, 5], total: 0, expenses: [] },
      { name: "Q3", months: [6, 7, 8], total: 0, expenses: [] },
      { name: "Q4", months: [9, 10, 11], total: 0, expenses: [] },
    ];

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const month = date.getMonth();
      const quarter = quarters.find((q) => q.months.includes(month));

      if (quarter) {
        quarter.total += expense.amount || 0;
        quarter.expenses.push(expense);
      }
    });

    return quarters;
  } catch (error) {
    console.error("Error calculating quarterly totals:", error);
    return [];
  }
}
