import { db } from "./db";

const LAYOUT_PREFERENCE_KEY = "dashboardLayout";

// The default layout is now a simple array of widget IDs, defining their order.
export const defaultLayout = [
  "kpi-production",
  "kpi-collection",
  "kpi-days-worked",
  "kpi-outstanding-cheques",
  "quick-actions",
  "alerts",
  "recent-activity",
  "practice-summary",
];

/**
 * Gets the saved dashboard layout order from the database.
 * If no layout is saved, it returns the default.
 */
export const getDashboardLayout = async () => {
  const savedPreference = await db.preferences.get(LAYOUT_PREFERENCE_KEY);
  if (savedPreference && savedPreference.value) {
    return savedPreference.value;
  }
  // If nothing is saved, save the default layout for next time.
  await db.preferences.put({
    key: LAYOUT_PREFERENCE_KEY,
    value: defaultLayout,
  });
  return defaultLayout;
};

/**
 * Saves the new widget order to the database.
 * @param {string[]} layout The new array of widget IDs.
 */
export const saveDashboardLayout = async (layout) => {
  return await db.preferences.put({
    key: LAYOUT_PREFERENCE_KEY,
    value: layout,
  });
};
