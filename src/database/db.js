import Dexie from "dexie";

export const db = new Dexie("DentrakDatabase");

// Increment the version number from 6 to 7
db.version(7)
  .stores({
    practices: "++id, name, status, taxStatus",
    entries: "++id, practiceId, date, entryType",
    // Add '&linkedChequeId' to index this field (the '&' makes it optional/sparse)
    payments: "++id, practiceId, paymentDate, &linkedChequeId",
    cheques: "++id, practiceId, status, dateReceived",
    directDeposits: "++id, practiceId, paymentDate",
    eTransfers: "++id, practiceId, status, paymentDate",
    // Define reports store if it wasn't explicitly defined before (or keep existing definition)
    reports: "++id, createdAt", // Example definition, adjust if needed
  })
  // eslint-disable-next-line no-unused-vars
  .upgrade((tx) => {
    // Optional: Add upgrade logic here if needed for existing data,
    // but for just adding an index, Dexie often handles it automatically.
    console.log(
      "Upgrading database schema to version 7: Added index for linkedChequeId on payments."
    );
  });

// If you had older versions, keep them but make sure the latest one is version 7
// Example: Keep version 6 definition if it exists
db.version(6).stores({
  practices: "++id, name, status, taxStatus",
  entries: "++id, practiceId, date, entryType",
  payments: "++id, practiceId, paymentDate", // Old definition without the index
  cheques: "++id, practiceId, status, dateReceived",
  directDeposits: "++id, practiceId, paymentDate",
  eTransfers: "++id, practiceId, status, paymentDate",
  reports: "++id, createdAt", // Assuming reports was added in v6 or earlier
});

// Add other older versions if they exist below version 6...
