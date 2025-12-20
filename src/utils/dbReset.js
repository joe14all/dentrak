import { db } from "../database/db";

/**
 * Deletes and recreates the database
 * WARNING: This will delete ALL data!
 */
export async function resetDatabase() {
  try {
    console.log("Closing database...");
    db.close();

    console.log("Deleting database...");
    await db.delete();

    console.log("Database deleted successfully!");
    console.log("Page will reload to reinitialize...");

    // Reload the page to reinitialize everything
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    return true;
  } catch (error) {
    console.error("Failed to reset database:", error);
    return false;
  }
}

/**
 * Checks database health and auto-resets if corrupted
 */
export async function checkAndFixDatabase() {
  try {
    await db.open();
    console.log("✅ Database is healthy");
    return true;
  } catch (error) {
    console.error("❌ Database health check failed:", error);

    if (error.name === "DatabaseClosedError" || error.name === "VersionError") {
      console.log("🔧 Attempting automatic database reset...");
      await resetDatabase();
    }
    return false;
  }
}

// Make it available in console for debugging
if (typeof window !== "undefined") {
  window.resetDatabase = resetDatabase;
  window.checkAndFixDatabase = checkAndFixDatabase;

  // Auto-check on load
  checkAndFixDatabase();
}
