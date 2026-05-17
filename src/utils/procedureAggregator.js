/**
 * Procedure Aggregator
 * Combines multiple procedures for the same patient on the same day
 */

/**
 * Aggregate procedures by patient and date, combining multiple procedures
 * @param {Array} procedures - Raw procedures from PDF parser
 * @param {number} practiceId - The practice ID to associate with entries
 * @returns {Array} Aggregated entry objects ready for import
 */
export const aggregateProcedures = (procedures, practiceId) => {
  // Group procedures by patient and date
  const grouped = {};

  procedures.forEach((proc) => {
    const key = `${proc.date}|${proc.patientName}`;

    if (!grouped[key]) {
      grouped[key] = {
        date: proc.date,
        patientName: proc.patientName,
        procedures: [],
      };
    }

    grouped[key].procedures.push(proc);
  });

  // Convert grouped data to entry format
  const entries = Object.values(grouped).map((group) => {
    return createAggregatedEntry(group, practiceId);
  });

  // Sort by date (most recent first)
  entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Verify totals after aggregation
  const totalProduction = entries.reduce(
    (sum, e) => sum + (e.production || 0),
    0,
  );
  const totalCollection = entries.reduce(
    (sum, e) => sum + (e.collection || 0),
    0,
  );
  console.log("After aggregation - Entries:", entries.length);
  console.log(
    "After aggregation - Total Production:",
    totalProduction.toFixed(2),
  );
  console.log(
    "After aggregation - Total Collection:",
    totalCollection.toFixed(2),
  );

  return entries;
};

/**
 * Create a single aggregated entry from grouped procedures
 * @param {Object} group - Grouped procedures for one patient/date
 * @param {number} practiceId - Practice ID
 * @returns {Object} Entry object
 */
const createAggregatedEntry = (group, practiceId) => {
  const { date, patientName, procedures } = group;

  // Calculate totals
  const totalProduction = procedures.reduce(
    (sum, proc) => sum + proc.charges,
    0,
  );
  const totalCollection = procedures.reduce(
    (sum, proc) => sum + proc.payments,
    0,
  );

  // Combine procedure codes (exclude PAYMENT placeholders)
  const procedureCodes = procedures
    .filter((proc) => proc.code !== "PAYMENT")
    .map((proc) => proc.code)
    .join(", ");

  // Create detailed notes with all procedures
  const notes = procedures
    .filter((proc) => proc.code !== "PAYMENT")
    .map((proc) => {
      const tooth = proc.tooth ? `${proc.tooth}-` : "";
      const surface = proc.surface ? `-${proc.surface}` : "";
      return `${tooth}${proc.code}${surface} (${proc.description})`;
    })
    .join("; ");

  // Count only actual procedures (not payments)
  const actualProcedureCount = procedures.filter(
    (proc) => proc.code !== "PAYMENT",
  ).length;

  // Create the entry object matching the Entry data model
  return {
    practiceId: practiceId,
    entryType: "individualProcedure",
    date: date,
    patientId: patientName,
    procedureCode: procedureCodes,
    production: totalProduction,
    collection: totalCollection,
    adjustments: [],
    notes: notes,
    procedureCount: actualProcedureCount, // Extra field for UI display
  };
};

/**
 * Split a combined entry back into individual procedures
 * (Utility function if user wants to separate combined entries)
 * @param {Object} entry - Combined entry
 * @param {Array} originalProcedures - Original procedure data
 * @returns {Array} Array of individual entries
 */
export const splitEntry = (entry, originalProcedures) => {
  const matchingProcs = originalProcedures.filter(
    (proc) => proc.date === entry.date && proc.patientName === entry.patientId,
  );

  return matchingProcs.map((proc) => ({
    practiceId: entry.practiceId,
    entryType: "individualProcedure",
    date: proc.date,
    patientId: proc.patientName,
    procedureCode: proc.code,
    production: proc.charges,
    collection: proc.payments,
    adjustments: [],
    notes: `${proc.tooth ? proc.tooth + "-" : ""}${proc.code}${proc.surface ? "-" + proc.surface : ""} (${proc.description})`,
  }));
};

/**
 * Validate aggregated entries before import
 * @param {Array} entries - Entries to validate
 * @returns {Object} Validation result with errors
 */
export const validateEntries = (entries) => {
  const errors = [];
  const warnings = [];

  entries.forEach((entry, index) => {
    // Check required fields
    if (!entry.date) {
      errors.push(`Entry ${index + 1}: Missing date`);
    }

    if (!entry.patientId) {
      errors.push(`Entry ${index + 1}: Missing patient name`);
    }

    if (!entry.practiceId) {
      errors.push(`Entry ${index + 1}: Missing practice ID`);
    }

    // Check for suspicious values
    if (entry.production < 0) {
      warnings.push(
        `Entry ${index + 1} (${entry.patientId}): Negative production value`,
      );
    }

    if (entry.collection < 0) {
      warnings.push(
        `Entry ${index + 1} (${entry.patientId}): Negative collection value`,
      );
    }

    if (entry.collection > entry.production) {
      warnings.push(
        `Entry ${index + 1} (${entry.patientId}): Collection exceeds production`,
      );
    }

    // Check date validity
    const entryDate = new Date(entry.date);
    if (isNaN(entryDate.getTime())) {
      errors.push(`Entry ${index + 1}: Invalid date format`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Generate a summary of entries for preview
 * @param {Array} entries - Entries to summarize
 * @returns {Object} Summary statistics
 */
export const generateEntrySummary = (entries) => {
  const summary = {
    totalEntries: entries.length,
    totalProduction: 0,
    totalCollection: 0,
    totalProcedures: 0,
    dateRange: {
      earliest: null,
      latest: null,
    },
    uniquePatients: new Set(),
    averageProductionPerEntry: 0,
    averageCollectionPerEntry: 0,
  };

  entries.forEach((entry) => {
    summary.totalProduction += entry.production || 0;
    summary.totalCollection += entry.collection || 0;
    summary.totalProcedures += entry.procedureCount || 1;
    summary.uniquePatients.add(entry.patientId);

    const entryDate = new Date(entry.date);
    if (!summary.dateRange.earliest || entryDate < summary.dateRange.earliest) {
      summary.dateRange.earliest = entryDate;
    }
    if (!summary.dateRange.latest || entryDate > summary.dateRange.latest) {
      summary.dateRange.latest = entryDate;
    }
  });

  if (entries.length > 0) {
    summary.averageProductionPerEntry =
      summary.totalProduction / entries.length;
    summary.averageCollectionPerEntry =
      summary.totalCollection / entries.length;
  }

  summary.uniquePatients = summary.uniquePatients.size;

  return summary;
};
