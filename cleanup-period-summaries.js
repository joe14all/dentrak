// Temporary cleanup script for period summaries
// Run this in the browser console if needed

import { db } from './src/database/db';

/**
 * Delete all period summaries for a specific practice
 */
export async function cleanupPeriodSummaries(practiceId) {
  const deleted = await db.entries
    .where('practiceId')
    .equals(practiceId)
    .and(entry => entry.entryType === 'periodSummary')
    .delete();
  
  console.log(`✅ Deleted ${deleted} period summaries for practice ${practiceId}`);
  return deleted;
}

// Clean up practice 6 (Newbury Dental Group)
cleanupPeriodSummaries(6).then(() => {
  console.log('✅ Cleanup complete! Refresh the dashboard to see the changes.');
});
